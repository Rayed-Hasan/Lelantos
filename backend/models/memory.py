"""
Lelantos Memory Models — Structured memory objects, enums, and fixed key vocabulary.
Sections 7, 8, 12, 14 of the Master Plan.
"""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime
import uuid


# ─── Section 8: Memory Types ───────────────────────────────────────────────────

class MemoryType(str, Enum):
    IDENTITY = "IDENTITY"
    PREFERENCE = "PREFERENCE"
    CONSTRAINT = "CONSTRAINT"
    PROJECT = "PROJECT"
    GOAL = "GOAL"
    DECISION = "DECISION"
    FACT = "FACT"
    RELATIONSHIP = "RELATIONSHIP"
    TEMPORARY = "TEMPORARY"


# ─── Section 14: Memory Status ─────────────────────────────────────────────────

class MemoryStatus(str, Enum):
    ACTIVE = "ACTIVE"
    REPLACED = "REPLACED"
    EXPIRED = "EXPIRED"
    DELETED = "DELETED"
    PENDING = "PENDING"


# ─── Section 12: Fixed Key Vocabulary ──────────────────────────────────────────
# Prevents key drift in extraction. Only these keys are allowed per type.

FIXED_KEY_VOCABULARY: dict[str, list[str]] = {
    "CONSTRAINT": ["budget", "timeline", "tech_constraint", "team_size", "other"],
    "DECISION": ["backend", "frontend", "database", "hosting", "auth_provider", "other"],
    "PREFERENCE": ["language", "framework", "style", "communication_style", "other"],
    "PROJECT": ["project_name", "project_type", "deadline", "other"],
    "GOAL": ["primary_goal", "other"],
    "IDENTITY": ["user_name", "role", "other"],
    "FACT": ["other"],
    "RELATIONSHIP": ["other"],
    "TEMPORARY": ["other"],
}


def get_allowed_keys(memory_type: str) -> list[str]:
    """Return the allowed keys for a given memory type."""
    return FIXED_KEY_VOCABULARY.get(memory_type, ["other"])


def normalize_key(memory_type: str, proposed_key: str) -> str:
    """Map a proposed key to the closest allowed key, or 'other' if no match."""
    allowed = get_allowed_keys(memory_type)
    proposed_lower = proposed_key.lower().strip().replace(" ", "_")
    # Direct match
    if proposed_lower in allowed:
        return proposed_lower
    # Fuzzy match: check if any allowed key is a substring or vice versa
    for key in allowed:
        if key in proposed_lower or proposed_lower in key:
            return key
    return "other"


# ─── Section 11: Provenance / Source ────────────────────────────────────────────

class MemorySource(BaseModel):
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    text: Optional[str] = None
    extractor: str = "llama3.1-70b"
    created_at: Optional[str] = None


# ─── Section 7: Memory Object ──────────────────────────────────────────────────

class MemoryObject(BaseModel):
    memory_id: str = Field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: MemoryType
    key: str
    value: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    status: MemoryStatus = MemoryStatus.ACTIVE
    source: Optional[MemorySource] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    expires_at: Optional[str] = None
    version: int = 1


# ─── Section 9: Memory Candidate (from extractor) ──────────────────────────────

class MemoryCandidate(BaseModel):
    type: MemoryType
    key: str
    value: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


# ─── Section 21: Conversation & Message ─────────────────────────────────────────

class ConversationRecord(BaseModel):
    conversation_id: str = Field(default_factory=lambda: f"conv_{uuid.uuid4().hex[:12]}")
    user_id: str
    model: str = "llama3.1-70b"
    title: str = "New Conversation"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class MessageRecord(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    conversation_id: str
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


# ─── Timeline Event ────────────────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    user_id: str
    event_type: str  # "memory_created", "memory_updated", "memory_conflict", "memory_deleted"
    memory_id: Optional[str] = None
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


# ─── API Request/Response Models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None  # Will be overridden by auth


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    message_id: str
    memories_used: list[dict] = []
    memories_extracted: list[dict] = []
    conflicts_detected: list[dict] = []


class MemoryQueryRequest(BaseModel):
    query: str
    types: Optional[list[str]] = None
    limit: int = 10


class MemoryCreateRequest(BaseModel):
    type: MemoryType
    key: str
    value: str
    confidence: float = 0.9


class MemoryUpdateRequest(BaseModel):
    value: Optional[str] = None
    status: Optional[MemoryStatus] = None
    confidence: Optional[float] = None
