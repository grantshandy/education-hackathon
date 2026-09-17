import base64
import json
import os
import time
import uuid

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SESSIONS_TABLE"])
bedrock = boto3.client("bedrock-runtime")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")

COGNITO_REGION = os.environ.get("COGNITO_REGION", "us-east-1")
USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")


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

    expected_cognito = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}"
    if issuer == expected_cognito:
        if claims.get("token_use") != "id":
            raise ValueError("Not an ID token")
        return claims

    if issuer in ("accounts.google.com", "https://accounts.google.com"):
        if GOOGLE_CLIENT_ID and claims.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Invalid audience")
        return claims

    raise ValueError("Invalid issuer")


def authenticate(event):
    auth_header = event.get("headers", {}).get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing Bearer token")
    token = auth_header[7:]
    claims = validate_token(token)
    return claims["sub"]


def respond(status_code, body):
    return {
        "statusCode": status_code,
        "body": json.dumps(body, default=str),
    }


def lambda_handler(event, context):
    try:
        user_id = authenticate(event)
    except Exception:
        return respond(401, {"error": "Unauthorized"})

    method = event["requestContext"]["http"]["method"]
    path_params = event.get("pathParameters") or {}

    try:
        raw_path = event.get("rawPath", "")
        if method == "POST" and raw_path.endswith("/summary"):
            session_id = path_params["sessionId"]
            return generate_summary(user_id, session_id)
        elif method == "GET" and "sessionId" in path_params:
            return get_session(user_id, path_params["sessionId"])
        elif method == "GET":
            qs = event.get("queryStringParameters") or {}
            return list_sessions(user_id, qs.get("courseId"))
        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            return create_session(user_id, body)
        elif method == "PATCH" and "sessionId" in path_params:
            body = json.loads(event.get("body") or "{}")
            return update_session(user_id, path_params["sessionId"], body)
        elif method == "DELETE" and "sessionId" in path_params:
            return delete_session(user_id, path_params["sessionId"])
        else:
            return respond(405, {"error": "Method not allowed"})
    except Exception as e:
        return respond(500, {"error": str(e)})


def list_sessions(user_id, course_id=None):
    result = table.query(
        KeyConditionExpression="userId = :uid",
        ExpressionAttributeValues={":uid": user_id},
        ScanIndexForward=False,
    )
    items = result["Items"]
    if course_id:
        items = [s for s in items if s.get("courseId") == course_id]
    return respond(200, {"sessions": items})


def get_session(user_id, session_id):
    result = table.get_item(Key={"userId": user_id, "sessionId": session_id})
    item = result.get("Item")
    if not item:
        return respond(404, {"error": "Session not found"})
    return respond(200, {"session": item})


def create_session(user_id, body):
    session_id = str(uuid.uuid4())
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    item = {
        "userId": user_id,
        "sessionId": session_id,
        "courseId": body.get("courseId", ""),
        "courseName": body.get("courseName", ""),
        "title": body.get("title", "Study Session"),
        "startTime": now,
        "endTime": None,
        "durationMinutes": 0,
        "messageCount": 0,
        "status": "active",
        "summary": None,
    }
    table.put_item(Item=item)
    return respond(201, {"session": item})


def update_session(user_id, session_id, body):
    update_parts = []
    expr_values = {}
    expr_names = {}

    allowed_fields = {
        "endTime": "S",
        "durationMinutes": "N",
        "messageCount": "N",
        "status": "S",
        "summary": "S",
        "transcript": "L",
        "courseId": "S",
        "courseName": "S",
        "lastHeartbeat": "S",
    }

    for field in allowed_fields:
        if field in body:
            safe_name = f"#{field}"
            safe_val = f":{field}"
            update_parts.append(f"{safe_name} = {safe_val}")
            expr_names[safe_name] = field
            expr_values[safe_val] = body[field]

    if not update_parts:
        return respond(400, {"error": "No fields to update"})

    result = table.update_item(
        Key={"userId": user_id, "sessionId": session_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return respond(200, {"session": result["Attributes"]})


def delete_session(user_id, session_id):
    table.delete_item(Key={"userId": user_id, "sessionId": session_id})
    return respond(200, {"deleted": True})


def generate_summary(user_id, session_id):
    result = table.get_item(Key={"userId": user_id, "sessionId": session_id})
    item = result.get("Item")
    if not item:
        return respond(404, {"error": "Session not found"})

    transcript = item.get("transcript", [])
    if not transcript:
        return respond(400, {"error": "No transcript to summarize"})

    conversation = "\n".join(
        f"{'Student' if m.get('role') == 'user' else 'Study Buddy'}: {m.get('text', '')}"
        for m in transcript
    )

    prompt = (
        "You are summarizing a study session between a student and their AI study buddy. "
        "Provide a concise summary that includes:\n"
        "1. Main topics discussed\n"
        "2. Key concepts covered\n"
        "3. Any areas the student seemed to struggle with\n"
        "4. Suggested next steps for studying\n\n"
        f"Conversation:\n{conversation}\n\n"
        "Write a helpful, concise summary (3-5 short paragraphs)."
    )

    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }),
    )

    resp_body = json.loads(response["body"].read())
    summary_text = resp_body["content"][0]["text"]

    table.update_item(
        Key={"userId": user_id, "sessionId": session_id},
        UpdateExpression="SET #summary = :summary",
        ExpressionAttributeNames={"#summary": "summary"},
        ExpressionAttributeValues={":summary": summary_text},
    )

    return respond(200, {"summary": summary_text})
