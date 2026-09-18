"""
Pytest configuration and global fixtures for Lelantos local verification.
"""

import sys
import os
import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from tests.mock_dynamodb import MockDynamoDBTable
import backend.services.memory_engine as memory_engine
import backend.services.conversation_manager as conversation_manager
import backend.services.bedrock as bedrock
from backend.main import app


@pytest.fixture
def mock_dynamodb():
    """Global in-memory DynamoDB table fixture."""
    table = MockDynamoDBTable()
    # Patch the table in both services
    orig_me_table = memory_engine._table
    orig_cm_table = conversation_manager._table

    memory_engine._table = table
    conversation_manager._table = table

    yield table

    table.clear()
    memory_engine._table = orig_me_table
    conversation_manager._table = orig_cm_table


@pytest.fixture
def client(mock_dynamodb):
    """FastAPI TestClient using the in-memory DynamoDB."""
    with TestClient(app) as test_client:
        yield test_client


def default_bedrock_mock(system_prompt: str, user_prompt: str, max_gen_len: int = 512, temperature: float = 0.3):
    """
    Deterministic mock for Bedrock Llama 3.1 70B invocation.
    Distinguishes memory extraction vs general chat responses.
    """
    prompt_lower = (system_prompt + " " + user_prompt).lower()

    # If it's a memory extraction call:
    if "memory extraction" in prompt_lower or "extract candidate memories" in prompt_lower:
        candidates = []
        if "fastapi" in prompt_lower:
            candidates.append({"type": "DECISION", "key": "backend", "value": "FastAPI", "confidence": 0.98})
        elif "django" in prompt_lower:
            candidates.append({"type": "DECISION", "key": "backend", "value": "Django", "confidence": 0.98})
        elif "python" in prompt_lower:
            candidates.append({"type": "PREFERENCE", "key": "language", "value": "Python", "confidence": 0.95})
        elif "budget" in prompt_lower:
            candidates.append({"type": "CONSTRAINT", "key": "budget", "value": "5000", "confidence": 0.9})
        elif "rayed" in prompt_lower or "user_name" in prompt_lower:
            candidates.append({"type": "IDENTITY", "key": "user_name", "value": "Rayed", "confidence": 0.99})
        
        return json.dumps({"candidates": candidates})

    # If it's worker assistant chat call:
    if "fastapi" in prompt_lower:
        return "I noted that your backend uses FastAPI. How can I help you build with it?"
    elif "django" in prompt_lower:
        return "Got it, you've switched to Django. I'm ready to assist with your Django setup."
    return "Hello! I am your AI assistant powered by Lelantos context."


@pytest.fixture
def mock_bedrock():
    """Mock Bedrock LLM invocation to return deterministic responses."""
    with patch("backend.services.bedrock.invoke_llama", side_effect=default_bedrock_mock) as mock_invoke:
        with patch("backend.routes.chat.invoke_llama", side_effect=default_bedrock_mock):
            with patch("backend.services.memory_extractor.invoke_llama", side_effect=default_bedrock_mock):
                yield mock_invoke
