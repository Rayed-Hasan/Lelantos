"""
Phase 2: FastAPI Route Testing
Verifies every important route, status codes, schemas, and error handling.
"""

import pytest
import json
import base64
from unittest.mock import patch


# ─── Health Endpoint ──────────────────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "lelantos-api"
    assert data["version"] == "2.0.0"
    assert "model_id" in data
    assert "demo_mode" in data


# ─── Memory Endpoints ─────────────────────────────────────────────────────────

def test_create_memory_valid(client):
    payload = {
        "type": "DECISION",
        "key": "backend",
        "value": "FastAPI",
        "confidence": 0.95,
    }
    response = client.post("/memory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "created"
    assert data["memory"]["type"] == "DECISION"
    assert data["memory"]["key"] == "backend"
    assert data["memory"]["value"] == "FastAPI"
    assert data["memory"]["confidence"] == 0.95
    assert data["memory"]["status"] == "ACTIVE"
    assert data["memory"]["memory_id"].startswith("mem_")


def test_get_memory_profile(client):
    # Create a memory first
    client.post("/memory", json={"type": "PREFERENCE", "key": "language", "value": "Python"})

    response = client.get("/memory/profile")
    assert response.status_code == 200
    data = response.json()
    assert "total_memories" in data
    assert "active_memories" in data
    assert data["active_memories"] >= 1
    assert "type_counts" in data
    assert data["type_counts"].get("PREFERENCE") == 1
    assert "context_summary" in data


def test_get_memory_timeline(client):
    # Creating a memory generates a timeline event if created via conflict detector or delete
    client.post("/memory", json={"type": "CONSTRAINT", "key": "budget", "value": "5000"})
    response = client.get("/memory/timeline")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert isinstance(data["events"], list)


def test_query_memories_valid(client):
    client.post("/memory", json={"type": "DECISION", "key": "backend", "value": "FastAPI"})
    response = client.post("/memory/query", json={"query": "What backend am I using?"})
    assert response.status_code == 200
    data = response.json()
    assert "context" in data
    assert len(data["context"]) > 0
    assert any(m["value"] == "FastAPI" for m in data["context"])


def test_query_memories_empty(client):
    response = client.post("/memory/query", json={"query": ""})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"].lower()


def test_extract_memories_valid(client, mock_bedrock):
    response = client.post("/memory/extract", json={"text": "I decided to use FastAPI for the backend."})
    assert response.status_code == 200
    data = response.json()
    assert "extracted" in data
    assert len(data["extracted"]) >= 1
    assert data["extracted"][0]["key"] == "backend"


def test_extract_memories_empty(client):
    response = client.post("/memory/extract", json={"text": ""})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"].lower()


def test_get_single_memory_and_404(client):
    create_res = client.post("/memory", json={"type": "GOAL", "key": "primary_goal", "value": "Launch MVP"})
    mem_id = create_res.json()["memory"]["memory_id"]

    # Valid get
    get_res = client.get(f"/memory/{mem_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["memory"]["memory_id"] == mem_id
    assert "history" in data

    # Nonexistent get
    nf_res = client.get("/memory/mem_nonexistent999")
    assert nf_res.status_code == 404
    assert "not found" in nf_res.json()["detail"].lower()


def test_update_memory_patch(client):
    create_res = client.post("/memory", json={"type": "PREFERENCE", "key": "framework", "value": "Vue"})
    mem_id = create_res.json()["memory"]["memory_id"]

    # Patch value
    patch_res = client.patch(f"/memory/{mem_id}", json={"value": "React", "confidence": 0.8})
    assert patch_res.status_code == 200
    assert patch_res.json()["memory"]["value"] == "React"
    assert patch_res.json()["memory"]["confidence"] == 0.8

    # Patch nonexistent
    nf_res = client.patch("/memory/mem_unknown123", json={"value": "Something"})
    assert nf_res.status_code == 404


def test_delete_memory_soft_delete(client):
    create_res = client.post("/memory", json={"type": "FACT", "key": "other", "value": "Temporary note"})
    mem_id = create_res.json()["memory"]["memory_id"]

    # Delete
    del_res = client.delete(f"/memory/{mem_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Verify not returned in active profile
    prof_res = client.get("/memory/profile")
    active_mems = [m for m in prof_res.json()["context_summary"] if m["value"] == "Temporary note"]
    assert len(active_mems) == 0

    # Delete nonexistent returns 404
    del_nf = client.delete("/memory/mem_nonexistent_id")
    assert del_nf.status_code == 404


def test_delete_all_memories(client):
    client.post("/memory", json={"type": "FACT", "key": "other", "value": "Fact 1"})
    client.post("/memory", json={"type": "FACT", "key": "other", "value": "Fact 2"})

    del_res = client.delete("/memory")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"
    assert del_res.json()["count"] >= 2

    # Check active is 0
    prof = client.get("/memory/profile").json()
    assert prof["active_memories"] == 0


# ─── Conversation Endpoints ───────────────────────────────────────────────────

def test_conversations_list_and_detail(client, mock_bedrock):
    # Trigger a chat to create a conversation
    chat_res = client.post("/chat", json={"message": "Hello there!"})
    assert chat_res.status_code == 200
    conv_id = chat_res.json()["conversation_id"]

    # List conversations
    list_res = client.get("/conversations")
    assert list_res.status_code == 200
    convs = list_res.json()["conversations"]
    assert len(convs) >= 1
    assert any(c["conversation_id"] == conv_id for c in convs)

    # Get conversation detail
    detail_res = client.get(f"/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["conversation"]["conversation_id"] == conv_id
    assert len(detail["messages"]) >= 2  # user + assistant

    # Nonexistent conversation 404
    nf_res = client.get("/conversations/conv_unknown999")
    assert nf_res.status_code == 404


# ─── Auth Dependent Endpoints ──────────────────────────────────────────────────

def test_auth_disabled_returns_default_user(client):
    with patch("backend.services.auth.AUTH_ENABLED", False):
        res = client.get("/memory/profile")
        assert res.status_code == 200
        assert res.json()["user_id"] == "user_lelantos_dev"


def test_auth_enabled_missing_and_invalid_token(client):
    with patch("backend.services.auth.AUTH_ENABLED", True):
        # Missing auth header
        res1 = client.get("/memory/profile")
        assert res1.status_code == 401

        # Invalid header prefix
        res2 = client.get("/memory/profile", headers={"Authorization": "Basic 12345"})
        assert res2.status_code == 401

        # Malformed JWT
        res3 = client.get("/memory/profile", headers={"Authorization": "Bearer not-a-jwt"})
        assert res3.status_code == 401

        # Valid mock JWT
        header = base64.b64encode(json.dumps({"alg": "none"}).encode()).decode().rstrip("=")
        payload = base64.b64encode(json.dumps({"sub": "custom_user_123", "email": "test@user.com"}).encode()).decode().rstrip("=")
        token = f"{header}.{payload}.signature"
        res4 = client.get("/memory/profile", headers={"Authorization": f"Bearer {token}"})
        assert res4.status_code == 200
        assert res4.json()["user_id"] == "custom_user_123"
