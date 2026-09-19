"""
LLM Service - OpenRouter
Provides a compatible invoke_llama() interface for Lelantos.
"""

import json
import logging
import os
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1"
)
MODEL_ID = os.getenv(
    "OPENROUTER_MODEL",
    "meta-llama/llama-3.3-70b-instruct:free"
)

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"


def invoke_llama(
    system_prompt: str,
    user_prompt: str,
    max_gen_len: int = 512,
    temperature: float = 0.3
) -> str:
    """
    Generate a response using Llama 3.3 70B through OpenRouter.

    The function name is kept as invoke_llama() so the rest of
    the Lelantos codebase does not need to change.
    """

    if DEMO_MODE:
        logger.info("[DEMO_MODE] Returning mock response")
        return _demo_response(user_prompt)

    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    url = f"{OPENROUTER_BASE_URL}/chat/completions"

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "max_tokens": max_gen_len,
        "temperature": temperature,
        "top_p": 0.9
    }

    body = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lelantos.ai",
            "X-Title": "Lelantos"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))

        generation = (
            result
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        if not generation:
            raise ValueError("Empty generation from OpenRouter")

        return generation

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        logger.error(
            f"OpenRouter HTTP error {e.code}: {error_body}"
        )
        raise

    except Exception as e:
        logger.error(f"OpenRouter invocation failed: {e}")
        raise


def _demo_response(user_prompt: str) -> str:
    """Generate a mock response for demo/offline development."""

    prompt_lower = user_prompt.lower()

    if "extract" in prompt_lower or "memory" in prompt_lower:
        return json.dumps({
            "candidates": [
                {
                    "type": "FACT",
                    "key": "other",
                    "value": "Demo extraction",
                    "confidence": 0.7
                }
            ]
        })

    return (
        "I understand your request. Based on the context provided, "
        "I can help you with that. Let me know if you need more details."
    )