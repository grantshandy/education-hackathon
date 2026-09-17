import base64
import json
import os
import time
import uuid

import boto3

s3 = boto3.client("s3")
textract = boto3.client("textract")
bedrock_agent = boto3.client("bedrock-agent")
lambda_client = boto3.client("lambda")
dynamodb = boto3.resource("dynamodb")
sessions_table = dynamodb.Table(os.environ["SESSIONS_TABLE"])
FUNCTION_NAME = os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "")

DOCUMENTS_BUCKET = os.environ["DOCUMENTS_BUCKET"]
KNOWLEDGE_BASE_ID = os.environ.get("KNOWLEDGE_BASE_ID", "")
DATA_SOURCE_ID = os.environ.get("DATA_SOURCE_ID", "")

COGNITO_REGION = os.environ.get("COGNITO_REGION", "us-east-1")
USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"}
PDF_TYPES = {"application/pdf"}
UPLOAD_EXPIRY = 300


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
    if event.get("_async_process"):
        _do_process(event["_async_process"]["userId"], event["_async_process"]["sessionId"])
        return

    try:
        user_id = authenticate(event)
    except Exception:
        return respond(401, {"error": "Unauthorized"})

    method = event["requestContext"]["http"]["method"]
    path_params = event.get("pathParameters") or {}
    session_id = path_params.get("sessionId", "")
    raw_path = event.get("rawPath", "")

    try:
        if method == "POST" and raw_path.endswith("/upload"):
            body = json.loads(event.get("body") or "{}")
            return request_upload(user_id, session_id, body)
        elif method == "POST" and raw_path.endswith("/process"):
            return process_documents(user_id, session_id)
        elif method == "GET":
            return list_documents(user_id, session_id)
        else:
            return respond(405, {"error": "Method not allowed"})
    except Exception as e:
        return respond(500, {"error": str(e)})


def request_upload(user_id, session_id, body):
    file_name = body.get("fileName", "")
    content_type = body.get("contentType", "application/octet-stream")
    if not file_name:
        return respond(400, {"error": "fileName is required"})

    document_id = str(uuid.uuid4())
    s3_key = f"{user_id}/{session_id}/{document_id}/{file_name}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": DOCUMENTS_BUCKET,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=UPLOAD_EXPIRY,
    )

    _write_metadata_sidecar(s3_key, session_id, user_id, file_name)

    _track_document(user_id, session_id, document_id, file_name, s3_key, content_type)

    return respond(200, {
        "documentId": document_id,
        "uploadUrl": upload_url,
        "s3Key": s3_key,
    })


def _write_metadata_sidecar(s3_key, session_id, user_id, file_name):
    metadata = {
        "metadataAttributes": {
            "sessionId": session_id,
            "userId": user_id,
            "fileName": file_name,
        }
    }
    s3.put_object(
        Bucket=DOCUMENTS_BUCKET,
        Key=f"{s3_key}.metadata.json",
        Body=json.dumps(metadata),
        ContentType="application/json",
    )


def _track_document(user_id, session_id, document_id, file_name, s3_key, content_type):
    doc_entry = {
        "documentId": document_id,
        "fileName": file_name,
        "s3Key": s3_key,
        "contentType": content_type,
        "status": "uploaded",
        "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    sessions_table.update_item(
        Key={"userId": user_id, "sessionId": session_id},
        UpdateExpression="SET #docs = list_append(if_not_exists(#docs, :empty), :entry)",
        ExpressionAttributeNames={"#docs": "documents"},
        ExpressionAttributeValues={
            ":entry": [doc_entry],
            ":empty": [],
        },
    )


def process_documents(user_id, session_id):
    sessions_table.update_item(
        Key={"userId": user_id, "sessionId": session_id},
        UpdateExpression="SET materialsStatus = :s",
        ExpressionAttributeValues={":s": "processing"},
    )
    lambda_client.invoke(
        FunctionName=FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps({"_async_process": {"userId": user_id, "sessionId": session_id}}),
    )
    return respond(200, {"status": "processing"})


