import base64
import json
import os
import time
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["CONNECTIONS_TABLE"])

COGNITO_REGION = os.environ.get("COGNITO_REGION", "us-east-1")
USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

TTL_SECONDS = 3600 * 24


def decode_jwt_payload(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT")
    payload = parts[1]
    padding = 4 - len(payload) % 4
    if padding != 4:
        payload += "=" * padding
    return json.loads(base64.urlsafe_b64decode(payload))


def validate_token(token):
    claims = decode_jwt_payload(token)
    issuer = claims.get("iss", "")

    if claims.get("exp", 0) < time.time():
        raise ValueError("Token expired")

    # Cognito ID token
    expected_cognito = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}"
    if issuer == expected_cognito:
        if claims.get("token_use") != "id":
            raise ValueError("Not an ID token")
        return claims

    # Google ID token
    if issuer in ("accounts.google.com", "https://accounts.google.com"):
        if GOOGLE_CLIENT_ID and claims.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Invalid audience")
        return claims

    raise ValueError("Invalid issuer")


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    qs = event.get("queryStringParameters") or {}
    token = qs.get("token")

    user_email = "anonymous"
    user_sub = "anonymous"

    if token and USER_POOL_ID:
        try:
            claims = validate_token(token)
            user_email = claims.get("email", "unknown")
            user_sub = claims.get("sub", "unknown")
        except Exception:
            return {"statusCode": 401, "body": "Unauthorized"}

    table.put_item(Item={
        "connectionId": connection_id,
        "userEmail": user_email,
        "userSub": user_sub,
        "ttl": int(time.time()) + TTL_SECONDS,
    })

    return {"statusCode": 200}
