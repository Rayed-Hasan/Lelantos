"""
Memory Engine — Core CRUD operations for structured memories.
Master Plan sections 7, 13, 14, 18, 22.

Uses DynamoDB single-table design:
  PK = USER#<user_id>
  SK = MEMORY#<memory_id>
"""

import boto3
import os
import logging
from datetime import datetime
from typing import Optional
from boto3.dynamodb.conditions import Key, Attr

from backend.models.memory import (
    MemoryObject, MemoryStatus, MemoryType, MemorySource,
    TimelineEvent, normalize_key,
)

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "LelantosTable")

_dynamodb = None
_table = None


def _get_table():
    """Lazy-initialize the DynamoDB table resource."""
    global _dynamodb, _table
    if _table is None:
        _dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _table = _dynamodb.Table(DYNAMODB_TABLE)
    return _table


# ─── CREATE ────────────────────────────────────────────────────────────────────

def create_memory(memory: MemoryObject) -> MemoryObject:
    """Create a new memory item in DynamoDB."""
    table = _get_table()

    # Normalize the key against the fixed vocabulary
    memory.key = normalize_key(memory.type.value, memory.key)

    item = {
        "PK": f"USER#{memory.user_id}",
        "SK": f"MEMORY#{memory.memory_id}",
        "entity_type": "MEMORY",
        "memory_id": memory.memory_id,
        "user_id": memory.user_id,
        "type": memory.type.value,
        "key": memory.key,
        "value": memory.value,
        "confidence": str(memory.confidence),
        "status": memory.status.value,
        "source": memory.source.model_dump() if memory.source else None,
        "created_at": memory.created_at,
        "updated_at": memory.updated_at,
        "expires_at": memory.expires_at,
        "version": memory.version,
    }

    # Remove None values
    item = {k: v for k, v in item.items() if v is not None}

    try:
        table.put_item(Item=item)
        logger.info(f"Created memory {memory.memory_id} for user {memory.user_id}")
        return memory
    except Exception as e:
        logger.error(f"Failed to create memory: {e}")
        raise


# ─── READ ──────────────────────────────────────────────────────────────────────

def get_memory(user_id: str, memory_id: str) -> Optional[MemoryObject]:
    """Get a single memory by ID."""
    table = _get_table()
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": f"MEMORY#{memory_id}"}
        )
        item = response.get("Item")
        if not item:
            return None
        return _item_to_memory(item)
    except Exception as e:
        logger.error(f"Failed to get memory {memory_id}: {e}")
        raise


def list_memories(
    user_id: str,
    status: Optional[MemoryStatus] = None,
    memory_type: Optional[MemoryType] = None,
) -> list[MemoryObject]:
    """List all memories for a user, optionally filtered by status and type."""
    table = _get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("MEMORY#")
        )
        items = response.get("Items", [])
        memories = [_item_to_memory(item) for item in items]

        # Filter in code (section 22: intentional at hackathon scale)
        if status:
            memories = [m for m in memories if m.status == status]
        if memory_type:
            memories = [m for m in memories if m.type == memory_type]

        return memories
    except Exception as e:
        logger.error(f"Failed to list memories for user {user_id}: {e}")
        raise


def get_active_memories(user_id: str) -> list[MemoryObject]:
    """Get only ACTIVE memories for a user."""
    return list_memories(user_id, status=MemoryStatus.ACTIVE)


def get_memory_history(user_id: str, key: str, memory_type: str) -> list[MemoryObject]:
    """Get all versions of a memory (by type+key), ordered by version."""
    all_memories = list_memories(user_id)
    history = [m for m in all_memories if m.key == key and m.type.value == memory_type]
    history.sort(key=lambda m: m.version)
    return history


# ─── UPDATE ────────────────────────────────────────────────────────────────────

def update_memory(
    user_id: str,
    memory_id: str,
    value: Optional[str] = None,
    status: Optional[MemoryStatus] = None,
    confidence: Optional[float] = None,
) -> Optional[MemoryObject]:
    """Update a memory's value, status, or confidence."""
    memory = get_memory(user_id, memory_id)
    if not memory:
        return None

    table = _get_table()
    update_parts = []
    expr_values = {}
    expr_names = {}

    now = datetime.utcnow().isoformat() + "Z"
    update_parts.append("#updated_at = :updated_at")
    expr_values[":updated_at"] = now
    expr_names["#updated_at"] = "updated_at"

    if value is not None:
        update_parts.append("#val = :val")
        expr_values[":val"] = value
        expr_names["#val"] = "value"

    if status is not None:
        update_parts.append("#status = :status")
        expr_values[":status"] = status.value
        expr_names["#status"] = "status"

    if confidence is not None:
        update_parts.append("#confidence = :confidence")
        expr_values[":confidence"] = str(confidence)
        expr_names["#confidence"] = "confidence"

    try:
        table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"MEMORY#{memory_id}"},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names,
        )
        # Refresh and return
        return get_memory(user_id, memory_id)
    except Exception as e:
        logger.error(f"Failed to update memory {memory_id}: {e}")
        raise


