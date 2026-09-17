import base64
import json
import os
import time
import uuid
import urllib.request
import boto3

s3 = boto3.client("s3")
transcribe = boto3.client("transcribe")

AUDIO_BUCKET = os.environ["AUDIO_BUCKET"]

CONTENT_TYPE_TO_FORMAT = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
    "audio/x-flac": "flac",
}


def _cors(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return _cors(200, {})

    content_type = (event.get("headers") or {}).get("content-type", "audio/webm").lower()
    base_type = content_type.split(";")[0].strip()
    media_format = CONTENT_TYPE_TO_FORMAT.get(base_type, "webm")

    # API Gateway delivers binary as base64 when isBase64Encoded=true
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        audio_bytes = base64.b64decode(body)
    else:
        audio_bytes = body.encode() if isinstance(body, str) else body

    if not audio_bytes:
        return _cors(400, {"error": "empty body"})

    print(f"[transcribe] received {len(audio_bytes)} bytes, format={media_format}")

    key = f"transcribe-input/{uuid.uuid4()}.{media_format}"
    s3.put_object(Bucket=AUDIO_BUCKET, Key=key, Body=audio_bytes, ContentType=base_type)

    job_name = f"study-buddy-{uuid.uuid4().hex}"
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": f"s3://{AUDIO_BUCKET}/{key}"},
        MediaFormat=media_format,
        LanguageCode="en-US",
    )

    # Poll up to 55s (Lambda timeout is 60s)
    for _ in range(27):
        time.sleep(2)
        resp = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = resp["TranscriptionJob"]["TranscriptionJobStatus"]
        if status == "COMPLETED":
            transcript_uri = resp["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            with urllib.request.urlopen(transcript_uri) as r:
                data = json.loads(r.read())
            text = data["results"]["transcripts"][0]["transcript"].strip()
            print(f"[transcribe] result: {text!r}")
            try:
                s3.delete_object(Bucket=AUDIO_BUCKET, Key=key)
            except Exception:
                pass
            return _cors(200, {"text": text})
        if status == "FAILED":
            print("[transcribe] job failed")
            try:
                s3.delete_object(Bucket=AUDIO_BUCKET, Key=key)
            except Exception:
                pass
            return _cors(500, {"error": "transcription failed"})

    try:
        s3.delete_object(Bucket=AUDIO_BUCKET, Key=key)
    except Exception:
        pass
    return _cors(504, {"error": "transcription timed out"})
