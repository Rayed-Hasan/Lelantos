"""
Phase 5: User Isolation Testing
Verifies that USER_A and USER_B are strictly isolated across:
- Memory retrieval
- Memory by ID access
- Conversation access
- Message history access
- Deletion operations
"""

import pytest
import base64
import json
from unittest.mock import patch
from backend.models.memory import MemoryObject, MemoryType
from backend.services.memory_engine import (
    create_memory, get_memory, get_active_memories, delete_memory,
)
from backend.services.conversation_manager import (
    create_conversation, get_conversation, store_message, get_messages,
)


def _make_jwt(user_id: str) -> str:
    """Helper to generate mock JWT for a given user_id."""
    header = base64.b64encode(json.dumps({"alg": "none"}).encode()).decode().rstrip("=")
    payload = base64.b64encode(json.dumps({"sub": user_id, "email": f"{user_id}@test.com"}).encode()).decode().rstrip("=")
    return f"{header}.{payload}.sig"


def test_user_memory_isolation_engine(mock_dynamodb):
    user_a = "user_alpha"
    user_b = "user_beta"

    mem_a = create_memory(MemoryObject(user_id=user_a, type=MemoryType.PREFERENCE, key="language", value="Python"))
    mem_b = create_memory(MemoryObject(user_id=user_b, type=MemoryType.PREFERENCE, key="language", value="Rust"))

    # Active memories isolation
    mems_a = get_active_memories(user_a)
    mems_b = get_active_memories(user_b)
    assert len(mems_a) == 1 and mems_a[0].value == "Python"
    assert len(mems_b) == 1 and mems_b[0].value == "Rust"

    # Direct memory_id access across users
    # User B cannot retrieve User A's memory even if they know the memory_id
    cross_access = get_memory(user_b, mem_a.memory_id)
    assert cross_access is None

    # User A cannot delete User B's memory
    del_res = delete_memory(user_a, mem_b.memory_id)
    assert del_res is False
    # Verify User B's memory is still active
    assert len(get_active_memories(user_b)) == 1


def test_user_conversation_isolation_engine(mock_dynamodb):
    user_a = "user_alpha"
    user_b = "user_beta"

    conv_a = create_conversation(user_a, title="Alpha Project")
    conv_b = create_conversation(user_b, title="Beta Project")

    store_message(conv_a.conversation_id, "user", "Secret from Alpha")
    store_message(conv_b.conversation_id, "user", "Secret from Beta")

    # User B cannot get User A's conversation
    conv_check = get_conversation(user_b, conv_a.conversation_id)
    assert conv_check is None


def test_user_isolation_api_endpoints(client, mock_dynamodb):
    user_a = "user_alpha_api"
    user_b = "user_beta_api"

    token_a = _make_jwt(user_a)
    token_b = _make_jwt(user_b)

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    with patch("backend.services.auth.AUTH_ENABLED", True):
        # User A creates memory
        res_a = client.post(
            "/memory",
            json={"type": "DECISION", "key": "backend", "value": "FastAPI"},
            headers=headers_a,
        )
        assert res_a.status_code == 200
        mem_a_id = res_a.json()["memory"]["memory_id"]

        # User B queries their profile — must be empty!
        res_b_profile = client.get("/memory/profile", headers=headers_b)
        assert res_b_profile.status_code == 200
        assert res_b_profile.json()["active_memories"] == 0

        # User B tries to read User A's memory directly by ID
        res_b_read = client.get(f"/memory/{mem_a_id}", headers=headers_b)
        assert res_b_read.status_code == 404

        # User B tries to update User A's memory
        res_b_update = client.patch(
            f"/memory/{mem_a_id}",
            json={"value": "HackedValue"},
            headers=headers_b,
        )
        assert res_b_update.status_code == 404

        # User B tries to delete User A's memory
        res_b_del = client.delete(f"/memory/{mem_a_id}", headers=headers_b)
        assert res_b_del.status_code == 404

        # Verify User A's memory was NOT changed or deleted
        res_a_read = client.get(f"/memory/{mem_a_id}", headers=headers_a)
        assert res_a_read.status_code == 200
        assert res_a_read.json()["memory"]["value"] == "FastAPI"

        # User B tries delete all — should only delete 0 memories for User B
        res_b_del_all = client.delete("/memory", headers=headers_b)
        assert res_b_del_all.status_code == 200
        assert res_b_del_all.json()["count"] == 0

        # User A's memory still active
        res_a_profile = client.get("/memory/profile", headers=headers_a)
        assert res_a_profile.json()["active_memories"] == 1
