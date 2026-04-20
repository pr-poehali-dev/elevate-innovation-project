"""
Форум: посты и чат.
?action=list          — все посты
?action=create        — POST, создать пост (с файлом или без)
?action=chat_list&since=0  — получить сообщения чата (id > since)
?action=chat_send     — POST, отправить сообщение {user_id, username, content}
"""
import json
import os
import base64
import boto3
import psycopg2
from datetime import datetime

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

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

    # --- Посты ---
    if action == "list":
        cur.execute(
            "SELECT id, user_id, username, title, content, file_url, file_name, created_at FROM forum_posts ORDER BY created_at DESC LIMIT 100"
        )
        rows = cur.fetchall()
        conn.close()
        posts = [
            {
                "id": r[0], "user_id": r[1], "username": r[2] or "Аноним",
                "title": r[3], "content": r[4], "file_url": r[5],
                "file_name": r[6], "created_at": r[7].isoformat() if r[7] else None
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"posts": posts})}

    if action == "create":
        user_id = body.get("user_id")
        username = body.get("username", "Аноним")
        title = body.get("title", "").strip()
        content = body.get("content", "").strip()
        file_data = body.get("file_data")
        file_name = body.get("file_name", "")

        if not title or not content:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Заголовок и текст обязательны"})}

        file_url = None
        if file_data and file_name:
            s3 = get_s3()
            file_bytes = base64.b64decode(file_data)
            key = "forum/%s_%s" % (datetime.now().strftime("%Y%m%d%H%M%S"), file_name)
            s3.put_object(Bucket="files", Key=key, Body=file_bytes, ContentType="application/octet-stream")
            file_url = "https://cdn.poehali.dev/projects/%s/files/%s" % (os.environ["AWS_ACCESS_KEY_ID"], key)

        cur.execute(
            "INSERT INTO forum_posts (user_id, username, title, content, file_url, file_name) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (user_id, username, title, content, file_url, file_name if file_url else None)
        )
        post_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True, "id": post_id, "file_url": file_url})}

    # --- Чат ---
    if action == "chat_list":
        since = int(params.get("since", 0))
        cur.execute(
            "SELECT id, user_id, username, content, created_at FROM chat_messages WHERE id > %d ORDER BY id ASC LIMIT 80" % since
        )
        rows = cur.fetchall()
        conn.close()
        messages = [
            {
                "id": r[0], "user_id": r[1], "username": r[2],
                "content": r[3], "created_at": r[4].isoformat() if r[4] else "",
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"messages": messages})}

    if action == "chat_send":
        user_id = body.get("user_id")
        username = str(body.get("username", "Гость"))[:100].replace("'", "''")
        content = str(body.get("content", "")).strip()[:1000]

        if not content:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Пустое сообщение"})}

        uid_part = str(int(user_id)) if user_id else "NULL"
        cur.execute(
            "INSERT INTO chat_messages (user_id, username, content) VALUES (%s, '%s', '%s') RETURNING id, created_at" % (
                uid_part, username, content.replace("'", "''")
            )
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({
            "ok": True,
            "message": {
                "id": row[0], "user_id": user_id, "username": body.get("username", "Гость"),
                "content": body.get("content", "").strip(), "created_at": row[1].isoformat()
            }
        })}

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный action"})}