def _do_process(user_id, session_id):
    result = sessions_table.get_item(Key={"userId": user_id, "sessionId": session_id})
    session = result.get("Item", {})
    documents = session.get("documents", [])

    all_text = []
    for doc in documents:
        content_type = doc.get("contentType", "")
        s3_key = doc.get("s3Key", "")
        if not s3_key:
            continue
        if content_type in IMAGE_TYPES:
            _ocr_image_to_text(s3_key)
        elif content_type in PDF_TYPES:
            extracted = _ocr_pdf_to_text(s3_key, session_id, user_id)
            if extracted:
                all_text.append(extracted)

    if all_text:
        combined = "\n\n".join(all_text)
        sessions_table.update_item(
            Key={"userId": user_id, "sessionId": session_id},
            UpdateExpression="SET extractedText = :t, extractedAt = :at",
            ExpressionAttributeValues={
                ":t": combined[:50000],
                ":at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
        )

    if KNOWLEDGE_BASE_ID and DATA_SOURCE_ID:
        bedrock_agent.start_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=DATA_SOURCE_ID,
        )

    sessions_table.update_item(
        Key={"userId": user_id, "sessionId": session_id},
        UpdateExpression="SET materialsStatus = :s",
        ExpressionAttributeValues={":s": "ready"},
    )


def _ocr_image_to_text(s3_key):
    try:
        resp = textract.detect_document_text(
            Document={"S3Object": {"Bucket": DOCUMENTS_BUCKET, "Name": s3_key}}
        )
        lines = [
            block["Text"]
            for block in resp.get("Blocks", [])
            if block["BlockType"] == "LINE"
        ]
        extracted_text = "\n".join(lines)
        if extracted_text.strip():
            txt_key = f"{s3_key}.extracted.txt"
            s3.put_object(
                Bucket=DOCUMENTS_BUCKET,
                Key=txt_key,
                Body=extracted_text.encode("utf-8"),
                ContentType="text/plain",
            )
            _write_metadata_sidecar(
                txt_key,
                s3_key.split("/")[1],
                s3_key.split("/")[0],
                s3_key.split("/")[-1] + ".txt",
            )
    except Exception as e:
        print(f"OCR failed for {s3_key}: {e}")


def _ocr_pdf_to_text(s3_key, session_id, user_id):
    try:
        start_resp = textract.start_document_text_detection(
            DocumentLocation={"S3Object": {"Bucket": DOCUMENTS_BUCKET, "Name": s3_key}},
        )
        job_id = start_resp["JobId"]

        while True:
            status_resp = textract.get_document_text_detection(JobId=job_id)
            status = status_resp["JobStatus"]
            if status == "SUCCEEDED":
                break
            elif status == "FAILED":
                print(f"Textract text detection failed for {s3_key}")
                return ""
            time.sleep(2)

        pages = {}
        next_token = None
        while True:
            kwargs = {"JobId": job_id}
            if next_token:
                kwargs["NextToken"] = next_token
            resp = textract.get_document_text_detection(**kwargs)
            for block in resp.get("Blocks", []):
                page_num = block.get("Page", 1)
                if page_num not in pages:
                    pages[page_num] = []
                if block["BlockType"] == "LINE":
                    pages[page_num].append(block.get("Text", ""))
            next_token = resp.get("NextToken")
            if not next_token:
                break

        parts = []
        for page_num in sorted(pages.keys()):
            lines = pages[page_num]
            parts.append(f"--- Slide {page_num} ---\n" + "\n".join(lines))

        extracted_text = "\n\n".join(parts)
        if extracted_text.strip():
            txt_key = f"{s3_key}.extracted.txt"
            s3.put_object(
                Bucket=DOCUMENTS_BUCKET,
                Key=txt_key,
                Body=extracted_text.encode("utf-8"),
                ContentType="text/plain",
            )
            _write_metadata_sidecar(txt_key, session_id, user_id, s3_key.split("/")[-1] + ".txt")
        return extracted_text
    except Exception as e:
        print(f"PDF OCR failed for {s3_key}: {e}")
        return ""


def list_documents(user_id, session_id):
    result = sessions_table.get_item(Key={"userId": user_id, "sessionId": session_id})
    session = result.get("Item", {})
    documents = session.get("documents", [])
    return respond(200, {"documents": documents})
