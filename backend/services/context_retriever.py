"""
Context Retriever — Relevant memory retrieval and context assembly.
Master Plan sections 15, 16.

Instead of injecting ALL memories, retrieves only relevant ones based on
keyword/type matching, then ranks by confidence and recency.
"""

import logging
from typing import Optional

from backend.models.memory import MemoryObject, MemoryStatus, MemoryType
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


def retrieve_relevant_memories(
    user_id: str,
    query: str,
    limit: int = 10,
) -> list[MemoryObject]:
    """
    Retrieve memories relevant to the current user query.
    Uses keyword/type matching + confidence + recency ranking.
    """
    active_memories = get_active_memories(user_id)

    if not active_memories:
        return []

    # Score each memory for relevance
    scored = []
    for memory in active_memories:
        score = _compute_relevance_score(memory, query)
        scored.append((memory, score))

    # Sort by score (desc), then confidence (desc), then recency (desc)
    scored.sort(key=lambda x: (x[1], x[0].confidence, x[0].updated_at), reverse=True)

    # Return top N with non-zero relevance, or all if few memories
    if len(active_memories) <= limit:
        return active_memories

    relevant = [m for m, s in scored if s > 0][:limit]

    # Always include high-confidence memories even if not keyword-matched
    for memory in active_memories:
        if memory.confidence >= 0.9 and memory not in relevant:
            relevant.append(memory)
            if len(relevant) >= limit:
                break

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
        t = m.type.value
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(m)

    for mem_type, mems in by_type.items():
        lines.append(f"[{mem_type}]")
        for m in mems:
            conf_indicator = "●" if m.confidence >= 0.8 else "○"
            lines.append(f"  {conf_indicator} {m.key}: {m.value}")
        lines.append("")

    lines.append("Use this context when relevant. Do not invent additional memories.")
    return "\n".join(lines)


def _compute_relevance_score(memory: MemoryObject, query: str) -> float:
    """
    Compute a relevance score (0.0-1.0) for a memory given a query.
    Uses keyword matching against type keywords and key-specific keywords.
    """
    query_lower = query.lower()
    score = 0.0

    # Check type keywords
    type_kws = TYPE_KEYWORDS.get(memory.type.value, [])
    for kw in type_kws:
        if kw in query_lower:
            score += 0.3
            break

    # Check key-specific keywords
    key_kws = KEY_KEYWORDS.get(memory.key, [])
    for kw in key_kws:
        if kw in query_lower:
            score += 0.4
            break

    # Check if memory value appears in query
    if memory.value.lower() in query_lower:
        score += 0.3

    # Check if memory key appears in query
    key_readable = memory.key.replace("_", " ")
    if key_readable in query_lower or memory.key in query_lower:
        score += 0.3

    # Boost for high confidence
    if memory.confidence >= 0.9:
        score += 0.1

    return min(1.0, score)
