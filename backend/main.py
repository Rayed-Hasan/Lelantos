"""
Lelantos API — FastAPI Application
Master Plan sections 19, 50, 53.

Modular backend with route imports, CORS, health endpoint, and env-based config.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Lelantos API",
    description="Portable AI Context Layer — AWS-native architecture for persistent, portable, user-owned AI context.",
    version="2.0.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://lovable.dev",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Import and include route routers ──────────────────────────────────────────

from backend.routes.chat import router as chat_router
from backend.routes.memory import router as memory_router
from backend.routes.conversations import router as conversations_router

app.include_router(chat_router, tags=["Chat"])
app.include_router(memory_router, tags=["Memory"])
app.include_router(conversations_router, tags=["Conversations"])


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "lelantos-api",
        "version": "2.0.0",
        "architecture": "serverless",
        "model_id": os.getenv("BEDROCK_MODEL_ID", "us.meta.llama3-1-70b-instruct-v1:0"),
        "demo_mode": os.getenv("DEMO_MODE", "false").lower() == "true",
    }


# ─── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Lelantos API v2.0 — Portable AI Context Layer")
    logger.info(f"Region: {os.getenv('AWS_REGION', 'us-east-1')}")
    logger.info(f"Table: {os.getenv('DYNAMODB_TABLE', 'LelantosTable')}")
    logger.info(f"Model: {os.getenv('BEDROCK_MODEL_ID', 'us.meta.llama3-1-70b-instruct-v1:0')}")
    logger.info(f"Demo Mode: {os.getenv('DEMO_MODE', 'false')}")
    logger.info(f"Auth Enabled: {os.getenv('AUTH_ENABLED', 'false')}")
    logger.info("=" * 60)