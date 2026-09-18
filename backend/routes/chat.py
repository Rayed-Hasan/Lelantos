"""
Chat Route — POST /chat endpoint.
Master Plan section 44: parallel Worker + Memory branches.

Pipeline:
1. Auth → get user
2. Create/use conversation → store message
3. Parallel branches:
   - WORKER: Relevant retrieval → Context assembly → Bedrock → Response
   - MEMORY: Extraction → Conflict detection → Store
4. Return worker response + extraction info
"""

import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Request, HTTPException

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
)
from backend.models.memory import MemorySource

logger = logging.getLogger(__name__)
router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=4)


@router.post("/chat")
async def chat(request: Request):
    """
    Main chat pipeline (section 44).
    Worker and Memory branches run in parallel.
    """
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    message = body.get("message", "").strip()
    conversation_id = body.get("conversation_id")

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Create or resume conversation
    if not conversation_id:
        conv = create_conversation(user_id, title=message[:50])
        conversation_id = conv.conversation_id
    else:
        conv = get_conversation(user_id, conversation_id)
        if not conv:
            conv_record = create_conversation(user_id, title=message[:50])
            conversation_id = conv_record.conversation_id

    # Store user message
    user_msg = store_message(conversation_id, "user", message)

    # Get chat history for context
    recent_messages = get_recent_messages(conversation_id, limit=10)
    history_context = ""
    for msg in recent_messages[:-1]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_context += f"{role.capitalize()}: {content}\n"

    # ── Run Worker and Memory branches in parallel ──────────────────
    loop = asyncio.get_event_loop()

    worker_future = loop.run_in_executor(
        _executor, _worker_branch, user_id, message, history_context,
    )
    memory_future = loop.run_in_executor(
        _executor, _memory_branch, user_id, message, conversation_id, user_msg.message_id,
    )

    # Wait for worker response (user-facing, latency-critical)
    try:
        worker_result = await worker_future
    except Exception as e:
        logger.error(f"Worker branch failed: {e}")
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

    # Store assistant response
    store_message(conversation_id, "assistant", worker_response)

    # Auto-title the conversation after first exchange
    if len(recent_messages) <= 1:
        update_conversation_title(user_id, conversation_id, message[:60])

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
    # Retrieve relevant memories (not all)
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