# ─── DELETE (soft delete) ──────────────────────────────────────────────────────

def delete_memory(user_id: str, memory_id: str) -> bool:
    """Soft-delete a memory by setting status to DELETED."""
    result = update_memory(user_id, memory_id, status=MemoryStatus.DELETED)
    if result:
        # Create timeline event
        create_timeline_event(TimelineEvent(
            user_id=user_id,
            event_type="memory_deleted",
            memory_id=memory_id,
            description=f"Memory '{result.key}' deleted by user",
        ))
        return True
    return False


def delete_all_memories(user_id: str) -> int:
    """Soft-delete all memories for a user."""
    memories = get_active_memories(user_id)
    count = 0
    for memory in memories:
        if delete_memory(user_id, memory.memory_id):
            count += 1
    return count


# ─── VERSION (section 13) ─────────────────────────────────────────────────────

def version_memory(
    user_id: str,
    old_memory: MemoryObject,
    new_value: str,
    new_confidence: float,
    source: Optional[MemorySource] = None,
) -> MemoryObject:
    """
    Create a new version of a memory. Old memory becomes REPLACED.
    Returns the new ACTIVE memory.
    """
    # Mark old as REPLACED
    update_memory(user_id, old_memory.memory_id, status=MemoryStatus.REPLACED)

    # Create new version
    new_memory = MemoryObject(
        user_id=user_id,
        type=old_memory.type,
        key=old_memory.key,
        value=new_value,
        confidence=new_confidence,
        status=MemoryStatus.ACTIVE,
        source=source,
        version=old_memory.version + 1,
    )
    create_memory(new_memory)

    # Timeline event
    create_timeline_event(TimelineEvent(
        user_id=user_id,
        event_type="memory_updated",
        memory_id=new_memory.memory_id,
        description=f"{old_memory.key} changed: {old_memory.value} → {new_value}",
        old_value=old_memory.value,
        new_value=new_value,
    ))

    return new_memory


# ─── TIMELINE ──────────────────────────────────────────────────────────────────

def create_timeline_event(event: TimelineEvent):
    """Store a timeline event in DynamoDB."""
    table = _get_table()
    item = {
        "PK": f"USER#{event.user_id}",
        "SK": f"TIMELINE#{event.timestamp}#{event.event_id}",
        "entity_type": "TIMELINE",
        "event_id": event.event_id,
        "user_id": event.user_id,
        "event_type": event.event_type,
        "description": event.description,
        "timestamp": event.timestamp,
    }
    if event.memory_id:
        item["memory_id"] = event.memory_id
    if event.old_value:
        item["old_value"] = event.old_value
    if event.new_value:
        item["new_value"] = event.new_value

    try:
        table.put_item(Item=item)
    except Exception as e:
        logger.error(f"Failed to create timeline event: {e}")


def get_timeline(user_id: str, limit: int = 50) -> list[dict]:
    """Get timeline events for a user, most recent first."""
    table = _get_table()
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("TIMELINE#"),
            ScanIndexForward=False,
            Limit=limit,
        )
        return response.get("Items", [])
    except Exception as e:
        logger.error(f"Failed to get timeline: {e}")
        return []


# ─── PROFILE ───────────────────────────────────────────────────────────────────

def get_user_profile(user_id: str) -> dict:
    """Get a summary profile of user's memory state."""
    memories = list_memories(user_id)
    active = [m for m in memories if m.status == MemoryStatus.ACTIVE]

    # Count by type
    type_counts = {}
    for m in active:
        t = m.type.value
        type_counts[t] = type_counts.get(t, 0) + 1

    # Group active memories for quick display
    context_summary = [
        {"type": m.type.value, "key": m.key, "value": m.value, "confidence": m.confidence}
        for m in active
    ]

    return {
        "user_id": user_id,
        "total_memories": len(memories),
        "active_memories": len(active),
        "type_counts": type_counts,
        "context_summary": context_summary,
        "recent_memories": [
            m.model_dump() for m in sorted(active, key=lambda x: x.updated_at, reverse=True)[:5]
        ],
    }


# ─── HELPERS ───────────────────────────────────────────────────────────────────

def _item_to_memory(item: dict) -> MemoryObject:
    """Convert a DynamoDB item to a MemoryObject."""
    return MemoryObject(
        memory_id=item.get("memory_id", ""),
        user_id=item.get("user_id", ""),
        type=MemoryType(item.get("type", "FACT")),
        key=item.get("key", "other"),
        value=item.get("value", ""),
        confidence=float(item.get("confidence", "0.5")),
        status=MemoryStatus(item.get("status", "ACTIVE")),
        source=MemorySource(**item["source"]) if item.get("source") else None,
        created_at=item.get("created_at", ""),
        updated_at=item.get("updated_at", ""),
        expires_at=item.get("expires_at"),
        version=int(item.get("version", 1)),
    )
