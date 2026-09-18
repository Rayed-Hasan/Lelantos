"""
Conflict Detector — Detects same-key memory conflicts.
Master Plan sections 12, 13, 34.

When a candidate memory has the same type+key as an existing ACTIVE memory
but a different value, a conflict is detected.
"""

import logging
from typing import Optional

from backend.models.memory import (
    MemoryCandidate, MemoryObject, MemoryStatus, MemorySource,
)
from backend.services.memory_engine import (
    get_active_memories, create_memory, version_memory, create_timeline_event,
)
from backend.models.memory import TimelineEvent

logger = logging.getLogger(__name__)


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
    1. Check if an ACTIVE memory with the same type+key exists
    2. If yes and values differ → conflict detected → version the memory
    3. If yes and values match → skip (duplicate)
    4. If no → create new memory

    Returns list of ConflictResult with details.
    """
    active_memories = get_active_memories(user_id)
    results = []

    for candidate in candidates:
        # Find existing ACTIVE memory with same type+key
        existing = _find_matching_memory(active_memories, candidate)

        if existing:
            if _values_match(existing.value, candidate.value):
                # Same value — skip, maybe update confidence
                logger.info(
                    f"Duplicate memory: {candidate.type.value}/{candidate.key} = {candidate.value}"
                )
                results.append(ConflictResult(
                    candidate=candidate,
                    has_conflict=False,
                    existing_memory=existing,
                    resolved_memory=existing,
                ))
            else:
                # CONFLICT: different value for same key
                logger.info(
                    f"CONFLICT: {candidate.type.value}/{candidate.key}: "
                    f"'{existing.value}' → '{candidate.value}'"
                )
                # Version the memory (old → REPLACED, new → ACTIVE)
                new_memory = version_memory(
                    user_id=user_id,
                    old_memory=existing,
                    new_value=candidate.value,
                    new_confidence=candidate.confidence,
                    source=source,
                )

                # Create conflict timeline event
                create_timeline_event(TimelineEvent(
                    user_id=user_id,
                    event_type="memory_conflict",
                    memory_id=new_memory.memory_id,
                    description=f"Conflict resolved: {candidate.key} changed from '{existing.value}' to '{candidate.value}'",
                    old_value=existing.value,
                    new_value=candidate.value,
                ))

                results.append(ConflictResult(
                    candidate=candidate,
                    has_conflict=True,
                    existing_memory=existing,
                    resolved_memory=new_memory,
                ))
        else:
            # No existing memory — create new
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

            # Timeline event
            create_timeline_event(TimelineEvent(
                user_id=user_id,
                event_type="memory_created",
                memory_id=created.memory_id,
                description=f"New {candidate.type.value}: {candidate.key} = {candidate.value}",
                new_value=candidate.value,
            ))

            results.append(ConflictResult(
                candidate=candidate,
                has_conflict=False,
                resolved_memory=created,
            ))

    return results


def _find_matching_memory(
    active_memories: list[MemoryObject],
    candidate: MemoryCandidate,
) -> Optional[MemoryObject]:
    """Find an ACTIVE memory with the same type and key."""
    for memory in active_memories:
        if memory.type == candidate.type and memory.key == candidate.key:
            return memory
    return None


def _values_match(existing_value: str, new_value: str) -> bool:
    """Check if two memory values are semantically the same (simple comparison)."""
    return existing_value.strip().lower() == new_value.strip().lower()
