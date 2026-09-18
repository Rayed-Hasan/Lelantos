"""
Conversation Routes — Conversation list and detail endpoints.
Master Plan section 21, 36.
"""

import logging
from fastapi import APIRouter, Request, HTTPException

from backend.services.auth import get_current_user
from backend.services.conversation_manager import (
    list_conversations, get_conversation, get_messages,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations")


@router.get("")
async def list_conversations_endpoint(request: Request):
    """List all conversations for the current user."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        conversations = list_conversations(user_id)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{conversation_id}")
async def get_conversation_endpoint(conversation_id: str, request: Request):
    """Get a conversation with its messages."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        messages = get_messages(conversation_id)
        return {
            "conversation": conv,
            "messages": messages,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
