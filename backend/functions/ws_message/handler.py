import base64
import json
import os
import boto3

bedrock = boto3.client("bedrock-runtime")
polly = boto3.client("polly")

MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
VOICE_ID = os.environ.get("POLLY_VOICE_ID", "Joanna")

SYSTEM_PROMPT = (
    "You are a friendly, concise study buddy. "
    "Answer questions clearly and encouragingly. "
    "Keep responses to 2-3 sentences unless more depth is needed."
)


def _apigw_client(event):
    ctx = event["requestContext"]
    endpoint = f"https://{ctx['domainName']}/{ctx['stage']}"
    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)


def _ask_bedrock(text: str) -> str:
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": text}],
    })
    resp = bedrock.invoke_model(modelId=MODEL_ID, body=body)
    result = json.loads(resp["body"].read())
    return result["content"][0]["text"]


def _synthesize(text: str) -> dict:
    """Returns {"audio_b64": str, "visemes": list[{"time": int, "value": str}]}"""
    # Audio
    audio_resp = polly.synthesize_speech(
        Text=text,
        OutputFormat="mp3",
        VoiceId=VOICE_ID,
        Engine="neural",
    )
    audio_b64 = base64.b64encode(audio_resp["AudioStream"].read()).decode()

    # Viseme speech marks (separate Polly call — speech marks and audio are
    # mutually exclusive output formats)
    marks_resp = polly.synthesize_speech(
        Text=text,
        OutputFormat="json",
        VoiceId=VOICE_ID,
        Engine="neural",
        SpeechMarkTypes=["viseme"],
    )
    raw = marks_resp["AudioStream"].read().decode()
    visemes = [json.loads(line) for line in raw.strip().splitlines() if line]

    return {"audio_b64": audio_b64, "visemes": visemes}


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    apigw = _apigw_client(event)

    body = json.loads(event.get("body") or "{}")
    text = body.get("text", "").strip()

    if not text:
        apigw.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({"type": "error", "message": "empty message"}),
        )
        return {"statusCode": 400}

    # Let the client know we're processing
    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps({"type": "thinking"}),
    )

    response_text = _ask_bedrock(text)
    speech = _synthesize(response_text)

    apigw.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps({
            "type": "response",
            "text": response_text,
            "audio_b64": speech["audio_b64"],
            "visemes": speech["visemes"],
        }),
    )

    return {"statusCode": 200}
