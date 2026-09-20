"""
Context Retriever — Relevant memory retrieval and context assembly.
Master Plan sections 15, 16.

Instead of injecting ALL memories, retrieves only relevant ones based on
keyword/type matching, then ranks by confidence and recency.

Isolation: memories are loaded only via get_active_memories(user_id); nothing
in this module holds cross-user state.
"""

import logging
import re
from datetime import datetime, timezone
from functools import lru_cache

from backend.models.memory import MemoryObject
from backend.services.memory_engine import get_active_memories

logger = logging.getLogger(__name__)

# Keywords that map to memory types for relevance matching
TYPE_KEYWORDS: dict[str, list[str]] = {
    "IDENTITY": ["name", "who am i", "my name", "introduce", "about me"],
    "PREFERENCE": ["prefer", "like", "favorite", "want", "style"],
    "CONSTRAINT": ["budget", "limit", "constraint", "restriction", "cannot", "must not", "can't"],
    "PROJECT": ["project", "building", "working on", "creating", "app", "product"],
    "GOAL": ["goal", "aim", "want to", "trying to", "objective", "finish"],
    "DECISION": ["decided", "chose", "using", "switched to", "backend", "frontend", "database", "tech stack", "architecture"],
    "FACT": ["fact", "know", "remember"],
    "RELATIONSHIP": ["team", "partner", "colleague", "working with"],
    "TEMPORARY": ["currently", "right now", "at the moment", "today"],
}

# Key-specific keywords for finer matching
KEY_KEYWORDS: dict[str, list[str]] = {
    "budget": ["budget", "cost", "money", "price", "rupee", "dollar", "₹", "$", "afford"],
    "backend": ["backend", "server", "api", "python", "node", "java", "go", "rust"],
    "frontend": ["frontend", "ui", "react", "vue", "angular", "next", "interface"],
    "database": ["database", "db", "sql", "dynamodb", "mongo", "postgres"],
    "project_name": ["project", "called", "named", "building"],
    "deadline": ["deadline", "due", "by when", "finish by", "complete by"],
    "team_size": ["team", "solo", "alone", "members", "people"],
    "language": ["language", "python", "javascript", "typescript", "java"],
    "framework": ["framework", "react", "django", "express", "flask"],
    "primary_goal": ["goal", "achieve", "accomplish", "finish", "complete"],
    "user_name": ["name", "call me", "i'm", "i am"],
    "role": ["role", "developer", "designer", "manager", "student"],
}

MAX_CONTEXT_VALUE_CHARS = 300


# ─── Matching helpers ─────────────────────────────────────────────────────────

@lru_cache(maxsize=1024)
def _term_pattern(term: str) -> re.Pattern:
    # Whole-word match, so "go" doesn't match "google" or "api" match "capital".
    return re.compile(r"(?<!\w)" + re.escape(term) + r"(?!\w)")


def _has_term(text: str, term: str) -> bool:
    return bool(term) and _term_pattern(term).search(text) is not None


def _is_expired(memory: MemoryObject) -> bool:
    """True if the memory has an expires_at in the past. Unparseable = keep."""
    if not memory.expires_at:
        return False
    try:
        expires = datetime.fromisoformat(str(memory.expires_at).replace("Z", "+00:00"))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return expires < datetime.now(timezone.utc)
    except (ValueError, TypeError):
        return False


def _clean(text: str) -> str:
    """Flatten whitespace/newlines and cap length before putting text in a prompt."""
    flat = " ".join(str(text).split())
    if len(flat) > MAX_CONTEXT_VALUE_CHARS:
        flat = flat[:MAX_CONTEXT_VALUE_CHARS] + "…"
    return flat


# ─── Retrieval ────────────────────────────────────────────────────────────────

def retrieve_relevant_memories(
    user_id: str,
    query: str,
    limit: int = 10,
) -> list[MemoryObject]:
    """
    Retrieve memories relevant to the current user query.
    Uses keyword/type matching + confidence + recency ranking.
    """
    active_memories = [m for m in get_active_memories(user_id) if not _is_expired(m)]

    if not active_memories:
        return []

    # Score each memory for relevance
    scored = [(m, _compute_relevance_score(m, query)) for m in active_memories]

    # Sort by score (desc), then confidence (desc), then recency (desc)
    scored.sort(key=lambda x: (x[1], x[0].confidence, x[0].updated_at), reverse=True)

    # Few memories: return every one with non-zero relevance
    if len(active_memories) <= limit:
        return [m for m, s in scored if s > 0]

    relevant = [m for m, s in scored if s > 0][:limit]
    seen_ids = {m.memory_id for m in relevant}

    # Always include high-confidence memories even if not keyword-matched
    for memory in active_memories:
        if len(relevant) >= limit:
            break
        if memory.confidence >= 0.9 and memory.memory_id not in seen_ids:
            relevant.append(memory)
            seen_ids.add(memory.memory_id)

    return relevant[:limit]


def assemble_context(memories: list[MemoryObject]) -> str:
    """
    Assemble retrieved memories into a context string for the Worker LLM.
    Section 16 format.
    """
    if not memories:
        return ""

    lines = ["Relevant user context from Lelantos (portable AI context layer):", ""]

    # Group by type for clean display
    by_type: dict[str, list[MemoryObject]] = {}
    for m in memories:
        by_type.setdefault(m.type.value, []).append(m)

    for mem_type, mems in by_type.items():
        lines.append(f"[{mem_type}]")
        for m in mems:
            conf_indicator = "●" if m.confidence >= 0.8 else "○"
            # _clean stops a stored value from injecting fake sections/instructions
            # via newlines into the prompt.
            lines.append(f"  {conf_indicator} {_clean(m.key)}: {_clean(m.value)}")
        lines.append("")

    lines.append("Use this context when relevant. Do not invent additional memories.")
    return "\n".join(lines)


def _compute_relevance_score(memory: MemoryObject, query: str) -> float:
    """
    Compute a relevance score (0.0-1.0) for a memory given a query.
    Uses whole-word keyword matching against type and key keywords.
    """
    query_lower = query.lower()
    score = 0.0

    # Type keywords
    for kw in TYPE_KEYWORDS.get(memory.type.value, []):
        if _has_term(query_lower, kw):
            score += 0.3
            break

    # Key-specific keywords
    for kw in KEY_KEYWORDS.get(memory.key, []):
        if _has_term(query_lower, kw):
            score += 0.4
            break

    # Memory value mentioned in the query (was reversed before: it checked
    # whether the whole query was inside the value, which almost never matched).
    value_lower = memory.value.lower().strip()
    if len(value_lower) >= 3 and _has_term(query_lower, value_lower):
        score += 0.3

    # Memory key mentioned in the query
    key_readable = memory.key.replace("_", " ")
    if _has_term(query_lower, key_readable) or _has_term(query_lower, memory.key):
        score += 0.3

    # Boost for high confidence
    if memory.confidence >= 0.9:
        score += 0.1

    return min(1.0, score)