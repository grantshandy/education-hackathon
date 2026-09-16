import base64
import json
import os
import time
import uuid

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["COURSES_TABLE"])

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
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    try:
        user_id = authenticate(event)
    except Exception:
        return respond(401, {"error": "Unauthorized"})

    method = event["requestContext"]["http"]["method"]

    try:
        if method == "GET":
            return list_courses(user_id)
        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            return create_course(user_id, body)
        elif method == "PATCH":
            course_id = event["pathParameters"]["courseId"]
            body = json.loads(event.get("body") or "{}")
            return update_course(user_id, course_id, body)
        elif method == "DELETE":
            course_id = event["pathParameters"]["courseId"]
            return delete_course(user_id, course_id)
        else:
            return respond(405, {"error": "Method not allowed"})
    except Exception as e:
        return respond(500, {"error": str(e)})


def list_courses(user_id):
    result = table.query(
        KeyConditionExpression="userId = :uid",
        ExpressionAttributeValues={":uid": user_id},
    )
    return respond(200, {"courses": result["Items"]})


def create_course(user_id, body):
    name = body.get("name", "").strip()
    if not name:
        return respond(400, {"error": "name is required"})

    color = body.get("color", "#9CA3AF")
    course_id = str(uuid.uuid4())

    item = {
        "userId": user_id,
        "courseId": course_id,
        "name": name,
        "color": color,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    table.put_item(Item=item)
    return respond(201, {"course": item})


def update_course(user_id, course_id, body):
    update_parts = []
    expr_values = {}
    expr_names = {}

    for field in ("name", "color"):
        if field in body:
            safe_name = f"#{field}"
            safe_val = f":{field}"
            update_parts.append(f"{safe_name} = {safe_val}")
            expr_names[safe_name] = field
            expr_values[safe_val] = body[field]

    if not update_parts:
        return respond(400, {"error": "No fields to update"})

    result = table.update_item(
        Key={"userId": user_id, "courseId": course_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return respond(200, {"course": result["Attributes"]})


def delete_course(user_id, course_id):
    table.delete_item(Key={"userId": user_id, "courseId": course_id})
    return respond(200, {"deleted": True})
