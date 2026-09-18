"""
Auth Service — get_current_user() stub.
Master Plan section 23: build-order fix to avoid rework.

Currently returns a hardcoded test user. When Cognito is wired,
change ONLY this function to verify the JWT and extract the real user_id.
No route code needs to change.
"""

import os
import logging
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() == "true"

# Hardcoded test user for development (section 23)
TEST_USER_ID = "user_lelantos_dev"
TEST_USER_EMAIL = "dev@lelantos.ai"


def get_current_user(request: Request) -> dict:
    """
    Resolve the current user from the request.

    Currently returns a hardcoded test user.
    When Cognito is configured, this function will:
    1. Extract the JWT from the Authorization header
    2. Verify it against the Cognito User Pool
    3. Extract the user_id (sub claim)
    4. Return user info

    All routes call this function instead of trusting client-supplied user_id.
    """
    if not AUTH_ENABLED:
        return {
            "user_id": TEST_USER_ID,
            "email": TEST_USER_EMAIL,
            "name": "Lelantos Dev",
        }

    # ── Cognito JWT verification (future implementation) ──────────────
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")

    token = auth_header[7:]

    try:
        # TODO: Verify JWT against Cognito User Pool
        # For now, decode without verification for development
        import json
        import base64

        # Simple JWT payload extraction (NOT production-safe)
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Invalid token format")

        # Decode payload (add padding)
        payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload = json.loads(base64.b64decode(payload_b64))

        user_id = payload.get("sub", payload.get("cognito:username", ""))
        email = payload.get("email", "")
        name = payload.get("name", payload.get("cognito:username", ""))

        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user identity")

        return {
            "user_id": user_id,
            "email": email,
            "name": name,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
