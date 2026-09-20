"""
Conflict Detector — Detects same-key memory conflicts.
Master Plan sections 12, 13, 34.

When a candidate memory has the same type+key as an existing ACTIVE memory
but a different value, a conflict is detected.

Exception: the key "other" is a catch-all bucket (FACT, RELATIONSHIP,
TEMPORARY), not a single slot. Several different "other" memories can coexist,
so they are only de-duplicated by value and never treated as conflicts.

All reads/writes are scoped to the given user_id.
"""

import logging
from typing import Optional

from backend.models.memory import (
    MemoryCandidate, MemoryObject, MemoryStatus, MemorySource, TimelineEvent,
)
from backend.services.memory_engine import (
    get_active_memories, create_memory, version_memory,
    create_timeline_event, update_memory,
)

logger = logging.getLogger(__name__)

# Keys that hold many independent values instead of one "current" value.
MULTI_VALUE_KEYS = {"other"}

# A tentative candidate (below this confidence) will not overwrite an existing
# memory with a different value. Set to 0.0 to disable this protection.
MIN_CONFIDENCE_TO_OVERRIDE = 0.5


class ConflictResult:
    """Result of conflict detection for a candidate memory."""
    def __init__(
        self,
        candidate: MemoryCandidate,
        has_conflict: bool,
        existing_memory: Optional[MemoryObject] = None,
        resolved_memory: Optional[MemoryObject] = None,
    ):
        self.candidate = candidate
        self.has_conflict = has_conflict
        self.existing_memory = existing_memory
        self.resolved_memory = resolved_memory

    def to_dict(self) -> dict:
        result = {
            "has_conflict": self.has_conflict,
            "candidate": {
                "type": self.candidate.type.value,
                "key": self.candidate.key,
                "value": self.candidate.value,
                "confidence": self.candidate.confidence,
            },
        }
        if self.existing_memory:
            result["previous_value"] = self.existing_memory.value
            result["previous_memory_id"] = self.existing_memory.memory_id
        if self.resolved_memory:
            result["new_memory_id"] = self.resolved_memory.memory_id
        return result


def detect_and_resolve_conflicts(
    user_id: str,
    candidates: list[MemoryCandidate],
    source: Optional[MemorySource] = None,
) -> list[ConflictResult]:
    """
    For each candidate memory:
    1. Look for an ACTIVE memory with the same type+key (for "other": same value)
    2. If found and values differ → conflict → version the memory
    3. If found and values match → duplicate (bump confidence if higher)
    4. If not found → create new memory

    A failure on one candidate is logged and skipped; it does not abort the rest.
    Returns list of ConflictResult with details.
    """
    active_memories = list(get_active_memories(user_id))
    results: list[ConflictResult] = []

    for candidate in candidates:
        try:
            result = _process_candidate(user_id, candidate, active_memories, source)
        except Exception as e:
            logger.error(
                f"Failed to process candidate {candidate.type.value}/{candidate.key}: {e}",
                exc_info=True,
            )
            continue

        if result is not None:
            results.append(result)

    return results


def _process_candidate(
    user_id: str,
    candidate: MemoryCandidate,
    active_memories: list[MemoryObject],
    source: Optional[MemorySource],
) -> Optional[ConflictResult]:
    """
    Handle one candidate. Mutates `active_memories` so later candidates in the
    same batch see the effect of earlier ones.
    """
    existing = _find_matching_memory(active_memories, candidate)

    # ── Same slot already has a memory ────────────────────────────
    if existing:
        if _values_match(existing.value, candidate.value):
            logger.info(
                f"Duplicate memory: {candidate.type.value}/{candidate.key} = {candidate.value}"
            )
            resolved = existing

            # Same fact restated more confidently → keep the higher confidence
            if candidate.confidence > existing.confidence:
                updated = update_memory(
                    user_id, existing.memory_id, confidence=candidate.confidence
                )
                if updated:
                    _replace_in_list(active_memories, existing, updated)
                    resolved = updated

            return ConflictResult(
                candidate=candidate,
                has_conflict=False,
                existing_memory=existing,
                resolved_memory=resolved,
            )

        # Different value, but the candidate is too tentative to override
        if candidate.confidence < MIN_CONFIDENCE_TO_OVERRIDE:
            logger.info(
                f"Ignoring low-confidence override ({candidate.confidence}): "
                f"{candidate.type.value}/{candidate.key} '{existing.value}' → '{candidate.value}'"
            )
            return ConflictResult(
                candidate=candidate,
                has_conflict=False,
                existing_memory=existing,
                resolved_memory=None,
            )

        # CONFLICT: different value for same key
        logger.info(
            f"CONFLICT: {candidate.type.value}/{candidate.key}: "
            f"'{existing.value}' → '{candidate.value}'"
        )
        new_memory = version_memory(
            user_id=user_id,
            old_memory=existing,
            new_value=candidate.value,
            new_confidence=candidate.confidence,
            source=source,
        )
        _replace_in_list(active_memories, existing, new_memory)

        create_timeline_event(TimelineEvent(
            user_id=user_id,
            event_type="memory_conflict",
            memory_id=new_memory.memory_id,
            description=(
                f"Conflict resolved: {candidate.key} changed from "
                f"'{existing.value}' to '{candidate.value}'"
            ),
            old_value=existing.value,
            new_value=candidate.value,
        ))

        return ConflictResult(
            candidate=candidate,
            has_conflict=True,
            existing_memory=existing,
            resolved_memory=new_memory,
        )

    # ── No existing memory — create new ───────────────────────────
    new_memory = MemoryObject(
        user_id=user_id,
        type=candidate.type,
        key=candidate.key,
        value=candidate.value,
        confidence=candidate.confidence,
        status=MemoryStatus.ACTIVE,
        source=source,
    )
    created = create_memory(new_memory)
    active_memories.append(created)

    create_timeline_event(TimelineEvent(
        user_id=user_id,
        event_type="memory_created",
        memory_id=created.memory_id,
        description=f"New {candidate.type.value}: {candidate.key} = {candidate.value}",
        new_value=candidate.value,
    ))

    return ConflictResult(
        candidate=candidate,
        has_conflict=False,
        resolved_memory=created,
    )


def _find_matching_memory(
    active_memories: list[MemoryObject],
    candidate: MemoryCandidate,
) -> Optional[MemoryObject]:
    """
    Find the ACTIVE memory occupying the candidate's slot.
    Normal keys: same type+key. Multi-value keys ("other"): same type+key+value.
    """
    for memory in active_memories:
        if memory.type != candidate.type or memory.key != candidate.key:
            continue
        if candidate.key in MULTI_VALUE_KEYS and not _values_match(
            memory.value, candidate.value
        ):
            continue
        return memory
    return None


def _replace_in_list(
    memories: list[MemoryObject], old: MemoryObject, new: MemoryObject
) -> None:
    """Swap `old` for `new` in the working list (in place)."""
    memories[:] = [m for m in memories if m.memory_id != old.memory_id]
    memories.append(new)


def _values_match(existing_value: str, new_value: str) -> bool:
    """Check if two memory values are the same (simple normalized comparison)."""
    return " ".join(existing_value.split()).lower() == " ".join(new_value.split()).lower()