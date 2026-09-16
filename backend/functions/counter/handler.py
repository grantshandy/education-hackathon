import json

def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    count = body.get("count", 0)
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"count": count + 1}),
    }
