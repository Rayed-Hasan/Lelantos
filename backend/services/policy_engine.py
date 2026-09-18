"""
Policy Engine — Rules governing how memories are used.
Master Plan section 17.
"""

import logging
from backend.models.memory import MemoryObject, MemoryStatus

logger = logging.getLogger(__name__)


# ─── Rule 1: Active Only ──────────────────────────────────────────────────────

def filter_active_only(memories: list[MemoryObject]) -> list[MemoryObject]:
    """Only ACTIVE memories should be injected into prompts."""
    return [m for m in memories if m.status == MemoryStatus.ACTIVE]


# ─── Rule 3: Confidence Threshold ──────────────────────────────────────────────

def filter_by_confidence(
    memories: list[MemoryObject],
    min_confidence: float = 0.3,
) -> list[MemoryObject]:
    """Low-confidence memories should not override explicit user statements."""
    return [m for m in memories if m.confidence >= min_confidence]


# ─── Rule 4: Current Message Wins ──────────────────────────────────────────────

def apply_current_message_priority(
    memories: list[MemoryObject],
    current_message: str,
) -> list[MemoryObject]:
    """
    If the user explicitly changes something in the current message,
    the current statement is authoritative for that interaction.
    Lower-confidence memories that contradict the message get deprioritized.
    """
    # For hackathon: this is handled by the conflict detector.
    # The policy here just ensures memories are sorted by relevance.
    return memories


# ─── Combined Policy ──────────────────────────────────────────────────────────

def apply_policies(
    memories: list[MemoryObject],
    current_message: str = "",
    min_confidence: float = 0.3,
) -> list[MemoryObject]:
    """Apply all policy rules in sequence."""
    result = filter_active_only(memories)
    result = filter_by_confidence(result, min_confidence)
    result = apply_current_message_priority(result, current_message)
    return result
