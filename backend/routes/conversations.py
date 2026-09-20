"""
Conversation Routes — Conversation list and detail endpoints.
Master Plan section 21, 36.

Every endpoint takes user_id from the verified Cognito token. A conversation
belonging to someone else is indistinguishable from one that doesn't exist (404).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from starlette.concurrency import run_in_threadpool

from backend.services.auth import get_current_user
from backend.services.conversation_manager import (
    list_conversations, get_conversation, get_messages,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations")

# DynamoDB key attributes are storage details, not API fields.
_INTERNAL_KEYS = {"PK", "SK", "entity_type"}


def _public(item: dict) -> dict:
    return {k: v for k, v in item.items() if k not in _INTERNAL_KEYS}


@router.get("")
async def list_conversations_endpoint(user: dict = Depends(get_current_user)):
    """List all conversations for the current user."""
    try:
        conversations = await run_in_threadpool(list_conversations, user["user_id"])
        return {"conversations": [_public(c) for c in conversations]}
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{conversation_id}")
async def get_conversation_endpoint(
    conversation_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a conversation with its messages."""
    user_id = user["user_id"]

    try:
        # Ownership check: only returns the conversation if it's under this user.
        conv = await run_in_threadpool(get_conversation, user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = await run_in_threadpool(get_messages, user_id, conversation_id)
        return {
            "conversation": _public(conv),
            "messages": [_public(m) for m in messages],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")