"""
Аутентификация: регистрация и вход по email.
Используй ?action=register или ?action=login
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(32)

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_db()
    cur = conn.cursor()

    if action == "register":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        username = body.get("username", "").strip()

        if not email or not password:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Email и пароль обязательны"})}

        if len(password) < 6:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        cur.execute("SELECT id FROM users WHERE email = '%s'" % email)
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS_HEADERS, "body": json.dumps({"error": "Email уже зарегистрирован"})}

        password_hash = hash_password(password)
        token = generate_token()
        cur.execute(
            "INSERT INTO users (email, password_hash, username) VALUES ('%s', '%s', '%s') RETURNING id" % (email, password_hash, username)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"token": token, "user": {"id": user_id, "email": email, "username": username}}),
        }

    if action == "login":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Email и пароль обязательны"})}

        password_hash = hash_password(password)
        cur.execute(
            "SELECT id, email, username FROM users WHERE email = '%s' AND password_hash = '%s'" % (email, password_hash)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный email или пароль"})}

        token = generate_token()
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"token": token, "user": {"id": row[0], "email": row[1], "username": row[2]}}),
        }

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Укажи action=register или action=login"})}
