"""
Conversation Manager — Conversation and message storage.
Master Plan sections 21, 22.

Uses DynamoDB single-table design:
  Conversation: PK = USER#<user_id>, SK = CONVERSATION#<conversation_id>
  Message: PK = CONVERSATION#<conversation_id>, SK = MESSAGE#<timestamp>#<message_id>
"""

import boto3
import os
import logging
from datetime import datetime
from typing import Optional
from boto3.dynamodb.conditions import Key

from backend.models.memory import ConversationRecord, MessageRecord

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "LelantosTable")

_table = None


def _get_table():
    global _table
    if _table is None:
        dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _table = dynamodb.Table(DYNAMODB_TABLE)
    return _table


# ─── Conversations ─────────────────────────────────────────────────────────────

def create_conversation(user_id: str, title: str = "New Conversation") -> ConversationRecord:
    """Create a new conversation."""
    table = _get_table()
    conv = ConversationRecord(user_id=user_id, title=title)

    item = {
        "PK": f"USER#{user_id}",
        "SK": f"CONVERSATION#{conv.conversation_id}",
        "entity_type": "CONVERSATION",
        "conversation_id": conv.conversation_id,
        "user_id": user_id,
        "model": conv.model,
        "title": title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
    }

    try:
        table.put_item(Item=item)
        logger.info(f"Created conversation {conv.conversation_id}")
        return conv
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise


def get_conversation(user_id: str, conversation_id: str) -> Optional[dict]:
    """Get a conversation by ID."""
    table = _get_table()
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"CONVERSATION#{conversation_id}"}
        )
        return response.get("Item")
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        return None


def list_conversations(user_id: str, limit: int = 20) -> list[dict]:
    """List all conversations for a user, most recent first."""
    table = _get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("CONVERSATION#"),
            ScanIndexForward=False,
            Limit=limit,
        )
        return response.get("Items", [])
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        return []


def update_conversation_title(user_id: str, conversation_id: str, title: str):
    """Update a conversation's title."""
    table = _get_table()
    try:
        table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"CONVERSATION#{conversation_id}"},
            UpdateExpression="SET title = :title, updated_at = :now",
            ExpressionAttributeValues={
                ":title": title,
                ":now": datetime.utcnow().isoformat() + "Z",
            },
        )
    except Exception as e:
        logger.error(f"Failed to update conversation title: {e}")


# ─── Messages ──────────────────────────────────────────────────────────────────

def store_message(conversation_id: str, role: str, content: str) -> MessageRecord:
    """Store a message in a conversation."""
    table = _get_table()
    msg = MessageRecord(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )

    item = {
        "PK": f"CONVERSATION#{conversation_id}",
        "SK": f"MESSAGE#{msg.timestamp}#{msg.message_id}",
        "entity_type": "MESSAGE",
        "message_id": msg.message_id,
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "timestamp": msg.timestamp,
    }

    try:
        table.put_item(Item=item)
        return msg
    except Exception as e:
        logger.error(f"Failed to store message: {e}")
        raise


def get_messages(conversation_id: str, limit: int = 100) -> list[dict]:
    """Get all messages in a conversation, ordered by timestamp."""
    table = _get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"CONVERSATION#{conversation_id}") & Key("SK").begins_with("MESSAGE#"),
            ScanIndexForward=True,
            Limit=limit,
        )
        return response.get("Items", [])
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        return []


def get_recent_messages(conversation_id: str, limit: int = 10) -> list[dict]:
    """Get the most recent messages in a conversation."""
    table = _get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"CONVERSATION#{conversation_id}") & Key("SK").begins_with("MESSAGE#"),
            ScanIndexForward=False,
            Limit=limit,
        )
        items = response.get("Items", [])
        items.reverse()  # Return in chronological order
        return items
    except Exception as e:
        logger.error(f"Failed to get recent messages: {e}")
        return []
