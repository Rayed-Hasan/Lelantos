"""
Phase 4: Memory Lifecycle Testing
Tests Create, Retrieve, Conflict/Update, Duplicate, Delete, and Delete All.
"""

import pytest
from backend.models.memory import (
    MemoryObject, MemoryCandidate, MemoryType, MemoryStatus, MemorySource,
    FIXED_KEY_VOCABULARY, normalize_key,
)
from backend.services.memory_engine import (
    create_memory, get_memory, list_memories, get_active_memories,
    delete_memory, delete_all_memories, get_memory_history, get_timeline,
)
from backend.services.conflict_detector import detect_and_resolve_conflicts
from backend.services.context_retriever import retrieve_relevant_memories


def test_memory_create_allowed_types_and_keys(mock_dynamodb):
    user_id = "user_test_lifecycle"

    # Test all 9 memory types with fixed vocabulary
    for mtype in MemoryType:
        allowed_keys = FIXED_KEY_VOCABULARY.get(mtype.value, ["other"])
        key = allowed_keys[0]

        mem = MemoryObject(
            user_id=user_id,
            type=mtype,
            key=key,
            value=f"Test value for {mtype.value}",
            confidence=0.85,
            source=MemorySource(text="Explicit user statement"),
        )
        created = create_memory(mem)

        assert created.status == MemoryStatus.ACTIVE
        assert created.version == 1
        assert created.confidence == 0.85
        assert created.created_at is not None
        assert created.user_id == user_id
        assert created.key == key

    active = get_active_memories(user_id)
    assert len(active) == len(MemoryType)


def test_memory_key_normalization(mock_dynamodb):
    # If candidate proposes key not strictly in vocabulary, normalize_key maps it
    assert normalize_key("DECISION", "backend_framework") == "backend"
    assert normalize_key("DECISION", "completely_unrelated_custom_key") == "other"
    assert normalize_key("PREFERENCE", "Coding Language") == "language"


def test_memory_retrieval_relevance_and_limits(mock_dynamodb):
    user_id = "user_test_retrieval"

    # Empty memory state
    empty_res = retrieve_relevant_memories(user_id, "What is my backend?")
    assert empty_res == []

    # Populate 12 memories
    memories = [
        MemoryObject(user_id=user_id, type=MemoryType.DECISION, key="backend", value="FastAPI", confidence=0.95),
        MemoryObject(user_id=user_id, type=MemoryType.DECISION, key="frontend", value="React", confidence=0.92),
        MemoryObject(user_id=user_id, type=MemoryType.DECISION, key="database", value="DynamoDB", confidence=0.91),
        MemoryObject(user_id=user_id, type=MemoryType.CONSTRAINT, key="budget", value="0 rupees", confidence=0.95),
        MemoryObject(user_id=user_id, type=MemoryType.PROJECT, key="project_name", value="Lelantos", confidence=0.98),
        MemoryObject(user_id=user_id, type=MemoryType.IDENTITY, key="user_name", value="Rayed", confidence=0.99),
        MemoryObject(user_id=user_id, type=MemoryType.PREFERENCE, key="language", value="Python", confidence=0.88),
        MemoryObject(user_id=user_id, type=MemoryType.PREFERENCE, key="style", value="Dark mode", confidence=0.7),
        MemoryObject(user_id=user_id, type=MemoryType.GOAL, key="primary_goal", value="Win hackathon", confidence=0.85),
        MemoryObject(user_id=user_id, type=MemoryType.CONSTRAINT, key="timeline", value="2 days", confidence=0.9),
        MemoryObject(user_id=user_id, type=MemoryType.FACT, key="other", value="Favorite color is black", confidence=0.6),
        MemoryObject(user_id=user_id, type=MemoryType.TEMPORARY, key="other", value="Testing locally", confidence=0.5),
    ]
    for m in memories:
        create_memory(m)

    # Directly relevant query: backend
    res_backend = retrieve_relevant_memories(user_id, "Which backend and server framework should we use?", limit=5)
    assert len(res_backend) <= 5
    assert any(m.key == "backend" and m.value == "FastAPI" for m in res_backend)

    # Retrieval limit test: limit to 3
    res_limit = retrieve_relevant_memories(user_id, "Tell me about my project, budget, and backend", limit=3)
    assert len(res_limit) <= 3


