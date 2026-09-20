"""
Conversation Manager — Conversation and message storage.
Master Plan sections 21, 22.

Uses DynamoDB single-table design:
  Conversation: PK = USER#<user_id>, SK = CONVERSATION#<conversation_id>
  Message: PK = CONVERSATION#<conversation_id>, SK = MESSAGE#<timestamp>#<message_id>

ISOLATION: messages live under the conversation partition, which has no user in
its key. So every message read/write here first verifies that the conversation
belongs to user_id (via the user-scoped conversation record). Never call the
message functions without a verified user_id.
"""

import boto3
import os
import logging
from datetime import datetime, timezone
from typing import Optional
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from backend.models.memory import ConversationRecord, MessageRecord

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "LelantosTable")

_table = None


class ConversationNotFoundError(Exception):
    """Conversation doesn't exist OR doesn't belong to this user (same on purpose)."""


def _get_table():
    global _table
    if _table is None:
        dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _table = dynamodb.Table(DYNAMODB_TABLE)
    return _table


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _user_pk(user_id: str) -> str:
    if not user_id or not isinstance(user_id, str):
        raise ValueError("user_id is required")
    return f"USER#{user_id}"


def _conv_pk(conversation_id: str) -> str:
    if not conversation_id or not isinstance(conversation_id, str):
        raise ValueError("conversation_id is required")
    return f"CONVERSATION#{conversation_id}"


def _owns_conversation(user_id: str, conversation_id: str) -> bool:
    """True only if this conversation record exists under this user's partition."""
    response = _get_table().get_item(
        Key={"PK": _user_pk(user_id), "SK": _conv_pk(conversation_id)},
        ProjectionExpression="conversation_id",
    )
    return "Item" in response


def _query_all(table, **kwargs) -> list[dict]:
    """Query and follow pagination so results aren't silently truncated at 1 MB."""
    items: list[dict] = []
    while True:
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        kwargs["ExclusiveStartKey"] = last_key


def _query_up_to(table, limit: int, **kwargs) -> list[dict]:
    """Query up to `limit` items, following pagination as needed."""
    items: list[dict] = []
    while len(items) < limit:
        kwargs["Limit"] = limit - len(items)
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items[:limit]


# ─── Conversations ─────────────────────────────────────────────────────────────

def create_conversation(user_id: str, title: str = "New Conversation") -> ConversationRecord:
    """Create a new conversation."""
    table = _get_table()
    conv = ConversationRecord(user_id=user_id, title=title)

    item = {
        "PK": _user_pk(user_id),
        "SK": _conv_pk(conv.conversation_id),
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
    """Get a conversation by ID (only if it belongs to user_id)."""
    table = _get_table()
    try:
        response = table.get_item(
            Key={"PK": _user_pk(user_id), "SK": _conv_pk(conversation_id)}
        )
        return response.get("Item")
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        return None


def list_conversations(user_id: str, limit: int = 20) -> list[dict]:
    """List a user's conversations, most recently updated first."""
    table = _get_table()
    try:
        items = _query_all(
            table,
            KeyConditionExpression=Key("PK").eq(_user_pk(user_id))
            & Key("SK").begins_with("CONVERSATION#"),
        )
        # The sort key is the conversation ID (not a timestamp), so sort here.
        items.sort(key=lambda c: c.get("updated_at", ""), reverse=True)
        return items[:limit]
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        return []


def update_conversation_title(user_id: str, conversation_id: str, title: str) -> bool:
    """Update a conversation's title. Returns False if it doesn't exist / isn't yours."""
    table = _get_table()
    try:
        table.update_item(
            Key={"PK": _user_pk(user_id), "SK": _conv_pk(conversation_id)},
            UpdateExpression="SET title = :title, updated_at = :now",
            ExpressionAttributeValues={":title": title, ":now": _now()},
            ConditionExpression=Attr("PK").exists(),
        )
        return True
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return False
        logger.error(f"Failed to update conversation title: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to update conversation title: {e}")
        return False


def _touch_conversation(user_id: str, conversation_id: str):
    """Bump updated_at so the conversation sorts to the top of the list."""
    try:
        _get_table().update_item(
            Key={"PK": _user_pk(user_id), "SK": _conv_pk(conversation_id)},
            UpdateExpression="SET updated_at = :now",
            ExpressionAttributeValues={":now": _now()},
            ConditionExpression=Attr("PK").exists(),
        )
    except Exception as e:
        logger.warning(f"Failed to touch conversation {conversation_id}: {e}")


# ─── Messages (all ownership-checked) ──────────────────────────────────────────

def store_message(
    user_id: str, conversation_id: str, role: str, content: str
) -> MessageRecord:
    """
    Store a message in one of the user's conversations.
    Raises ConversationNotFoundError if the conversation isn't theirs.
    """
    if not _owns_conversation(user_id, conversation_id):
        raise ConversationNotFoundError("Conversation not found")

    table = _get_table()
    msg = MessageRecord(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )

    item = {
        "PK": _conv_pk(conversation_id),
        "SK": f"MESSAGE#{msg.timestamp}#{msg.message_id}",
        "entity_type": "MESSAGE",
        "message_id": msg.message_id,
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": msg.timestamp,
    }

    try:
        table.put_item(Item=item)
    except Exception as e:
        logger.error(f"Failed to store message: {e}")
        raise

    _touch_conversation(user_id, conversation_id)
    return msg


def get_messages(user_id: str, conversation_id: str, limit: int = 100) -> list[dict]:
    """
    Get messages in one of the user's conversations, oldest first.
    Returns [] if the conversation isn't theirs.
    """
    try:
        if not _owns_conversation(user_id, conversation_id):
            return []
        return _query_up_to(
            _get_table(),
            limit,
            KeyConditionExpression=Key("PK").eq(_conv_pk(conversation_id))
            & Key("SK").begins_with("MESSAGE#"),
            ScanIndexForward=True,
        )
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        return []


def get_recent_messages(
    user_id: str, conversation_id: str, limit: int = 10
) -> list[dict]:
    """
    Get the most recent messages in one of the user's conversations
    (chronological order). Returns [] if the conversation isn't theirs.
    """
    try:
        if not _owns_conversation(user_id, conversation_id):
            return []
        items = _query_up_to(
            _get_table(),
            limit,
            KeyConditionExpression=Key("PK").eq(_conv_pk(conversation_id))
            & Key("SK").begins_with("MESSAGE#"),
            ScanIndexForward=False,
        )
        items.reverse()  # chronological
        return items
    except Exception as e:
        logger.error(f"Failed to get recent messages: {e}")
        return []