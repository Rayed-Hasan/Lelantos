"""
Chat Route — POST /chat endpoint.
Master Plan section 44: parallel Worker + Memory branches.

Pipeline:
1. Auth → get user (verified Cognito identity)
2. Create/use conversation (ownership verified) → store message
3. Parallel branches:
   - WORKER: Relevant retrieval → Context assembly → Bedrock → Response
   - MEMORY: Extraction → Conflict detection → Store
4. Return worker response + extraction info
"""

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, Request, HTTPException
from starlette.concurrency import run_in_threadpool

from backend.services.auth import get_current_user
from backend.services.bedrock import invoke_llama
from backend.services.memory_engine import get_active_memories
from backend.services.memory_extractor import extract_memories
from backend.services.conflict_detector import detect_and_resolve_conflicts
from backend.services.context_retriever import retrieve_relevant_memories, assemble_context
from backend.services.policy_engine import apply_policies
from backend.services.conversation_manager import (
    create_conversation, store_message, get_recent_messages,
    update_conversation_title, get_conversation,
    ConversationNotFoundError,
)
from backend.models.memory import MemorySource

logger = logging.getLogger(__name__)
router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=4)

MAX_MESSAGE_CHARS = 8000


async def _resolve_conversation(user_id: str, conversation_id, message: str) -> str:
    """
    Return a conversation ID that belongs to this user.
    A missing, unknown, or someone else's ID results in a NEW conversation
    (the response returns the new ID, so the client switches to it).
    """
    if conversation_id:
        conv = await run_in_threadpool(get_conversation, user_id, conversation_id)
        if conv:
            return conversation_id

    new_conv = await run_in_threadpool(create_conversation, user_id, message[:50])
    return new_conv.conversation_id


@router.post("/chat")
async def chat(request: Request, user: dict = Depends(get_current_user)):
    """
    Main chat pipeline (section 44).
    Worker and Memory branches run in parallel.
    """
    user_id = user["user_id"]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")

    message = body.get("message", "")
    if not isinstance(message, str):
        raise HTTPException(status_code=400, detail="Message must be a string")
    message = message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(message) > MAX_MESSAGE_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Message too long (max {MAX_MESSAGE_CHARS} characters)",
        )

    conversation_id = body.get("conversation_id")
    if conversation_id is not None and not isinstance(conversation_id, str):
        raise HTTPException(status_code=400, detail="Invalid conversation_id")

    # Create or resume conversation, store the user message, load history
    try:
        conversation_id = await _resolve_conversation(user_id, conversation_id, message)
        user_msg = await run_in_threadpool(
            store_message, user_id, conversation_id, "user", message
        )
        recent_messages = await run_in_threadpool(
            get_recent_messages, user_id, conversation_id, 10
        )
    except ConversationNotFoundError:
        raise HTTPException(status_code=404, detail="Conversation not found")
    except Exception as e:
        logger.error(f"Failed to prepare conversation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

    history_context = ""
    for msg in recent_messages[:-1]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_context += f"{role.capitalize()}: {content}\n"

    # ── Run Worker and Memory branches in parallel ──────────────────
    loop = asyncio.get_running_loop()

    worker_future = loop.run_in_executor(
        _executor, _worker_branch, user_id, message, history_context,
    )
    memory_future = loop.run_in_executor(
        _executor, _memory_branch, user_id, message, conversation_id, user_msg.message_id,
    )
    # Retrieve the memory branch's exception if we bail out early, so Python
    # doesn't log "exception was never retrieved".
    memory_future.add_done_callback(lambda f: f.cancelled() or f.exception())

    # Wait for worker response (user-facing, latency-critical)
    try:
        worker_result = await worker_future
    except Exception as e:
        logger.error(f"Worker branch failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again.",
        )

    worker_response = worker_result["response"]
    memories_used = worker_result.get("memories_used", [])

    # Check memory branch (non-blocking — don't fail if extraction fails)
    memories_extracted = []
    conflicts_detected = []
    try:
        memory_result = await memory_future
        memories_extracted = memory_result.get("extracted", [])
        conflicts_detected = memory_result.get("conflicts", [])
    except Exception as e:
        logger.warning(f"Memory branch failed (non-fatal): {e}")

    # Store assistant response (non-fatal: the user already has their answer)
    try:
        await run_in_threadpool(
            store_message, user_id, conversation_id, "assistant", worker_response
        )
        # Auto-title the conversation after first exchange
        if len(recent_messages) <= 1:
            await run_in_threadpool(
                update_conversation_title, user_id, conversation_id, message[:60]
            )
    except Exception as e:
        logger.error(f"Failed to store assistant message: {e}", exc_info=True)

    return {
        "response": worker_response,
        "conversation_id": conversation_id,
        "message_id": user_msg.message_id,
        "memories_used": memories_used,
        "memories_extracted": memories_extracted,
        "conflicts_detected": conflicts_detected,
    }


def _worker_branch(user_id: str, message: str, history_context: str) -> dict:
    """
    WORKER BRANCH: Retrieve relevant memories → assemble context → call Bedrock.
    Returns dict with response text and metadata.
    """
    # Retrieve relevant memories (not all) — scoped to this user
    relevant_memories = retrieve_relevant_memories(user_id, message)

    # Apply policies
    filtered = apply_policies(relevant_memories, current_message=message)

    # Assemble context
    context = assemble_context(filtered)

    # Build system prompt
    system_prompt = (
        "You are a helpful AI assistant using Lelantos as an external context layer. "
        "Be concise, direct, and use the provided user context when relevant. "
        "Do not invent additional memories or facts about the user."
    )
    if context:
        system_prompt += f"\n\n{context}"

    # Build user prompt with history
    user_prompt = f"{history_context}User: {message}\nAssistant:" if history_context else message

    # Call Bedrock
    response = invoke_llama(system_prompt, user_prompt, max_gen_len=512)

    return {
        "response": response,
        "memories_used": [
            {"type": m.type.value, "key": m.key, "value": m.value}
            for m in filtered
        ],
    }


def _memory_branch(
    user_id: str,
    message: str,
    conversation_id: str,
    message_id: str,
) -> dict:
    """
    MEMORY BRANCH: Extract candidate memories → detect conflicts → store.
    """
    existing = get_active_memories(user_id)

    candidates = extract_memories(
        user_message=message,
        existing_memories=existing,
        conversation_id=conversation_id,
        message_id=message_id,
    )

    if not candidates:
        return {"extracted": [], "conflicts": []}

    source = MemorySource(
        conversation_id=conversation_id,
        message_id=message_id,
        text=message[:500],
    )

    results = detect_and_resolve_conflicts(user_id, candidates, source=source)

    extracted = [
        {
            "type": r.candidate.type.value,
            "key": r.candidate.key,
            "value": r.candidate.value,
            "confidence": r.candidate.confidence,
            "memory_id": r.resolved_memory.memory_id if r.resolved_memory else None,
        }
        for r in results
    ]

    conflicts = [r.to_dict() for r in results if r.has_conflict]

    return {"extracted": extracted, "conflicts": conflicts}