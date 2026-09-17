import json
import os
import time

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SESSIONS_TABLE"])

STALE_THRESHOLD_SECONDS = 300  # 5 minutes without heartbeat


def lambda_handler(event, context):
    now = time.time()
    cutoff = time.strftime(
        "%Y-%m-%dT%H:%M:%SZ",
        time.gmtime(now - STALE_THRESHOLD_SECONDS),
    )

    result = table.scan(
        FilterExpression="#status = :active",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":active": "active"},
    )

    closed = 0
    for item in result.get("Items", []):
        heartbeat = item.get("lastHeartbeat") or item.get("startTime", "")
        if heartbeat and heartbeat < cutoff:
            start = item.get("startTime", "")
            duration = 0
            if start:
                try:
                    start_epoch = time.mktime(time.strptime(start, "%Y-%m-%dT%H:%M:%SZ"))
                    end_epoch = time.mktime(time.strptime(heartbeat, "%Y-%m-%dT%H:%M:%SZ"))
                    duration = max(1, round((end_epoch - start_epoch) / 60))
                except Exception:
                    duration = 0

            table.update_item(
                Key={
                    "userId": item["userId"],
                    "sessionId": item["sessionId"],
                },
                UpdateExpression="SET #status = :completed, endTime = :endTime, durationMinutes = :dur",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":completed": "completed",
                    ":endTime": heartbeat,
                    ":dur": duration,
                },
            )
            closed += 1

    return {"statusCode": 200, "body": json.dumps({"closed": closed})}
