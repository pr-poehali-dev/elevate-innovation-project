"""
Платежи через YooKassa (СБП и карты).
POST ?action=create — создать платёж
GET  ?action=check&order_id=X&user_id=Y — проверить статус
POST ?action=webhook — вебхук от YooKassa
GET  ?action=cheat_link&user_id=X&game=rust — получить ссылку на чит после оплаты
GET  ?action=set_link&requester_id=X&game=rust&link=URL — задать ссылку (admin)
"""
import json
import os
import uuid
import base64
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

PLANS = {
    "rust": {
        "30": 800,
        "90": 2200,
    },
    "cs2": {
        "30": 800,
        "90": 2200,
    },
    "brawl": {
        "7": 400,
        "30": 1400,
    },
}

GAME_NAMES = {
    "rust": "Rust",
    "cs2": "CS2",
    "brawl": "Brawl Stars",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def is_admin(cur, user_id):
    cur.execute("SELECT role FROM users WHERE id = %d" % int(user_id))
    row = cur.fetchone()
    return row and row[0] == "admin"

def yookassa_request(method, path, body=None):
    shop_id = os.environ["YOOKASSA_SHOP_ID"]
    secret_key = os.environ["YOOKASSA_SECRET_KEY"]
    token = base64.b64encode(("%s:%s" % (shop_id, secret_key)).encode()).decode()
    url = "https://api.yookassa.ru/v3%s" % path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Basic %s" % token)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    conn = get_db()
    cur = conn.cursor()

    # --- Создать платёж ---
    if action == "create":
        user_id = body.get("user_id")
        game = body.get("game", "")
        days = str(body.get("days", ""))

        if not user_id or game not in PLANS or days not in PLANS[game]:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверные параметры"})}

        amount = PLANS[game][days]
        idempotence_key = str(uuid.uuid4())

        payment_body = {
            "amount": {"value": "%.2f" % amount, "currency": "RUB"},
            "payment_method_data": {"type": "sbp"},
            "confirmation": {"type": "redirect", "return_url": "https://rounding.poehali.dev/dashboard?paid=1"},
            "capture": True,
            "description": "%s — %s дней" % (GAME_NAMES.get(game, game), days),
            "metadata": {"user_id": str(user_id), "game": game, "days": days},
        }

        try:
            resp = yookassa_request("POST", "/payments", {**payment_body, "idempotence_key": idempotence_key})
            payment_id = resp["id"]
            confirm_url = resp.get("confirmation", {}).get("confirmation_url", "")

            cur.execute(
                "INSERT INTO orders (user_id, game, days, amount, payment_id, status) VALUES (%s, %s, %s, %s, %s, 'pending') RETURNING id",
                (int(user_id), game, int(days), amount, payment_id)
            )
            order_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({
                "ok": True, "order_id": order_id, "payment_id": payment_id, "confirm_url": confirm_url
            })}
        except Exception as e:
            conn.close()
            return {"statusCode": 500, "headers": CORS_HEADERS, "body": json.dumps({"error": "Ошибка платёжной системы: %s" % str(e)})}

    # --- Проверить статус заказа ---
    if action == "check":
        order_id = params.get("order_id")
        user_id = params.get("user_id")
        if not order_id or not user_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нужен order_id и user_id"})}

        cur.execute("SELECT id, status, game, days, payment_id FROM orders WHERE id = %s AND user_id = %s" % (order_id, user_id))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Заказ не найден"})}

        order_status = row[1]
        if order_status == "pending":
            try:
                resp = yookassa_request("GET", "/payments/%s" % row[4])
                if resp.get("status") == "succeeded":
                    until = datetime.now() + timedelta(days=int(row[3]))
                    cur.execute("UPDATE orders SET status='paid', paid_at=NOW() WHERE id=%s" % int(order_id))
                    cur.execute("UPDATE users SET subscription_until='%s', role=COALESCE(role,'user') WHERE id=%s" % (until.isoformat(), int(user_id)))
                    conn.commit()
                    order_status = "paid"
            except:
                pass

        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({
            "status": order_status, "game": row[2], "days": row[3]
        })}

    # --- Вебхук от YooKassa ---
    if action == "webhook":
        event_data = body
        obj = event_data.get("object", {})
        if event_data.get("event") == "payment.succeeded":
            payment_id = obj.get("id")
            meta = obj.get("metadata", {})
            user_id = meta.get("user_id")
            days = meta.get("days")
            if payment_id and user_id and days:
                until = datetime.now() + timedelta(days=int(days))
                cur.execute("UPDATE orders SET status='paid', paid_at=NOW() WHERE payment_id='%s'" % payment_id)
                cur.execute("UPDATE users SET subscription_until='%s' WHERE id=%s" % (until.isoformat(), int(user_id)))
                conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # --- Получить ссылку на чит ---
    if action == "cheat_link":
        user_id = params.get("user_id")
        game = params.get("game", "")
        if not user_id or not game:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нужен user_id и game"})}

        cur.execute("SELECT subscription_until FROM users WHERE id = %d" % int(user_id))
        urow = cur.fetchone()
        if not urow or not urow[0] or urow[0] < datetime.now():
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Подписка не активна"})}

        cur.execute("SELECT link_url FROM cheat_links WHERE game = '%s'" % game)
        lrow = cur.fetchone()
        conn.close()
        if not lrow:
            return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Ссылка ещё не добавлена администратором"})}
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"link_url": lrow[0]})}

    # --- Установить ссылку на чит (admin) ---
    if action == "set_link":
        requester_id = params.get("requester_id")
        game = params.get("game", "")
        link = params.get("link", "")
        if not requester_id or not is_admin(cur, requester_id) or not game or not link:
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет доступа или неверные параметры"})}

        cur.execute(
            "INSERT INTO cheat_links (game, link_url) VALUES ('%s', '%s') ON CONFLICT (game) DO UPDATE SET link_url='%s', updated_at=NOW()" % (game, link, link)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # --- Список ссылок (admin) ---
    if action == "links":
        requester_id = params.get("requester_id")
        if not requester_id or not is_admin(cur, requester_id):
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Только для администратора"})}
        cur.execute("SELECT game, link_url, updated_at FROM cheat_links")
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({
            "links": [{"game": r[0], "link_url": r[1], "updated_at": r[2].isoformat() if r[2] else None} for r in rows]
        })}

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный action"})}