def test_memory_update_and_conflict_resolution(mock_dynamodb):
    """
    Initial: 'I use FastAPI for my backend.'
    Then: 'I switched my backend to Django.'
    Verify:
    - Old memory becomes REPLACED
    - New memory becomes ACTIVE
    - Version increments to 2
    - Timeline event memory_conflict created
    - Retrieval returns Django, not FastAPI
    """
    user_id = "user_conflict_test"

    # Step 1: Initial FastAPI
    cand1 = [MemoryCandidate(type=MemoryType.DECISION, key="backend", value="FastAPI", confidence=0.95)]
    res1 = detect_and_resolve_conflicts(user_id, cand1, source=MemorySource(text="I use FastAPI for my backend."))
    assert len(res1) == 1
    assert not res1[0].has_conflict
    fastapi_mem = res1[0].resolved_memory
    assert fastapi_mem.status == MemoryStatus.ACTIVE
    assert fastapi_mem.version == 1

    # Step 2: Switch to Django
    cand2 = [MemoryCandidate(type=MemoryType.DECISION, key="backend", value="Django", confidence=0.98)]
    res2 = detect_and_resolve_conflicts(user_id, cand2, source=MemorySource(text="I switched my backend to Django."))
    assert len(res2) == 1
    assert res2[0].has_conflict
    django_mem = res2[0].resolved_memory

    # Verify statuses
    old_fastapi_reloaded = get_memory(user_id, fastapi_mem.memory_id)
    assert old_fastapi_reloaded.status == MemoryStatus.REPLACED

    assert django_mem.status == MemoryStatus.ACTIVE
    assert django_mem.version == 2
    assert django_mem.value == "Django"

    # Verify history
    history = get_memory_history(user_id, "backend", "DECISION")
    assert len(history) == 2
    assert history[0].value == "FastAPI" and history[0].status == MemoryStatus.REPLACED
    assert history[1].value == "Django" and history[1].status == MemoryStatus.ACTIVE

    # Verify timeline event created
    timeline = get_timeline(user_id)
    conflict_events = [e for e in timeline if e.get("event_type") == "memory_conflict"]
    assert len(conflict_events) >= 1
    assert "FastAPI" in conflict_events[0]["description"]
    assert "Django" in conflict_events[0]["description"]

    # Verify retrieval returns only active Django memory
    active_mems = get_active_memories(user_id)
    backend_active = [m for m in active_mems if m.key == "backend"]
    assert len(backend_active) == 1
    assert backend_active[0].value == "Django"


def test_memory_duplicate_prevention(mock_dynamodb):
    """
    Repeating the exact same fact should NOT create multiple active memories.
    """
    user_id = "user_duplicate_test"

    cand = [MemoryCandidate(type=MemoryType.DECISION, key="backend", value="FastAPI", confidence=0.95)]
    # First time
    res1 = detect_and_resolve_conflicts(user_id, cand)
    assert len(res1) == 1

    # Repeat exact same fact
    res2 = detect_and_resolve_conflicts(user_id, cand)
    assert len(res2) == 1
    assert not res2[0].has_conflict

    # Should only be 1 active memory in the database
    active = get_active_memories(user_id)
    assert len(active) == 1
    assert active[0].value == "FastAPI"


def test_memory_delete_and_delete_all(mock_dynamodb):
    user_id_a = "user_del_a"
    user_id_b = "user_del_b"

    # Seed User A
    mem_a1 = create_memory(MemoryObject(user_id=user_id_a, type=MemoryType.PREFERENCE, key="language", value="Python"))
    mem_a2 = create_memory(MemoryObject(user_id=user_id_a, type=MemoryType.DECISION, key="backend", value="FastAPI"))

    # Seed User B
    mem_b1 = create_memory(MemoryObject(user_id=user_id_b, type=MemoryType.PREFERENCE, key="language", value="Go"))

    # Soft delete single memory for User A
    deleted = delete_memory(user_id_a, mem_a1.memory_id)
    assert deleted is True

    # User A active memories should now be 1
    assert len(get_active_memories(user_id_a)) == 1

    # Delete all for User A
    del_count = delete_all_memories(user_id_a)
    assert del_count == 1
    assert len(get_active_memories(user_id_a)) == 0

    # User B must be completely untouched!
    user_b_active = get_active_memories(user_id_b)
    assert len(user_b_active) == 1
    assert user_b_active[0].value == "Go"
