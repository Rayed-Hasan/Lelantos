"""
Memory Routes — All memory CRUD API endpoints.
Master Plan sections 18, 19.

Every endpoint takes its user_id from the verified Cognito token
(Depends(get_current_user)). No endpoint ever accepts a user_id from the
request body, query string, or URL.
"""

import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from starlette.concurrency import run_in_threadpool

from backend.services.auth import get_current_user
from backend.services.memory_engine import (
    create_memory, get_memory, update_memory,
    delete_memory, delete_all_memories, get_user_profile,
    get_timeline, get_active_memories, get_memory_history,
)
from backend.services.memory_extractor import extract_memories
from backend.services.conflict_detector import detect_and_resolve_conflicts
from backend.services.context_retriever import retrieve_relevant_memories
from backend.models.memory import (
    MemoryObject, MemoryStatus, MemoryType, MemorySource,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/memory")


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _json_body(request: Request) -> dict:
    """Parse the request body as a JSON object or raise 400."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")
    return body


def _internal_error(action: str, exc: Exception) -> HTTPException:
    """Log the real error server-side; never leak internals to the client."""
    logger.error("Failed to %s: %s", action, exc, exc_info=True)
    return HTTPException(status_code=500, detail="Internal server error")


def _parse_confidence(value, default: float | None = None) -> float | None:
    """Convert to float and require 0.0 <= confidence <= 1.0."""
    if value is None:
        return default
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Confidence must be a number")
    if not 0.0 <= confidence <= 1.0:
        raise HTTPException(status_code=400, detail="Confidence must be between 0 and 1")
    return confidence


# ─── POST /memory — Create a memory manually ──────────────────────────────────

@router.post("")
async def create_memory_endpoint(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Create a new memory manually."""
    user_id = user["user_id"]
    body = await _json_body(request)

    raw_type = body.get("type", "FACT")
    try:
        mem_type = MemoryType(raw_type.upper() if isinstance(raw_type, str) else raw_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid memory type: {raw_type}")

    value = body.get("value", "")
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=400, detail="Memory value cannot be empty")

    confidence = _parse_confidence(body.get("confidence"), default=0.9)

    try:
        memory = MemoryObject(
            user_id=user_id,
            type=mem_type,
            key=body.get("key") or "other",
            value=value.strip(),
            confidence=confidence,
            source=MemorySource(text="Manually created by user"),
        )
        created = await run_in_threadpool(create_memory, memory)
        return {"status": "created", "memory": created.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        raise _internal_error("create memory", e)


# ─── GET /memory/profile — User memory profile ────────────────────────────────

@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user's complete memory profile summary."""
    try:
        return await run_in_threadpool(get_user_profile, user["user_id"])
    except Exception as e:
        raise _internal_error("get profile", e)


# ─── GET /memory/timeline — Timeline events ───────────────────────────────────

@router.get("/timeline")
async def get_timeline_endpoint(user: dict = Depends(get_current_user)):
    """Get timeline of memory changes."""
    try:
        events = await run_in_threadpool(get_timeline, user["user_id"])
        return {"events": events}
    except Exception as e:
        raise _internal_error("get timeline", e)


# ─── POST /memory/query — Query relevant memories ─────────────────────────────

@router.post("/query")
async def query_memories(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Query for relevant memories based on a query string."""
    user_id = user["user_id"]
    body = await _json_body(request)

    query = body.get("query", "")
    if not isinstance(query, str) or not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        memories = await run_in_threadpool(retrieve_relevant_memories, user_id, query)
        return {
            "context": [
                {
                    "type": m.type.value,
                    "key": m.key,
                    "value": m.value,
                    "confidence": m.confidence,
                    "memory_id": m.memory_id,
                }
                for m in memories
            ]
        }
    except Exception as e:
        raise _internal_error("query memories", e)


# ─── POST /memory/extract — Manual extraction trigger ─────────────────────────

@router.post("/extract")
async def extract_memories_endpoint(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Manually trigger memory extraction from text."""
    user_id = user["user_id"]
    body = await _json_body(request)

    text = body.get("text", "")
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        existing = await run_in_threadpool(get_active_memories, user_id)
        candidates = await run_in_threadpool(extract_memories, text, existing)

        if not candidates:
            return {"extracted": []}

        source = MemorySource(text=text[:500])
        results = await run_in_threadpool(
            detect_and_resolve_conflicts, user_id, candidates, source=source
        )
        return {
            "extracted": [
                {
                    "type": r.candidate.type.value,
                    "key": r.candidate.key,
                    "value": r.candidate.value,
                    "confidence": r.candidate.confidence,
                    "conflict": r.has_conflict,
                }
                for r in results
            ]
        }
    except Exception as e:
        raise _internal_error("extract memories", e)


# ─── GET /memory/{memory_id} — Get single memory with history ─────────────────
# NOTE: keep the fixed paths above (/profile, /timeline, /query, /extract)
# declared BEFORE this route, or "/{memory_id}" will swallow them.

@router.get("/{memory_id}")
async def get_memory_endpoint(
    memory_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single memory by ID, including version history."""
    user_id = user["user_id"]

    try:
        # Scoped by user_id: another user's memory_id returns 404, not their data.
        memory = await run_in_threadpool(get_memory, user_id, memory_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Memory not found")

        history = await run_in_threadpool(
            get_memory_history, user_id, memory.key, memory.type.value
        )

        return {
            "memory": memory.model_dump(),
            "history": [m.model_dump() for m in history],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise _internal_error("get memory", e)


# ─── PATCH /memory/{memory_id} — Update a memory ──────────────────────────────

@router.patch("/{memory_id}")
async def update_memory_endpoint(
    memory_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Update a memory's value, status, or confidence."""
    user_id = user["user_id"]
    body = await _json_body(request)

    status_val = None
    if "status" in body:
        raw_status = body["status"]
        try:
            status_val = MemoryStatus(
                raw_status.upper() if isinstance(raw_status, str) else raw_status
            )
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid memory status: {raw_status}")

    value = body.get("value")
    if value is not None and (not isinstance(value, str) or not value.strip()):
        raise HTTPException(status_code=400, detail="Memory value cannot be empty")

    confidence = _parse_confidence(body.get("confidence"))

    try:
        updated = await run_in_threadpool(
            update_memory,
            user_id=user_id,
            memory_id=memory_id,
            value=value.strip() if isinstance(value, str) else None,
            status=status_val,
            confidence=confidence,
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Memory not found")

        return {"status": "updated", "memory": updated.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        raise _internal_error("update memory", e)


# ─── DELETE /memory/{memory_id} — Soft-delete a memory ────────────────────────

@router.delete("/{memory_id}")
async def delete_memory_endpoint(
    memory_id: str,
    user: dict = Depends(get_current_user),
):
    """Soft-delete a memory (set status to DELETED)."""
    try:
        success = await run_in_threadpool(delete_memory, user["user_id"], memory_id)
        if not success:
            raise HTTPException(status_code=404, detail="Memory not found")
        return {"status": "deleted", "memory_id": memory_id}
    except HTTPException:
        raise
    except Exception as e:
        raise _internal_error("delete memory", e)


# ─── DELETE /memory — Delete all memories ─────────────────────────────────────

@router.delete("")
async def delete_all_memories_endpoint(user: dict = Depends(get_current_user)):
    """Delete all memories for the current user only."""
    try:
        count = await run_in_threadpool(delete_all_memories, user["user_id"])
        return {"status": "deleted", "count": count}
    except Exception as e:
        raise _internal_error("delete all memories", e)