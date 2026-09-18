"""
Memory Routes — All memory CRUD API endpoints.
Master Plan sections 18, 19.
"""

import logging
from fastapi import APIRouter, Request, HTTPException
from typing import Optional

from backend.services.auth import get_current_user
from backend.services.memory_engine import (
    create_memory, get_memory, list_memories, update_memory,
    delete_memory, delete_all_memories, get_user_profile,
    get_timeline, get_active_memories, get_memory_history,
)
from backend.services.memory_extractor import extract_memories
from backend.services.conflict_detector import detect_and_resolve_conflicts
from backend.services.context_retriever import retrieve_relevant_memories
from backend.models.memory import (
    MemoryObject, MemoryStatus, MemoryType, MemorySource,
    MemoryCreateRequest, MemoryUpdateRequest, MemoryQueryRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/memory")


# ─── POST /memory — Create a memory manually ──────────────────────────────────

@router.post("")
async def create_memory_endpoint(request: Request):
    """Create a new memory manually."""
    user = get_current_user(request)
    user_id = user["user_id"]
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    raw_type = body.get("type", "FACT")
    try:
        mem_type = MemoryType(raw_type.upper() if isinstance(raw_type, str) else raw_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid memory type: {raw_type}")

    try:
        memory = MemoryObject(
            user_id=user_id,
            type=mem_type,
            key=body.get("key", "other"),
            value=body.get("value", ""),
            confidence=float(body.get("confidence", 0.9)),
            source=MemorySource(text="Manually created by user"),
        )
        created = create_memory(memory)
        return {"status": "created", "memory": created.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /memory/profile — User memory profile ────────────────────────────────

@router.get("/profile")
async def get_profile(request: Request):
    """Get user's complete memory profile summary."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        profile = get_user_profile(user_id)
        return profile
    except Exception as e:
        logger.error(f"Failed to get profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /memory/timeline — Timeline events ───────────────────────────────────

@router.get("/timeline")
async def get_timeline_endpoint(request: Request):
    """Get timeline of memory changes."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        events = get_timeline(user_id)
        return {"events": events}
    except Exception as e:
        logger.error(f"Failed to get timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /memory/query — Query relevant memories ─────────────────────────────

@router.post("/query")
async def query_memories(request: Request):
    """Query for relevant memories based on a query string."""
    user = get_current_user(request)
    user_id = user["user_id"]
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    query = body.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        memories = retrieve_relevant_memories(user_id, query)
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
        logger.error(f"Failed to query memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /memory/extract — Manual extraction trigger ─────────────────────────

@router.post("/extract")
async def extract_memories_endpoint(request: Request):
    """Manually trigger memory extraction from text."""
    user = get_current_user(request)
    user_id = user["user_id"]
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        existing = get_active_memories(user_id)
        candidates = extract_memories(text, existing)

        if candidates:
            source = MemorySource(text=text[:500])
            results = detect_and_resolve_conflicts(user_id, candidates, source=source)
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
        return {"extracted": []}
    except Exception as e:
        logger.error(f"Failed to extract memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /memory/{memory_id} — Get single memory with history ─────────────────

@router.get("/{memory_id}")
async def get_memory_endpoint(memory_id: str, request: Request):
    """Get a single memory by ID, including version history."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        memory = get_memory(user_id, memory_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Memory not found")

        # Get version history
        history = get_memory_history(user_id, memory.key, memory.type.value)

        return {
            "memory": memory.model_dump(),
            "history": [m.model_dump() for m in history],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── PATCH /memory/{memory_id} — Update a memory ──────────────────────────────

@router.patch("/{memory_id}")
async def update_memory_endpoint(memory_id: str, request: Request):
    """Update a memory's value, status, or confidence."""
    user = get_current_user(request)
    user_id = user["user_id"]
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON in request body")

    try:
        status_val = None
        if "status" in body:
            raw_status = body["status"]
            try:
                status_val = MemoryStatus(raw_status.upper() if isinstance(raw_status, str) else raw_status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid memory status: {raw_status}")

        updated = update_memory(
            user_id=user_id,
            memory_id=memory_id,
            value=body.get("value"),
            status=status_val,
            confidence=body.get("confidence"),
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Memory not found")

        return {"status": "updated", "memory": updated.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── DELETE /memory/{memory_id} — Soft-delete a memory ────────────────────────

@router.delete("/{memory_id}")
async def delete_memory_endpoint(memory_id: str, request: Request):
    """Soft-delete a memory (set status to DELETED)."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        success = delete_memory(user_id, memory_id)
        if not success:
            raise HTTPException(status_code=404, detail="Memory not found")
        return {"status": "deleted", "memory_id": memory_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── DELETE /memory — Delete all memories ──────────────────────────────────────

@router.delete("")
async def delete_all_memories_endpoint(request: Request):
    """Delete all memories for the current user."""
    user = get_current_user(request)
    user_id = user["user_id"]

    try:
        count = delete_all_memories(user_id)
        return {"status": "deleted", "count": count}
    except Exception as e:
        logger.error(f"Failed to delete all memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))
