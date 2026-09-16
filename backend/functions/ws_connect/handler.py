import json
import os
import time
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["CONNECTIONS_TABLE"])

TTL_SECONDS = 3600 * 24  # 24 hours


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    table.put_item(Item={
        "connectionId": connection_id,
        "ttl": int(time.time()) + TTL_SECONDS,
    })
    return {"statusCode": 200}
