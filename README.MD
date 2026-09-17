# Lelantos: LLM Memory Guardrail

A lightweight, production-ready memory guardrail architecture for LLM agents. Lelantos prevents contextual drift, enforces persistent hard constraints across conversational turns, and inspects supervisor reasoning in real-time.

## Architecture Overview

```
[ Frontend (React + Vite + Tailwind) ]
               │ (HTTP / JSON)
               ▼
   [ FastAPI Gateway / Lambda ]
               │
  ┌────────────┴────────────┐
  ▼                         ▼
[ Worker Agent ]    [ Supervisor Agent ]
(Claude 3.5 Sonnet) (Constraint Extractor)
        │                   │
        └─────────┬─────────┘
                  ▼
        [ DynamoDB Cache ]
      (User Memory Profile)
```

- **Frontend (`frontend/`)**: Interactive console with dual-pane layout for live conversation and real-time supervisor thought matrix inspection.
- **Backend (`backend/`)**: FastAPI gateway proxying requests to AWS Lambda orchestration and DynamoDB memory persistence.
- **Lambda Orchestrator (`lambda_function.py`)**: Dual-agent pipeline invoking Claude 3.5 Sonnet via Amazon Bedrock with memory constraint injection and automatic extraction.

---

## Quickstart

### 1. Backend (FastAPI Gateway)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`.

---

## Configuration & Environment

Set the following environment variables if deploying or testing against AWS directly:

- `AWS_REGION`: AWS Region (e.g. `us-east-1`)
- `AWS_ACCESS_KEY_ID`: AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key
- `LAMBDA_FUNCTION_NAME`: Lambda Function Name (defaults to `LelantosOrchestrator`)
- `VITE_API_URL`: Backend API endpoint (defaults to `http://localhost:8000`)
