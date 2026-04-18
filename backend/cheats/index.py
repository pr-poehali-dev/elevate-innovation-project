"""
Бесплатные читы: список и добавление (только admin).
?action=list — все читы
?action=add — POST, добавить (admin only)
?action=delete&cheat_id=X&requester_id=Y — удалить (admin only)
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def is_admin(cur, user_id):
    cur.execute("SELECT role FROM users WHERE id = %d" % int(user_id))
    row = cur.fetchone()
    return row and row[0] == "admin"

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    conn = get_db()
    cur = conn.cursor()

    if action == "list":
        cur.execute("SELECT id, admin_id, title, description, link_url, created_at FROM free_cheats ORDER BY created_at DESC")
        rows = cur.fetchall()
        conn.close()
        cheats = [
            {"id": r[0], "admin_id": r[1], "title": r[2], "description": r[3],
             "link_url": r[4], "created_at": r[5].isoformat() if r[5] else None}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"cheats": cheats})}

    if action == "add":
        requester_id = body.get("requester_id")
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        link_url = body.get("link_url", "").strip()

        if not requester_id or not is_admin(cur, requester_id):
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Только для администратора"})}
        if not title or not link_url:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Название и ссылка обязательны"})}

        cur.execute(
            "INSERT INTO free_cheats (admin_id, title, description, link_url) VALUES (%s, %s, %s, %s) RETURNING id",
            (int(requester_id), title, description, link_url)
        )
        cheat_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True, "id": cheat_id})}

    if action == "delete":
        requester_id = params.get("requester_id")
        cheat_id = params.get("cheat_id")
        if not requester_id or not is_admin(cur, requester_id):
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Только для администратора"})}
        cur.execute("DELETE FROM free_cheats WHERE id = %d" % int(cheat_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный action"})}
