"""
Cognito authentication for Lelantos.

Verifies Cognito JWT signatures and extracts the real user identity.
The user_id ALWAYS comes from the verified Cognito `sub` claim, never from
anything the client sends in the body, query string, or headers.

Usage in routes:

    from services.auth import get_current_user, get_current_user_id

    @router.get("/memory/profile")
    def profile(user: dict = Depends(get_current_user)):
        user_id = user["user_id"]
        ...

    # or, if you only need the id:
    def profile(user_id: str = Depends(get_current_user_id)):
        ...
"""

import os
import logging
import threading
import time

import requests
from fastapi import Depends, Request, HTTPException
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_uPaoprgvi")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")

# Region is derived from the pool ID (e.g. "us-east-1_abc123" -> "us-east-1")
# so the two can never disagree.
COGNITO_REGION = os.getenv("COGNITO_REGION") or COGNITO_USER_POOL_ID.split("_")[0]

ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
    f"{COGNITO_USER_POOL_ID}"
)
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

if not COGNITO_APP_CLIENT_ID:
    logger.error(
        "COGNITO_APP_CLIENT_ID is not set. All authenticated requests will "
        "fail until it is configured (must equal VITE_COGNITO_CLIENT_ID)."
    )

# ─── JWKS cache (with rotation handling and refresh throttling) ───────────────

JWKS_TTL_SECONDS = 60 * 60          # re-fetch keys at most hourly normally
JWKS_MIN_REFRESH_SECONDS = 60       # forced refresh (unknown kid) at most once/min

_jwks_lock = threading.Lock()
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}


def _fetch_jwks(force: bool = False) -> list:
    """Return Cognito's public signing keys, using a small throttled cache."""
    with _jwks_lock:
        cached = _jwks_cache["keys"]
        age = time.time() - _jwks_cache["fetched_at"]

        if cached is not None:
            if not force and age < JWKS_TTL_SECONDS:
                return cached
            # Someone sent an unknown `kid`: don't let them make us hammer Cognito.
            if force and age < JWKS_MIN_REFRESH_SECONDS:
                return cached

        try:
            response = requests.get(JWKS_URL, timeout=10)
            response.raise_for_status()
            keys = response.json()["keys"]
        except Exception as e:
            logger.error("Failed to fetch Cognito JWKS: %s", e)
            if cached is not None:
                return cached  # serve stale keys rather than lock everyone out
            raise HTTPException(
                status_code=503,
                detail="Authentication service temporarily unavailable",
            )

        _jwks_cache["keys"] = keys
        _jwks_cache["fetched_at"] = time.time()
        return keys


def _find_key(kid: str):
    keys = _fetch_jwks()
    key = next((k for k in keys if k.get("kid") == kid), None)

    if key is None:
        # Cognito may have rotated keys; try one throttled refresh.
        keys = _fetch_jwks(force=True)
        key = next((k for k in keys if k.get("kid") == kid), None)

    return key


# ─── Dependencies ─────────────────────────────────────────────────────────────

def get_current_user(request: Request) -> dict:
    """
    Verify the Cognito JWT and return the authenticated user.

    Returns: {"user_id": <verified sub>, "email": str, "name": str}
    Raises 401 for missing/invalid tokens.
    """
    if not COGNITO_APP_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Server auth is not configured (COGNITO_APP_CLIENT_ID missing)",
        )

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization token",
        )

    token = auth_header[7:].strip()

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise HTTPException(status_code=401, detail="Token missing signing key")

        key = _find_key(kid)

        if key is None:
            raise HTTPException(status_code=401, detail="Unknown token signing key")

        # Verifies signature, expiry, and issuer. Audience is checked manually
        # below because ID tokens use `aud` while access tokens use `client_id`.
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=ISSUER,
            options={"verify_aud": False},
        )

        token_use = payload.get("token_use")

        if token_use == "id":
            if payload.get("aud") != COGNITO_APP_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token audience")
        elif token_use == "access":
            if payload.get("client_id") != COGNITO_APP_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token client")
        else:
            raise HTTPException(status_code=401, detail="Invalid Cognito token")

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Token missing user identity",
            )

        return {
            "user_id": user_id,
            "email": payload.get("email", ""),
            "name": payload.get("name") or payload.get("cognito:username", ""),
        }

    except HTTPException:
        raise

    except JWTError as e:
        logger.warning("Invalid Cognito JWT: %s", e)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )

    except Exception as e:
        logger.error("Authentication error: %s", e)
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_current_user_id(user: dict = Depends(get_current_user)) -> str:
    """Convenience dependency when a route only needs the verified user id."""
    return user["user_id"]