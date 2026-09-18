"""
Phase 8: Frontend-Backend Contract Verification
Verifies that all API responses match the TypeScript interfaces defined in frontend/src/lib/types.ts.
"""

import pytest


def test_chat_response_contract(client, mock_bedrock):
    res = client.post("/chat", json={"message": "I prefer using Python and React."})
    assert res.status_code == 200
    data = res.json()

    # Matches ChatResponse interface
    assert isinstance(data["response"], str)
    assert isinstance(data["conversation_id"], str)
    assert isinstance(data["message_id"], str)
    assert isinstance(data["memories_used"], list)
    assert isinstance(data["memories_extracted"], list)
    assert isinstance(data["conflicts_detected"], list)

    for m in data["memories_used"]:
        assert "type" in m and "key" in m and "value" in m

    for m in data["memories_extracted"]:
        assert "type" in m and "key" in m and "value" in m and "confidence" in m


def test_memory_profile_contract(client, mock_dynamodb):
    client.post("/memory", json={"type": "PREFERENCE", "key": "language", "value": "Python"})
    res = client.get("/memory/profile")
    assert res.status_code == 200
    data = res.json()

    # Matches MemoryProfile interface
    assert isinstance(data["user_id"], str)
    assert isinstance(data["total_memories"], int)
    assert isinstance(data["active_memories"], int)
    assert isinstance(data["type_counts"], dict)
    assert isinstance(data["context_summary"], list)
    assert isinstance(data["recent_memories"], list)

    for item in data["context_summary"]:
        assert "type" in item and "key" in item and "value" in item and "confidence" in item

    for mem in data["recent_memories"]:
        assert "memory_id" in mem and "status" in mem and "version" in mem


def test_memory_detail_response_contract(client, mock_dynamodb):
    res_create = client.post("/memory", json={"type": "DECISION", "key": "backend", "value": "FastAPI"})
    mem_id = res_create.json()["memory"]["memory_id"]

    res_detail = client.get(f"/memory/{mem_id}")
    assert res_detail.status_code == 200
    data = res_detail.json()

    # Matches MemoryDetailResponse interface
    assert "memory" in data
    assert "history" in data
    assert isinstance(data["history"], list)
    assert data["memory"]["memory_id"] == mem_id


def test_conversations_contract(client, mock_bedrock):
    chat_res = client.post("/chat", json={"message": "Contract test conversation."})
    conv_id = chat_res.json()["conversation_id"]

    # List
    list_res = client.get("/conversations")
    assert list_res.status_code == 200
    convs = list_res.json()["conversations"]
    assert isinstance(convs, list)
    c = next(c for c in convs if c["conversation_id"] == conv_id)
    assert "conversation_id" in c and "title" in c and "model" in c

    # Detail
    detail_res = client.get(f"/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "conversation" in detail
    assert "messages" in detail
    assert isinstance(detail["messages"], list)
    for msg in detail["messages"]:
        assert "message_id" in msg and "role" in msg and "content" in msg and "timestamp" in msg
