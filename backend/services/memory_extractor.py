"""
Memory Extractor — LLM-based extraction of candidate memories.
Master Plan section 9, 12.

Takes conversation message + existing memories → produces candidate memories
with types, keys (from fixed vocabulary), values, and confidence scores.
"""

import json
import re
import logging
from typing import Optional

from backend.models.memory import (
    MemoryCandidate, MemoryType, MemoryObject,
    FIXED_KEY_VOCABULARY, normalize_key,
)
from backend.services.bedrock import invoke_llama

logger = logging.getLogger(__name__)

# ─── Extraction Prompt with fixed key vocabulary (section 12) ──────────────────

EXTRACTION_SYSTEM_PROMPT = """You are a Memory Extraction Agent for Lelantos, a portable AI context layer.

Your job: analyze the user message and extract CANDIDATE MEMORIES — structured facts about the user.

MEMORY TYPES and their ALLOWED KEYS (use ONLY these keys):

IDENTITY: user_name, role
PREFERENCE: language, framework, style, communication_style
CONSTRAINT: budget, timeline, tech_constraint, team_size
PROJECT: project_name, project_type, deadline
GOAL: primary_goal
DECISION: backend, frontend, database, hosting, auth_provider
FACT: other
RELATIONSHIP: other
TEMPORARY: other

RULES:
1. Extract ONLY facts explicitly stated or strongly implied by the user.
2. Do NOT invent facts the user did not state.
3. Each candidate must have: type, key, value, confidence (0.0 to 1.0).
4. Explicit statements get high confidence (0.85-1.0). Inferences get lower (0.3-0.7).
5. If a fact doesn't fit an allowed key, use "other" for that type.
6. Return ONLY valid JSON. No prose, no markdown fences, no explanation.

OUTPUT FORMAT (strict JSON):
{"candidates": [{"type": "TYPE", "key": "key_name", "value": "extracted value", "confidence": 0.95}]}

If no memories to extract, return: {"candidates": []}

EXAMPLES:

User: "I'm building a SaaS product called Lelantos. Backend must use Python. Budget is 5000 rupees per month."
Output: {"candidates": [{"type": "PROJECT", "key": "project_name", "value": "Lelantos", "confidence": 0.98}, {"type": "PROJECT", "key": "project_type", "value": "SaaS product", "confidence": 0.95}, {"type": "DECISION", "key": "backend", "value": "Python", "confidence": 0.98}, {"type": "CONSTRAINT", "key": "budget", "value": "5000 rupees/month", "confidence": 0.98}]}

User: "I think React might be nice for the frontend"
Output: {"candidates": [{"type": "PREFERENCE", "key": "framework", "value": "React", "confidence": 0.6}]}

User: "We changed the backend to Node.js"
Output: {"candidates": [{"type": "DECISION", "key": "backend", "value": "Node.js", "confidence": 0.97}]}"""


def extract_memories(
    user_message: str,
    existing_memories: list[MemoryObject],
    conversation_id: Optional[str] = None,
    message_id: Optional[str] = None,
) -> list[MemoryCandidate]:
    """
    Extract candidate memories from a user message.
    Uses LLM with fixed key vocabulary to produce structured candidates.
    Includes JSON-repair fallback (section 50).
    """
    # Build context of existing memories
    existing_context = ""
    if existing_memories:
        lines = [f"- [{m.type.value}] {m.key} = {m.value}" for m in existing_memories]
        existing_context = "\nExisting user memories:\n" + "\n".join(lines)

    user_prompt = f"""{existing_context}

User message: "{user_message}"

Extract candidate memories as JSON:"""

    try:
        raw_response = invoke_llama(
            EXTRACTION_SYSTEM_PROMPT,
            user_prompt,
            max_gen_len=512,
            temperature=0.1,
        )
        candidates = _parse_extraction_response(raw_response)
        logger.info(f"Extracted {len(candidates)} candidate memories")
        return candidates

    except Exception as e:
        logger.error(f"Memory extraction failed: {e}")
        return []


def _parse_extraction_response(raw: str) -> list[MemoryCandidate]:
    """
    Parse the LLM response into MemoryCandidate objects.
    Includes JSON-repair fallback (strip markdown fences, fix common issues).
    """
    cleaned = raw.strip()

    # Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    # Try to find JSON object in the response
    json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt repairs
        try:
            # Fix trailing commas
            fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
            data = json.loads(fixed)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse extraction response: {cleaned[:200]}")
            return []

    candidates_raw = data.get("candidates", [])
    if not isinstance(candidates_raw, list):
        return []

    candidates = []
    for c in candidates_raw:
        try:
            mem_type = c.get("type", "FACT").upper()
            if mem_type not in [t.value for t in MemoryType]:
                mem_type = "FACT"

            key = normalize_key(mem_type, c.get("key", "other"))
            confidence = float(c.get("confidence", 0.5))
            confidence = max(0.0, min(1.0, confidence))

            candidate = MemoryCandidate(
                type=MemoryType(mem_type),
                key=key,
                value=str(c.get("value", "")),
                confidence=confidence,
            )
            candidates.append(candidate)
        except Exception as e:
            logger.warning(f"Skipping malformed candidate: {c} — {e}")
            continue

    return candidates
