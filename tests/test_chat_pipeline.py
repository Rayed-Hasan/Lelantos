"""
Phase 3: Chat Pipeline Local Verification
Verifies the complete 13-step Lelantos chat pipeline end-to-end locally.
"""

import pytest
import json
from unittest.mock import patch
from backend.services.memory_engine import get_active_memories
from backend.services.conversation_manager import get_messages, get_conversation


def test_complete_chat_pipeline_new_conversation(client, mock_bedrock):
    """
    Step 1-13 verification:
    - User sends first message declaring backend = FastAPI
    - New conversation created & titled
    - User message & Assistant message saved in history
    - Memory extracted, validated, normalized, and saved to active memories
    - Worker response generated
    """
    message = "I decided that our backend must use FastAPI."
    response = client.post("/chat", json={"message": message})
    assert response.status_code == 200
    data = response.json()

    # Step 13: Response schema
    assert "response" in data
    assert "conversation_id" in data
    assert "message_id" in data
    assert "memories_used" in data
    assert "memories_extracted" in data
    assert "conflicts_detected" in data

    conv_id = data["conversation_id"]

    # Step 2 & 12: Verify conversation and messages stored in DynamoDB
    conv = get_conversation("user_lelantos_dev", conv_id)
    assert conv is not None

    messages = get_messages(conv_id)
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == message
    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == data["response"]

    # Step 8, 9, 10, 11: Memory extraction and persistence
    active_memories = get_active_memories("user_lelantos_dev")
    backend_mems = [m for m in active_memories if m.key == "backend"]
    assert len(backend_mems) == 1
    assert backend_mems[0].value == "FastAPI"
    assert backend_mems[0].type.value == "DECISION"
    assert backend_mems[0].version == 1
    assert backend_mems[0].status.value == "ACTIVE"


def test_chat_pipeline_resume_conversation_and_context_injection(client, mock_bedrock):
    """
    Verifies resuming conversation and context injection into worker:
    1. First turn seeds FastAPI memory
    2. Second turn asks 'What backend am I using?' in same conversation
    3. Worker branch retrieves relevant memory and uses it in prompt
    """
    # Turn 1
    res1 = client.post("/chat", json={"message": "I chose FastAPI for my backend."})
    assert res1.status_code == 200
    conv_id = res1.json()["conversation_id"]

    # Turn 2 in same conversation
    res2 = client.post("/chat", json={
        "message": "What backend did I select?",
        "conversation_id": conv_id,
    })
    assert res2.status_code == 200
    data2 = res2.json()

    assert data2["conversation_id"] == conv_id

    # Verify memories_used contains the DECISION / backend memory
    assert len(data2["memories_used"]) >= 1
    used_keys = [m["key"] for m in data2["memories_used"]]
    assert "backend" in used_keys

    # Verify conversation message history contains 4 messages now
    msgs = get_messages(conv_id)
    assert len(msgs) == 4
    assert msgs[2]["content"] == "What backend did I select?"
