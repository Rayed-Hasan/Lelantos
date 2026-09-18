"""
Bedrock Service — Extracted LLM invocation with proper error handling.
Wraps the existing invoke_llama_bedrock function with DEMO_MODE fallback.
Master Plan sections 48, 50.
"""

import boto3
import json
import os
import logging

logger = logging.getLogger(__name__)

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.meta.llama3-1-70b-instruct-v1:0")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

_bedrock_client = None


def _get_bedrock_client():
    """Lazy-initialize the Bedrock runtime client."""
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    return _bedrock_client


def invoke_llama(
    system_prompt: str,
    user_prompt: str,
    max_gen_len: int = 512,
    temperature: float = 0.3,
) -> str:
    """
    Invoke Meta Llama 3.1 70B via Amazon Bedrock.
    Returns the generated text. Raises on failure (no silent fallback).
    In DEMO_MODE, returns a mock response instead of calling Bedrock.
    """
    if DEMO_MODE:
        logger.info("[DEMO_MODE] Returning mock Bedrock response")
        return _demo_response(user_prompt)

    formatted_prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{system_prompt}<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"{user_prompt}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
    )

    body = json.dumps({
        "prompt": formatted_prompt,
        "max_gen_len": max_gen_len,
        "temperature": temperature,
        "top_p": 0.9,
    })

    try:
        client = _get_bedrock_client()
        response = client.invoke_model(
            modelId=MODEL_ID,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        generation = result.get("generation", "").strip()
        if not generation:
            raise ValueError("Empty generation from Bedrock")
        return generation
    except Exception as e:
        logger.error(f"Bedrock invocation failed: {e}")
        raise


def _demo_response(user_prompt: str) -> str:
    """Generate a reasonable mock response for demo/offline development."""
    prompt_lower = user_prompt.lower()
    if "extract" in prompt_lower or "memory" in prompt_lower:
        return json.dumps({
            "candidates": [
                {"type": "FACT", "key": "other", "value": "Demo extraction", "confidence": 0.7}
            ]
        })
    return (
        "I understand your request. Based on the context provided, "
        "I can help you with that. Let me know if you need more details."
    )
