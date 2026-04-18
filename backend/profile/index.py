"""
Профиль пользователя и админ-панель.
?action=me&user_id=X — профиль
?action=users — список всех пользователей (только admin)
?action=grant&user_id=X&days=30 — выдать подписку (только admin)
Проверка роли: передай X-Auth-Token в заголовке, user_id в query
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-User-Id",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_id(cur, user_id):
    cur.execute("SELECT id, email, username, role, subscription_until, created_at FROM users WHERE id = %d" % int(user_id))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    user_id = params.get("user_id", "")
    headers = event.get("headers") or {}

    conn = get_db()
    cur = conn.cursor()

    if action == "me" and user_id:
        row = get_user_by_id(cur, user_id)
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Пользователь не найден"})}
        sub_until = row[4].isoformat() if row[4] else None
        created_at = row[5].isoformat() if row[5] else None
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "id": row[0], "email": row[1], "username": row[2],
                "role": row[3], "subscription_until": sub_until, "created_at": created_at
            }),
        }

    if action == "users":
        requester_id = params.get("requester_id", "")
        if not requester_id:
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет доступа"})}
        requester = get_user_by_id(cur, requester_id)
        if not requester or requester[3] != "admin":
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Только для администратора"})}

        cur.execute("SELECT id, email, username, role, subscription_until, created_at FROM users ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        users = []
        for r in rows:
            users.append({
                "id": r[0], "email": r[1], "username": r[2], "role": r[3],
                "subscription_until": r[4].isoformat() if r[4] else None,
                "created_at": r[5].isoformat() if r[5] else None,
            })
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"users": users})}

    if action == "grant":
        requester_id = params.get("requester_id", "")
        days = int(params.get("days", "30"))
        if not requester_id or not user_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нужен requester_id и user_id"})}
        requester = get_user_by_id(cur, requester_id)
        if not requester or requester[3] != "admin":
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Только для администратора"})}

        until = datetime.now() + timedelta(days=days)
        cur.execute("UPDATE users SET subscription_until = '%s' WHERE id = %d" % (until.isoformat(), int(user_id)))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True, "until": until.isoformat()})}

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный action"})}
