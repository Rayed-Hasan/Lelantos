"""
Phase 6: Edge Cases & Resilient Failure Handling
Verifies safe failure, input validation, and boundary conditions.
"""

import pytest
import json
from unittest.mock import patch
from backend.models.memory import MemoryObject, MemoryType, MemoryStatus
from backend.services.memory_extractor import _parse_extraction_response, extract_memories
from backend.services.memory_engine import get_active_memories, create_memory, delete_memory


def test_empty_and_whitespace_chat_messages(client):
    # Empty string
    res1 = client.post("/chat", json={"message": ""})
    assert res1.status_code == 400
    assert "cannot be empty" in res1.json()["detail"].lower()

    # Whitespace only
    res2 = client.post("/chat", json={"message": "   \n\t  "})
    assert res2.status_code == 400
    assert "cannot be empty" in res2.json()["detail"].lower()


def test_extremely_long_message(client, mock_bedrock):
    long_msg = "My project is called Lelantos. " * 500  # ~15,000 characters
    res = client.post("/chat", json={"message": long_msg})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "conversation_id" in data


def test_malformed_json_payloads(client):
    # Send non-JSON text to an endpoint expecting JSON
    res = client.post(
        "/chat",
        content="this is not json { [",
        headers={"Content-Type": "application/json"},
    )
    # FastAPI returns 422 or 400
    assert res.status_code in [400, 422]


def test_delete_already_deleted_memory(client, mock_dynamodb):
    res_create = client.post("/memory", json={"type": "FACT", "key": "other", "value": "Once only"})
    mem_id = res_create.json()["memory"]["memory_id"]

    # First delete -> 200
    del1 = client.delete(f"/memory/{mem_id}")
    assert del1.status_code == 200

    # Second delete of already deleted memory
    # update_memory will succeed in updating it or the endpoint marks it;
    # Let's verify behavior:
    del2 = client.delete(f"/memory/{mem_id}")
    # Either 200 (idempotent soft delete) or 404
    assert del2.status_code in [200, 404]


def test_extraction_parsing_malformed_json():
    # 1. Plain text with no JSON at all
    res1 = _parse_extraction_response("I could not find any facts to extract.")
    assert res1 == []

    # 2. Markdown fenced JSON with trailing commas
    raw_markdown = """```json
    {
      "candidates": [
        {"type": "DECISION", "key": "backend", "value": "FastAPI", "confidence": 0.95,}
      ]
    }
    ```"""
    res2 = _parse_extraction_response(raw_markdown)
    assert len(res2) == 1
    assert res2[0].key == "backend"
    assert res2[0].value == "FastAPI"

    # 3. JSON with invalid/unsupported memory type -> falls back to FACT
    raw_bad_type = json.dumps({
        "candidates": [
            {"type": "SUPER_CUSTOM_TYPE", "key": "custom_key", "value": "test", "confidence": 0.5}
        ]
    })
    res3 = _parse_extraction_response(raw_bad_type)
    assert len(res3) == 1
    assert res3[0].type == MemoryType.FACT

    # 4. JSON with unsupported key -> maps to 'other' or normalized
    raw_bad_key = json.dumps({
        "candidates": [
            {"type": "DECISION", "key": "completely_unsupported_key", "value": "test", "confidence": 0.5}
        ]
    })
    res4 = _parse_extraction_response(raw_bad_key)
    assert len(res4) == 1
    assert res4[0].key == "other"

    # 5. Missing fields (no value, confidence out of bounds)
    raw_missing = json.dumps({
        "candidates": [
            {"type": "PREFERENCE", "key": "language", "confidence": 99.0}  # missing value, confidence > 1
        ]
    })
    res5 = _parse_extraction_response(raw_missing)
    assert len(res5) == 1
    assert res5[0].confidence == 1.0  # clamped to 1.0
    assert res5[0].value == ""


def test_bedrock_failure_in_worker_fails_safely_no_fabricated_memories(client, mock_dynamodb):
    """
    If Bedrock worker invocation fails/times out:
    - Worker fails safely with 503
    - No fabricated or corrupted memories are stored
    """
    with patch("backend.routes.chat.invoke_llama", side_effect=Exception("Bedrock timeout")):
        with patch("backend.services.memory_extractor.invoke_llama", side_effect=Exception("Bedrock timeout")):
            res = client.post("/chat", json={"message": "My database is PostgreSQL."})
            assert res.status_code == 503
            assert "temporarily unavailable" in res.json()["detail"].lower()

            # Verify no memories were created
            active = get_active_memories("user_lelantos_dev")
            assert len(active) == 0


def test_bedrock_failure_in_extractor_fails_silently(client, mock_dynamodb):
    """
    If Bedrock extractor fails, the chat response should STILL succeed,
    and no corrupt memories should be saved.
    """
    def mock_worker_ok_extractor_fail(system_prompt, user_prompt, **kwargs):
        if "Memory Extraction Agent" in system_prompt:
            raise Exception("Extractor rate limit exceeded")
        return "I received your message successfully."

    with patch("backend.routes.chat.invoke_llama", side_effect=mock_worker_ok_extractor_fail):
        with patch("backend.services.memory_extractor.invoke_llama", side_effect=mock_worker_ok_extractor_fail):
            res = client.post("/chat", json={"message": "I love using Python."})
            assert res.status_code == 200
            data = res.json()
            assert data["response"] == "I received your message successfully."
            assert data["memories_extracted"] == []

            # Verify no corrupt memories exist
            active = get_active_memories("user_lelantos_dev")
            assert len(active) == 0


def test_dynamodb_failure_handling(client):
    """
    If DynamoDB raises an exception during memory creation, it raises an error safely.
    """
    with patch("backend.services.memory_engine._get_table", side_effect=Exception("DynamoDB connection refused")):
        res = client.post("/memory", json={"type": "FACT", "key": "other", "value": "test"})
        assert res.status_code == 500
        assert "dynamodb connection refused" in res.json()["detail"].lower()


def test_multiple_conflicting_updates(mock_dynamodb):
    """
    Test rapid sequence of conflicting updates for same key:
    FastAPI -> Django -> Flask -> FastAPI
    Verify versions increment properly and only the latest is ACTIVE.
    """
    from backend.models.memory import MemoryCandidate
    from backend.services.conflict_detector import detect_and_resolve_conflicts

    user_id = "user_multi_conflict"
    backends = ["FastAPI", "Django", "Flask", "FastAPI"]

    for i, b in enumerate(backends):
        cand = [MemoryCandidate(type=MemoryType.DECISION, key="backend", value=b, confidence=0.9)]
        res = detect_and_resolve_conflicts(user_id, cand)
        assert len(res) == 1

    # Active memory should be FastAPI version 4
    active = get_active_memories(user_id)
    assert len(active) == 1
    assert active[0].value == "FastAPI"
    assert active[0].version == 4
    assert active[0].status == MemoryStatus.ACTIVE
