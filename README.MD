# Lelantos: Portable AI Context Layer on AWS

> **Your AI changes. Your context shouldn't.**
> 
> *A user-owned, structured context and memory vault built on AWS serverless architecture.*
> 
> **Built for Bharat Builds Tour by WeMakeDevs** 🇮🇳 • **Solo Developer Project**

---

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-Single--Table-4053D6?logo=amazondynamodb)](https://aws.amazon.com/dynamodb/)
[![Cognito](https://img.shields.io/badge/Cognito-JWT_Auth-DD344C?logo=amazoncognito)](https://aws.amazon.com/cognito/)
[![Amplify](https://img.shields.io/badge/Amplify-Hosting-FF9900?logo=awsamplify)](https://aws.amazon.com/amplify/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Live Demo](https://img.shields.io/badge/Live_Demo-AWS_Amplify-00C853?style=for-the-badge&logo=awsamplify&logoColor=white)](https://main.dpe2sxkj21dci.amplifyapp.com/)

> 🌐 **Live Deployed Application:** **[https://main.dpe2sxkj21dci.amplifyapp.com/](https://main.dpe2sxkj21dci.amplifyapp.com/)**
>
> *Test live vault initialization, Cognito email verification, chat memory extraction, DynamoDB persistence, and conflict versioning directly on AWS.*

---

## 📑 Table of Contents

- [Overview](#-overview)
- [The Problem: Why AI Memory is Broken](#-the-problem-why-ai-memory-is-broken)
- [The Solution: Lelantos Context Layer](#-the-solution-lelantos-context-layer)
- [Core Features](#-core-features)
- [Memory Architecture Deep Dive](#-memory-architecture-deep-dive)
  - [The 9 Structured Memory Types](#the-9-structured-memory-types)
  - [Fixed Key Vocabulary](#fixed-key-vocabulary)
  - [Memory Object Schema](#memory-object-schema)
  - [Memory Status Lifecycle](#memory-status-lifecycle)
  - [Policy Engine Rules](#policy-engine-rules)
- [Provenance & "Why Did You Remember This?"](#-provenance--why-did-you-remember-this)
- [Conflict Detection & Versioning](#-conflict-detection--versioning)
- [Relevant Context Retrieval](#-relevant-context-retrieval)
- [Multi-Tenant Architecture & User Isolation](#-multi-tenant-architecture--user-isolation)
- [Authentication Flow](#-authentication-flow)
- [Chat Pipeline: Dual-Branch Concurrency](#-chat-pipeline-dual-branch-concurrency)
- [System Architecture](#-system-architecture)
- [AWS Infrastructure & Services](#-aws-infrastructure--services)
- [AI & LLM Architecture: The OpenRouter Pivot](#-ai--llm-architecture-the-openrouter-pivot)
- [Current Deployment Status](#-current-deployment-status)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Local Development Setup](#-local-development-setup)
- [AWS Deployment Guide](#-aws-deployment-guide)
- [Testing & Verification](#-testing--verification)
- [5-Minute Hackathon Demo Script](#-5-minute-hackathon-demo-script)
- [🛠️ AWS Deployment Journey & Production Debugging](#️-aws-deployment-journey--production-debugging)
- [📝 Solo Developer Log](#-solo-developer-log)
  - [Thursday — AWS Foundation, Cloud Setup & First Roadblocks](#thursday--aws-foundation-cloud-setup--first-roadblocks)
  - [Friday — Memory Engine, Backend Architecture & Frontend Rebuild](#friday--memory-engine-backend-architecture--frontend-rebuild)
  - [Saturday — AWS Integration, Deployment Debugging & Security](#saturday--aws-integration-deployment-debugging--security)
  - [Sunday — Production Polish, Signup Verification & Final Validation](#sunday--production-polish-signup-verification--final-validation)
- [What I Learned Building Lelantos](#-what-i-learned-building-lelantos)
- [Cost Analysis & Serverless Economics](#-cost-analysis--serverless-economics)
- [Security & Privacy](#-security--privacy)
- [Future Roadmap](#-future-roadmap)
- [Hackathon Context & Acknowledgments](#-hackathon-context--acknowledgments)

---

## 🌟 Overview

**Lelantos** is a portable, user-owned AI context and memory layer built on an enterprise-grade AWS serverless foundation. 

Today's AI ecosystem forces users into walled gardens. Your project requirements, architectural decisions, personal constraints, coding style preferences, and identity parameters are locked within specific proprietary chat interfaces. When you switch between models—or even start a new session—your context evaporates.

Lelantos decouples context from the underlying model. It acts as an externalized, persistent, structured memory vault that captures, versions, validates, and isolates user context. Whether you interact through our custom console or connect downstream LLMs via API, your preferences and decisions follow you seamlessly.

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude / Anth│     │ OpenAI / GPT │     │ Meta / Llama │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └──────────────┬─────┴────────────────────┘
                      ▼
         ┌─────────────────────────┐
         │   LELANTOS CONTEXT      │
         │   • Structured Memory   │
         │   • Provenance Tracking │
         │   • Conflict Resolution │
         │   • Strict Tenant Scope │
         └────────────┬────────────┘
                      ▼
         ┌─────────────────────────┐
         │  Amazon DynamoDB Vault  │
         │   (USER#<user_id>)      │
         └─────────────────────────┘
```

---

## 🎯 The Problem: Why AI Memory is Broken

AI conversations are fragmented and amnesic:

1. **Context Silos:** Information shared with one AI platform (e.g., ChatGPT) is invisible to another (e.g., Claude, Gemini, or local models).
2. **Repetitive Onboarding:** Developers waste thousands of tokens repeatedly re-explaining: *"My budget is ₹5,000/month, I code solo in Python and React, and I deploy to AWS."*
3. **Finite Context Window Bottlenecks:** Naive chat tools dump raw conversation logs into the prompt until token limits trigger silent truncation of early, critical project decisions.
4. **Zero Provenance or Explainability:** Chatbots hallucinate "memories" with no audit trail. Users cannot verify *when*, *why*, or *from which message* a fact was recorded.
5. **Silent Overwriting & Stale Context:** When constraints change (e.g., migrating from Node.js to Python), traditional systems either hold contradictory thoughts simultaneously or silently overwrite previous context without maintaining a historical audit trail.

---

## 💡 The Solution: Lelantos Context Layer

Lelantos replaces loose chat histories with a **deterministic, structured, and auditable memory engine**:

- **Structured Memory Schema:** Context is extracted into strongly-typed objects containing explicit keys, confidence scores, source references, status indicators, and timestamps.
- **Controlled Vocabulary:** Strict categorization eliminates "key drift," ensuring the model categorizes concepts predictably across sessions.
- **Explainable Provenance:** Every memory links directly to the conversation ID and message text where it originated.
- **Non-Destructive Conflict Resolution:** Conflicting facts are tracked with versioning—previous decisions are archived as `REPLACED`, while new statements become `ACTIVE`.
- **Strict User Isolation:** Built with DynamoDB single-table architecture partitioned on verified Amazon Cognito JWT identities (`PK = USER#<user_id>`).
- **Dual-Branch Concurrency:** Message replies and memory extraction run in parallel threads so chat responses remain instant while background memory extraction and conflict audits execute safely.

---

## ⚡ Core Features

| Feature | Description | Benefit |
| :--- | :--- | :--- |
| **Structured Memory Engine** | Extracts candidate facts into typed schemas rather than raw text chunks. | High precision retrieval, zero hallucinations. |
| **Fixed Key Vocabulary** | Maps natural language keys to curated vocabularies per type. | Prevents duplicate keys representing the same concept. |
| **Why Did You Remember This?** | Full inspection panel showing original message quote and confidence. | Complete user trust and explainability. |
| **Automated Conflict Resolution** | Detects updates to previous statements and supersedes old records. | Context stays accurate over multi-week projects. |
| **Relevant Retrieval Policy** | Injects only active, high-confidence, contextually-relevant memories. | Conserves token budget and prevents model distraction. |
| **Cryptographic Multi-Tenancy** | Partition keys derived strictly from verified Amazon Cognito JWTs. | Zero risk of cross-user data leakage. |
| **User Data Sovereignty** | Provides instant editing, soft deletion, and complete vault purging. | Full user privacy and compliance. |

---

## 🧠 Memory Architecture Deep Dive

Lelantos treats context as structured records rather than unstructured vector blobs.

### The 9 Structured Memory Types

1. **`IDENTITY`**: Foundational user facts that define the user profile (`user_name`, `role`).
2. **`PREFERENCE`**: Explicit user likes, syntax styles, and workflow habits (`language`, `framework`, `style`, `communication_style`).
3. **`CONSTRAINT`**: Non-negotiable technical, financial, or operational limits (`budget`, `timeline`, `tech_constraint`, `team_size`).
4. **`PROJECT`**: Active project parameters and metadata (`project_name`, `project_type`, `deadline`).
5. **`GOAL`**: High-level milestones and success criteria (`primary_goal`).
6. **`DECISION`**: Settled technical or organizational choices (`backend`, `frontend`, `database`, `hosting`, `auth_provider`).
7. **`FACT`**: General world or business knowledge stated by the user (`other`).
8. **`RELATIONSHIP`**: People, organizations, or service dependencies (`other`).
9. **`TEMPORARY`**: Ephemeral instructions that carry short-lived relevance (`other`).

### Fixed Key Vocabulary

To prevent model vocabulary drift (e.g., one day extracting `programming_language` and the next day `coding_lang`), Lelantos enforces a fixed dictionary per memory type:

```text
CONSTRAINT   → budget, timeline, tech_constraint, team_size, other
DECISION     → backend, frontend, database, hosting, auth_provider, other
PREFERENCE   → language, framework, style, communication_style, other
PROJECT      → project_name, project_type, deadline, other
GOAL         → primary_goal, other
IDENTITY     → user_name, role, other
FACT         → other
RELATIONSHIP → other
TEMPORARY    → other
```

### Memory Object Schema

A live memory in Lelantos is represented by the following validated Pydantic model:

```json
{
  "memory_id": "mem_4a8b79f10c2e",
  "user_id": "us-east-1:a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "type": "CONSTRAINT",
  "key": "budget",
  "value": "₹5,000/month maximum",
  "confidence": 0.98,
  "status": "ACTIVE",
  "source": {
    "conversation_id": "conv_891e4fc290ab",
    "message_id": "msg_003f412ad890",
    "text": "My budget is capped at ₹5,000/month maximum for cloud hosting.",
    "extractor": "llama-3.3-70b",
    "created_at": "2026-09-20T04:15:22.108Z"
  },
  "created_at": "2026-09-20T04:15:22.108Z",
  "updated_at": "2026-09-20T04:15:22.108Z",
  "expires_at": null,
  "version": 1
}
```

### Memory Status Lifecycle

Memories progress through an explicit state machine:
- **`ACTIVE`**: The current verified ground truth. Eligible for worker retrieval and prompt injection.
- **`REPLACED`**: Superseded by a newer conflicting memory. Kept in DynamoDB for historical audit trails and version diffs.
- **`EXPIRED`**: Stored items whose TTL timestamp has elapsed.
- **`DELETED`**: Soft-deleted by user request. Excluded from all lookups.
- **`PENDING`**: Candidate memories awaiting conflict evaluation or user confirmation.

### Policy Engine Rules

The Lelantos Policy Engine governs how memories are filtered and injected:
1. **Rule 1 (Active Only):** Only memories with status `ACTIVE` are eligible for prompt assembly.
2. **Rule 2 (Relevance Scoping):** Only memories relevant to the immediate user prompt are injected.
3. **Rule 3 (Confidence Floor):** Memories with confidence below 0.70 are never permitted to override explicit user statements.
4. **Rule 4 (Current Turn Supremacy):** The user's active prompt always takes precedence over historical context.
5. **Rule 5 (Sovereign Override):** The user possesses absolute control to inspect, edit, or delete any record in their vault.

---

## 🔍 Provenance & "Why Did You Remember This?"

Most AI agents operate as black boxes. If a model says, *"I remember you use PostgreSQL,"* the user cannot verify where that belief originated.

In Lelantos, **every memory stores complete provenance**:
- **Source Message Text:** The verbatim sentence spoken by the user that generated the memory.
- **Conversation ID:** The session in which the fact was disclosed.
- **Message Timestamp:** The exact UTC timestamp of extraction.
- **Extraction Model:** The LLM that identified the candidate fact.
- **Confidence Metric:** A calibrated floating-point score (0.0 to 1.0) assessing semantic clarity.

Users can click any memory card in the **Memory Inspector** to reveal its provenance card:

```text
┌─────────────────────────────────────────────────────────────┐
│ MEMORY INSPECTOR: [DECISION] backend = Python               │
├─────────────────────────────────────────────────────────────┤
│ Value:        Python                                        │
│ Status:       ACTIVE                                        │
│ Version:      1                                             │
│ Confidence:   98%                                           │
│ Updated:      2026-09-20 04:15 UTC                          │
├─────────────────────────────────────────────────────────────┤
│ PROVENANCE:                                                 │
│ "Why did Lelantos remember this?"                           │
│                                                             │
│ Captured From:                                              │
│ "Backend must use Python. Frontend is React."               │
│                                                             │
│ Conversation: Lelantos Core Architecture                    │
│ Extractor:    Meta Llama 3.3 70B Instruct                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚔️ Conflict Detection & Versioning

When a user updates a technical requirement or personal preference, traditional chatbots either hallucinate both conflicting facts or silently erase history.

Lelantos detects conflicts deterministically by comparing `(user_id, memory_type, normalized_key)`:

```text
Turn 1: "We are building our API backend with Python."
→ Extracted:  DECISION | backend = Python (v1, ACTIVE)

Turn 4: "We decided to migrate the API backend to Node.js."
→ Conflict Detected: key 'backend' under type 'DECISION' already exists.
→ Previous record transitioned: Python (v1) → status = REPLACED
→ New record persisted:         Node.js (v2) → status = ACTIVE
```

The system preserves the full lineage in DynamoDB. The user can navigate to the **Timeline** or **Memory Inspector** to view past versions:

```text
VERSION HISTORY: DECISION | backend
├── [v2] Node.js   (ACTIVE)   — Extracted: Today at 05:30 UTC
└── [v1] Python    (REPLACED) — Extracted: Today at 04:15 UTC
```

---

## 🎯 Relevant Context Retrieval

Traditional AI memory solutions dump an entire document of accumulated memories into the prompt. This quickly overwhelms the context window, introduces irrelevant noise, and inflates API costs.

Lelantos uses **policy-guided selective retrieval**:
1. Incoming user query is scanned for domain keywords, entity names, and intent.
2. Active memories are evaluated against the query across key terms and semantic affinity.
3. Memories are ranked by **Relevance Score**, weighted by **Confidence** and **Recency**.
4. Only the top-k highest scoring memories are formatted into a compressed `<user_context>` XML block for the worker prompt.

If a user asks: *"What styling framework am I using?"*, Lelantos retrieves only the relevant `PREFERENCE | framework = Tailwind CSS` card, leaving unrelated budget and backend memories un-injected.

---

## 🛡️ Multi-Tenant Architecture & User Isolation

Lelantos is built from the ground up for strict multi-tenancy. No user can ever access, modify, or infer another user's context.

### Cryptographic Identity Scoping

```text
Cognito ID Token (JWT)
  │
  ▼
FastAPI Depends(get_current_user)
  │  1. Cryptographically verify signature using Cognito JWKS
  │  2. Assert aud == COGNITO_APP_CLIENT_ID
  │  3. Assert token_use in ["id", "access"]
  │  4. Extract sub claim: "user_a_uuid"
  ▼
DynamoDB Single-Table Query
  PK = "USER#user_a_uuid"
  SK begins_with "MEMORY#"
```

### Isolation Guarantees

1. **Partition Key Confinement:** Every database operation in `memory_engine.py` constructs partition keys as `PK = USER#<user_id>`. The backend refuses empty or null user IDs.
2. **Access Control Enforcement:** Even if User B knows User A's unique `memory_id`, executing `GET /memory/{memory_id}` verifies `PK = USER#<user_b>` in DynamoDB. The query returns `404 Not Found`, completely preventing unauthorized enumeration.
3. **Conversation Isolation:** Conversations and message partitions are validated against ownership records before queries are executed.
4. **Empirical Verification:** The test suite (`tests/test_user_isolation.py`) systematically tests that User A and User B cannot read, overwrite, or delete each other's memories.

---

## 🔑 Authentication Flow

Lelantos implements an Amazon Cognito user flow with client-side and server-side verification:

```text
 ┌──────────────┐                 ┌─────────────────┐                 ┌─────────────────┐
 │ Browser / UI │                 │ Amazon Cognito  │                 │ API Gateway /   │
 │              │                 │   User Pool     │                 │ AWS Lambda      │
 └──────┬───────┘                 └────────┬────────┘                 └────────┬────────┘
        │                                  │                                   │
        │ 1. Signup (Name, Email, Pass)    │                                   │
        ├─────────────────────────────────►│                                   │
        │                                  │                                   │
        │ 2. Sends Verification Email      │                                   │
        │    with Confirmation Code        │                                   │
        │◄─────────────────────────────────┤                                   │
        │                                  │                                   │
        │ 3. UI shows Verification Form    │                                   │
        │    (Prompts to check Spam/Junk)  │                                   │
        │                                  │                                   │
        │ 4. Submit confirmation code      │                                   │
        ├─────────────────────────────────►│                                   │
        │                                  │                                   │
        │ 5. Account Confirmed             │                                   │
        │◄─────────────────────────────────┤                                   │
        │                                  │                                   │
        │ 6. Login (Email + Password)      │                                   │
        ├─────────────────────────────────►│                                   │
        │                                  │                                   │
        │ 7. Returns JWT ID + Access Token │                                   │
        │◄─────────────────────────────────┤                                   │
        │                                                                      │
        │ 8. API Request (Header: "Authorization: Bearer <id_token>")         │
        ├─────────────────────────────────────────────────────────────────────►│
        │                                                                      │ 9. Fetch Cognito JWKS
        │                                                                      │    & verify signature
        │                                                                      │ 10. Extract 'sub' claim
        │                                                                      │ 11. Read/Write DynamoDB
        │                                                                      │     PK = USER#<sub>
        │ 12. Authenticated Response                                           │
        │◄─────────────────────────────────────────────────────────────────────┤
```

### Password Requirements (Cognito Policy)
The signup interface provides explicit security guidance to ensure accounts comply with AWS Cognito password policies:
- Minimum **8 characters**
- At least **1 uppercase letter** (`A-Z`)
- At least **1 lowercase letter** (`a-z`)
- At least **1 numerical digit** (`0-9`)
- At least **1 special character** (`^ $ * . [ ] { } ( ) ? - " ! @ # % & / \ , > < ' : ; | _ ~ \``)

---

## ⚡ Chat Pipeline: Dual-Branch Concurrency

When an authenticated user sends a message, Lelantos executes two branches concurrently using Python's asynchronous thread pool executor:

```text
                           USER MESSAGE
                                │
                                ▼
                       Verify Cognito JWT
                                │
                                ▼
                       Store User Message
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
       [WORKER BRANCH]                  [MEMORY BRANCH]
     (Latency Critical)              (Background Asynchronous)
                │                               │
                ▼                               ▼
       Retrieve Relevant                 Memory Extractor
       Active Memories                  (OpenRouter Llama 70B)
                │                               │
                ▼                               ▼
        Assemble Context               Candidate Memories
        & Enforce Policy                        │
                │                               ▼
                ▼                       Conflict Detector
        OpenRouter Llama 70B            (Compare Existing Keys)
        Worker Generation                       │
                │                               ▼
                ▼                       Version & Status Update
          Worker Reply                          │
                │                               ▼
                │                       Persist to DynamoDB
                │                       (PK = USER#<user_id>)
                │                               │
                └───────────────┬───────────────┘
                                │
                                ▼
                     Return Combined Payload
                    (Response + Extracted Diffs)
```

### Why Separation Matters
If memory extraction ran sequentially ahead of response generation, chat latency would double (requiring two sequential LLM round-trips). By executing the branches concurrently:
1. The user receives their conversational response with low latency.
2. The memory branch runs in parallel, auditing previous memories and persisting new candidates without blocking the conversational flow.

---

## 🏛️ System Architecture

```text
                             CLIENT LAYER
    ┌───────────────────────────────────────────────────────────┐
    │                 AWS Amplify Web Console                   │
    │     React 19 • Vite • TanStack Router • Tailwind CSS      │
    └─────────────────────────────┬─────────────────────────────┘
                                  │
                          HTTPS / Bearer JWT
                                  │
                                  ▼
                            GATEWAY LAYER
    ┌───────────────────────────────────────────────────────────┐
    │                  Amazon API Gateway (HTTP)                │
    │            CORS Handling • Direct Route Proxy             │
    └─────────────────────────────┬─────────────────────────────┘
                                  │
                            COMPUTE LAYER
    ┌───────────────────────────────────────────────────────────┐
    │                     AWS Lambda Function                   │
    │                 Python 3.12 Runtime • Mangum              │
    │ ┌───────────────────────────────────────────────────────┐ │
    │ │                    FastAPI Backend                    │ │
    │ │  • Auth Service (Cognito JWKS Verification)           │ │
    │ │  • Chat Router (Async Dual-Branch Executor)           │ │
    │ │  • Memory Engine (Single-Table CRUD & Versioning)     │ │
    │ │  • Context Retriever (Policy-Scoring Engine)          │ │
    │ │  • Memory Extractor (Fixed Vocabulary Normalizer)     │ │
    │ │  • Conflict Detector (Audit & Supersede Engine)       │ │
    │ └───────────────────────────────────────────────────────┘ │
    └──────────────┬─────────────────────────────┬──────────────┘
                   │                             │
                   ▼                             ▼
             STORAGE LAYER                INFERENCE LAYER
    ┌─────────────────────────────┐ ┌───────────────────────────┐
    │       Amazon DynamoDB       │ │   OpenRouter API Gateway  │
    │   Table: "LelantosTable"    │ │  Meta Llama 3.3 70B       │
    │   PK: USER#<user_id>        │ │  (Decoupled LLM Engine)   │
    │   SK: MEMORY#<memory_id>    │ │                           │
    └─────────────────────────────┘ └───────────────────────────┘
```

---

## ☁️ AWS Infrastructure & Services

| Service | Architectural Role | Production Configuration |
| :--- | :--- | :--- |
| **AWS Amplify** | Global CDN and static web hosting | Continuous deployment connected to Git, serving TanStack/Vite client. |
| **Amazon Cognito** | Managed identity and authentication | User Pool with email verification code flow and JWT issue. |
| **Amazon API Gateway** | Managed HTTP API gateway | Serverless routing with configured CORS headers for the Amplify domain. |
| **AWS Lambda** | Serverless compute engine | Python 3.12 container runtime with Mangum ASGI adapter and 120s timeout. |
| **Amazon DynamoDB** | Single-table persistence layer | Pay-per-request billing, composite key (`PK`, `SK`), zero idle server cost. |
| **AWS IAM** | Identity and access management | Least-privilege execution roles granting Lambda access only to DynamoDB and CloudWatch. |
| **Amazon CloudWatch** | Real-time observability | Centralized logging for Lambda execution traces and exception tracking. |

---

## 🤖 AI & LLM Architecture: The OpenRouter Pivot

> ### ⚠️ Critical Engineering Narrative: The Bedrock Pivot
> 
> The original Lelantos system was architected to invoke Amazon Bedrock directly using the Meta Llama 3.1 70B cross-region inference profile (`us.meta.llama3-1-70b-instruct-v1:0`).
> 
> During cloud deployment, remote invocation attempts on Bedrock returned:
> ```text
> botocore.exceptions.ClientError: An error occurred (ValidationException) 
> when calling the InvokeModel operation: Operation not allowed
> ```
> 
> Rather than letting an upstream cloud account restriction stall progress, **the core service boundary held firm**.
> 
> Because the LLM service was encapsulated behind a modular function signature (`invoke_llama(system_prompt, user_prompt, max_gen_len, temperature)`), the underlying provider was pivoted to **OpenRouter** (serving Meta Llama 3.3 70B Instruct). 
> 
> **Zero application routes, zero database models, and zero frontend components required refactoring.** The entire AWS-native cloud infrastructure—Cognito, Lambda, API Gateway, DynamoDB, Amplify, IAM, and CloudWatch—remained intact.

### How Lelantos Interacts with the LLM

1. **Extraction Prompting:** Employs few-shot JSON formatting constraints with strict prohibition against sensitive values (passwords, tokens, keys).
2. **Deterministic Parsing & JSON Repair:** Model outputs are stripped of markdown fences and evaluated through a repair fallback that fixes trailing commas and syntax anomalies.
3. **Vocabulary Normalization:** Proposed keys are matched against `FIXED_KEY_VOCABULARY` using exact and substring matching to prevent key explosion.

---

## 🚀 Current Deployment Status

- [x] **Frontend:** Deployed via AWS Amplify — **[https://main.dpe2sxkj21dci.amplifyapp.com/](https://main.dpe2sxkj21dci.amplifyapp.com/)**
- [x] **Backend:** Deployed on AWS Lambda (`LelantosFastApiLambda`)
- [x] **API Gateway:** Live HTTP API routing traffic to Lambda
- [x] **Database:** Live Amazon DynamoDB (`LelantosTable`) in `us-east-1`
- [x] **Authentication:** Amazon Cognito User Pool with live email verification code delivery
- [x] **Multi-Tenancy:** Partition keys derived from verified Cognito JWT `sub`
- [x] **LLM Inference:** Operating on Meta Llama 3.3 70B via OpenRouter
- [x] **End-to-End Verification:** User registration, email verification, login, chat extraction, DynamoDB persistence, and memory timeline validated live

---

## 🛠️ Technology Stack

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│ React 19 • TypeScript 5.8 • TanStack Router • Vite 8 • Tailwind CSS 4   │
│ Radix UI Primitives • Lucide React • Amazon Cognito Identity JS         │
├─────────────────────────────────────────────────────────────────────────┤
│                              BACKEND                                    │
│ Python 3.12 • FastAPI • Mangum ASGI • Boto3 • Pydantic v2 • Python-Jose │
├─────────────────────────────────────────────────────────────────────────┤
│                             CLOUD & DB                                  │
│ AWS Lambda • Amazon DynamoDB • Amazon Cognito • Amazon API Gateway      │
│ AWS Amplify • AWS IAM • Amazon CloudWatch                               │
├─────────────────────────────────────────────────────────────────────────┤
│                             AI / LLM                                    │
│ Meta Llama 3.3 70B Instruct via OpenRouter API Gateway                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```text
Lelantos/
├── backend/                             # FastAPI modular backend
│   ├── main.py                          # Application entrypoint & CORS config
│   ├── lambda_handler.py                # Mangum adapter for AWS Lambda
│   ├── requirements.txt                 # Backend Python dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   └── memory.py                    # Pydantic schemas, enums, vocabulary
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── chat.py                      # POST /chat (Dual-branch executor)
│   │   ├── memory.py                    # CRUD endpoints for memories & stats
│   │   └── conversations.py             # Conversation & message history routes
│   └── services/
│       ├── __init__.py
│       ├── auth.py                      # Cognito JWT decoding & JWKS cache
│       ├── bedrock.py                   # LLM provider service (OpenRouter engine)
│       ├── memory_engine.py             # DynamoDB single-table CRUD operations
│       ├── memory_extractor.py          # Structured extraction & JSON repair
│       ├── conflict_detector.py         # Conflict detection & versioning logic
│       ├── context_retriever.py         # Relevance scoring & prompt assembly
│       ├── conversation_manager.py      # Conversation lifecycle & message persistence
│       └── policy_engine.py             # 5 core governance rules
│
├── frontend/                            # React + TanStack application
│   ├── src/
│   │   ├── routes/                      # TanStack file-based routes
│   │   │   ├── __root.tsx               # Root layout & route wrapper
│   │   │   ├── index.tsx                # Landing page & value proposition
│   │   │   ├── login.tsx                # Operator authentication
│   │   │   ├── signup.tsx               # Vault initialization & email verification
│   │   │   ├── dashboard.tsx            # Context overview & stats deck
│   │   │   ├── chat.tsx                 # Interactive chat with live extraction
│   │   │   ├── memory.tsx               # Memory vault browser with type filters
│   │   │   ├── memory.$id.tsx           # Memory Inspector & provenance audit
│   │   │   ├── timeline.tsx             # Chronological memory mutation stream
│   │   │   ├── conversations.tsx        # Conversation archive browser
│   │   │   ├── api-docs.tsx             # REST API & MCP integration guides
│   │   │   └── settings.tsx             # User privacy & vault purge controls
│   │   ├── components/
│   │   │   ├── lelantos/                # Custom HUD, logo, and chat components
│   │   │   └── ui/                      # Radix UI primitives
│   │   └── lib/
│   │       ├── api.ts                   # Typed API client
│   │       ├── auth-context.tsx         # Cognito authentication context & provider
│   │       └── types.ts                 # Shared TypeScript interfaces
│   ├── package.json                     # Frontend scripts & dependencies
│   └── vite.config.ts                   # Vite bundler configuration
│
├── tests/                               # Test suite
│   ├── conftest.py                      # Pytest fixtures & in-memory DynamoDB
│   ├── mock_dynamodb.py                 # In-memory mock DynamoDB table
│   ├── test_api_routes.py               # Route contract & validation tests
│   ├── test_chat_pipeline.py            # Dual-branch pipeline tests
│   ├── test_edge_cases.py               # Edge case, malformed JSON & recovery tests
│   ├── test_frontend_contract.py        # API contract compatibility tests
│   ├── test_memory_lifecycle.py         # Memory creation, conflict & versioning tests
│   └── test_user_isolation.py           # Multi-tenant tenant boundary tests
│
├── test_cloud_pipeline.py               # Live cloud integration test script
├── .gitignore                           # Repository hygiene & artifact exclusions
├── LICENSE                              # MIT License
└── README.MD                            # Engineering documentation
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11 or 3.12
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Rayed-Hasan/Lelantos.git
cd Lelantos
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Configure backend environment
cat << 'EOF' > backend/.env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
COGNITO_USER_POOL_ID=us-east-1_example
COGNITO_APP_CLIENT_ID=your_cognito_client_id_here
DYNAMODB_TABLE=LelantosTable
AWS_REGION=us-east-1
DEMO_MODE=false
EOF

# Launch FastAPI local development server
uvicorn backend.main:app --reload --port 8000
```

> **Tip (Zero-Cloud Mock Mode):** Setting `DEMO_MODE=true` in `backend/.env` bypasses remote LLM and DynamoDB connections, allowing you to run and demo the full system locally without AWS credentials.

### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure frontend environment
cat << 'EOF' > .env.local
VITE_COGNITO_USER_POOL_ID=us-east-1_example
VITE_COGNITO_CLIENT_ID=your_cognito_client_id_here
VITE_COGNITO_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example
EOF

# Launch Vite development server
npm run dev
```

Visit `http://localhost:5173` (or the port indicated by Vite) to view the application.

---

## ☁️ AWS Deployment Guide

### 1. Amazon DynamoDB Setup
Create a single table with composite primary keys:
```bash
aws dynamodb create-table \
  --table-name LelantosTable \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Amazon Cognito Setup
1. Create a User Pool named `LelantosUserPool` in `us-east-1`.
2. Configure sign-in using **Email**.
3. Enable self-registration with **Email Verification Code** delivery.
4. Set password policy (minimum 8 characters, uppercase, lowercase, numbers, symbols).
5. Create an App Client without client secret (for SPA browser use).

### 3. AWS Lambda Package & Deployment
> **Crucial Packaging Note:** Python packages with native C/C++ extensions (such as `pydantic-core`) compiled on Windows will crash in AWS Lambda. Build your deployment archive using Linux binary wheels:

```bash
# Prepare deployment directory
mkdir -p lambda-package

# Install dependencies targeting the Lambda Linux runtime
pip install \
  --platform manylinux2014_x86_64 \
  --target=lambda-package \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  --upgrade \
  -r backend/requirements.txt

# Copy backend source
cp -r backend lambda-package/

# Package zip
cd lambda-package
zip -r ../lelantos-backend.zip .
cd ..

# Deploy to AWS Lambda
aws lambda create-function \
  --function-name LelantosFastApiLambda \
  --runtime python3.12 \
  --handler backend.lambda_handler.handler \
  --role arn:aws:iam::<YOUR_ACCOUNT_ID>:role/LelantosLambdaExecutionRole \
  --zip-file fileb://lelantos-backend.zip \
  --timeout 120 \
  --memory-size 512 \
  --environment "Variables={DYNAMODB_TABLE=LelantosTable,OPENROUTER_API_KEY=your_key,COGNITO_USER_POOL_ID=us-east-1_xxx,COGNITO_APP_CLIENT_ID=yyy}" \
  --region us-east-1
```

### 4. Amazon API Gateway Setup
1. Create an **HTTP API** in API Gateway.
2. Configure a `POST /api/chat` (or greedy `{proxy+}`) integration pointing to the `LelantosFastApiLambda` function.
3. Configure CORS on API Gateway to allow headers (`Authorization`, `Content-Type`) and origins (your Amplify domain).
4. Deploy the API and note the Invoke URL.

### 5. AWS Amplify Hosting
1. Connect your GitHub repository to AWS Amplify.
2. Set the App Root to `frontend/`.
3. Configure build settings (`amplify.yml`):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```
4. Set environment variables (`VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_AUTHORITY`) in Amplify Console.
5. Trigger build and deployment.

---

## 🧪 Testing & Verification

The repository includes comprehensive automated test suites covering routes, memory lifecycle, conflict handling, and tenant isolation:

```bash
# Run complete test suite
python -m pytest tests/ -v
```

### Test Suite Overview

| Test Module | Coverage & Invariants |
| :--- | :--- |
| `test_user_isolation.py` | Verifies that User A and User B cannot access, read, or delete each other's memories or conversations. |
| `test_memory_lifecycle.py` | Tests memory creation, fixed-key normalization, conflict detection, and version incrementing. |
| `test_chat_pipeline.py` | Tests concurrent worker response and background memory extraction. |
| `test_api_routes.py` | Tests FastAPI HTTP endpoints, JWT authentication enforcement, and error codes. |
| `test_edge_cases.py` | Validates JSON repair fallbacks, markdown fence stripping, and prompt injection resilience. |
| `test_frontend_contract.py`| Ensures backend JSON response shapes match the TypeScript interfaces expected by the frontend. |

---

## 🎬 5-Minute Hackathon Demo Script

### Part 1: The Context Trap (0:00 - 1:00)
- **Action:** Open the Lelantos landing page.
- **Narrative:** *"Every developer experiences AI amnesia. We explain our stack, our budget, and our architecture to Claude or ChatGPT, but when we open a new tab or switch models, that context is gone. Lelantos solves this by giving the user a persistent, structured context layer hosted on AWS."*

### Part 2: Vault Initialization & Real-Time Extraction (1:00 - 2:00)
- **Action:** Sign up or log into the live vault, navigate to **Chat**, and submit:
  > *"I'm building Lelantos solo. My monthly budget is capped at ₹5,000. We must use Python for the backend and React for the frontend."*
- **Narrative:** *"Notice the dual-branch pipeline at work. The worker AI immediately provides a helpful answer, while the Memory Extraction engine in parallel analyzes the message and extracts 4 structured memories into our DynamoDB vault: Project, Budget Constraint, Backend Decision, and Frontend Decision."*

### Part 3: Memory Inspector & Provenance Audit (2:00 - 3:00)
- **Action:** Navigate to **Memory**, click the `budget = ₹5,000` memory card, and open **Why Did You Remember This?**
- **Narrative:** *"Lelantos is not a black box. The Memory Inspector shows exact provenance: the verbatim quote from our message, the extraction model, timestamp, and confidence score (98%). The user has sovereign control to edit, verify, or soft-delete any record."*

### Part 4: Dynamic Conflict Resolution (3:00 - 4:00)
- **Action:** Return to **Chat** and enter:
  > *"Actually, we've decided to switch the backend to Node.js."*
- **Narrative:** *"Watch what happens. Lelantos does not hallucinate two backends, nor does it silently overwrite history. The conflict detector identifies an update to key 'backend'. In the Memory view, Python is transitioned to REPLACED (v1), and Node.js is now ACTIVE (v2). The complete architectural evolution is visible in the Timeline."*

### Part 5: Model Independence & Downstream Portability (4:00 - 5:00)
- **Action:** Navigate to **API Docs** and show the REST / MCP integration format.
- **Narrative:** *"Now, whether you plug in Claude, GPT-4, or a local Llama instance, any system can query your active context vault over API. The AI model is a replaceable commodity. Your context is your intellectual property. Lelantos makes it portable."*

---

## 🛠️ AWS Deployment Journey & Production Debugging

Building a complete cloud-native architecture as a solo developer within hackathon constraints involved navigating real-world production engineering hurdles:

### A. The Amazon Bedrock Access Barrier
- **Problem:** Direct invocations of Meta Llama 3.1 70B via boto3 failed with `ValidationException: Operation not allowed` due to AWS account tier constraints.
- **Solution:** Designed a clean service facade (`backend/services/bedrock.py`). When Bedrock was blocked, swapped the internal implementation to OpenRouter while preserving the exact `invoke_llama()` signature. All AWS surrounding infrastructure remained intact.
- **Key Takeaway:** Always build provider abstractions at your boundaries. An infrastructure or vendor issue should never require rewiring your core application logic.

### B. Lambda Dependency Packaging & Native Binaries
- **Problem:** Bundling local Windows Python dependencies into the Lambda deployment zip led to crashes with `ImportError: cannot import name 'pydantic_core'`.
- **Solution:** Re-packaged dependencies in a dedicated directory using pip with `--platform manylinux2014_x86_64` and `--only-binary=:all:`, ensuring native shared libraries compiled for Amazon Linux were bundled into the deployment archive.
- **Key Takeaway:** Python dependencies with C/Rust extensions are OS-dependent. Never zip a local Windows virtual environment for AWS Lambda.

### C. The Missing 'requests' Module in Production
- **Problem:** During the initial live test of the Cognito JWKS token validator, the Lambda execution failed with `ModuleNotFoundError: No module named 'requests'`.
- **Solution:** Explicitly added `requests>=2.31.0` to `backend/requirements.txt`, rebuilt the Linux deployment package, and redeployed the Lambda zip.
- **Key Takeaway:** Audit the dependency delta between local dev environments and minimal container runtimes.

### D. API Gateway to FastAPI Routing via Mangum
- **Problem:** Direct Lambda function URLs complicate routing when running FastAPI with sub-routers (`/chat`, `/memory`, `/conversations`).
- **Solution:** Wrapped the FastAPI application using the `Mangum` ASGI adapter in `backend/lambda_handler.py` and mapped an HTTP API Gateway integration to forward all requests cleanly to the handler.

### E. Cross-Origin Resource Sharing (CORS)
- **Problem:** The Amplify frontend received `Cross-Origin Request Blocked` errors when attempting to communicate with the API Gateway endpoint.
- **Solution:** Configured API Gateway's CORS settings to explicitly allow the Amplify hosting domain (`https://main.dpe2sxkj21dci.amplifyapp.com`) along with required HTTP headers (`Authorization`, `Content-Type`).

### F. Amplify Monorepo Build Configuration
- **Problem:** AWS Amplify initially failed to locate Vite because the repository contains both `frontend/` and `backend/`. Additionally, build artifacts were misconfigured.
- **Solution:** Configured Amplify's App Root to `frontend/` and set `baseDirectory: .amplify-hosting` in `amplify.yml` to support TanStack Start/Nitro serverless build outputs.

### G. The Cognito Signup Confirmation UI Gap
- **Problem:** Initial production signups succeeded in Cognito, but the UI had no input form for email verification codes. Users attempting to log in immediately were blocked with `"User is not confirmed"`.
- **Solution:** Updated `frontend/src/routes/signup.tsx` to include an inline two-stage flow: submitting the form transitions the card into a Verification Code view with an explicit prompt to check the Spam/Junk folder. Added `confirmSignup` to `auth-context.tsx`, allowing users to confirm their account and transition smoothly to login.

---

## 📝 Solo Developer Log

### Thursday — AWS Foundation, Cloud Setup & First Roadblocks
* **The Hurdles:**
  - Kicked off the hackathon setting up an AWS serverless architecture with zero pre-existing templates.
  - Encountered the AWS account restriction on Amazon Bedrock foundation models (`ValidationException: Operation not allowed`).
  - Faced local Windows environment path conflicts and OneDrive directory sync locks when executing cloud triggers.
* **The Technical Growth:**
  - Configured AWS IAM least-privilege policies and credentials via Python scripts to bypass Windows path issues.
  - Studied DynamoDB single-table design principles to model memories, timeline events, and conversations in a single unified table (`LelantosTable`).
  - Decided to isolate the LLM invocation logic behind a clean service layer to allow an agile pivot if Bedrock access remained blocked.
* **The Strategic Breakthroughs:**
  - **Live Cloud DynamoDB Connection:** Successfully provisioned `LelantosTable` in `us-east-1` and verified writes and reads from Python scripts.
  - **Decoupled Architecture:** Built a local mock fallback engine (`DEMO_MODE`) so frontend and backend development could continue uninterrupted while remote cloud access was finalized.

---

### Friday — Memory Engine, Backend Architecture & Frontend Rebuild
* **The Hurdles:**
  - Needed to build a structured memory system with versioning, conflict detection, and provenance rather than a simple naive text store.
  - LLMs occasionally returned conversational filler or wrapped JSON in markdown fences, threatening to crash the parser.
  - Needed to construct an 11-page responsive, dark-mode voxel UI with zero TypeScript errors in a single development stretch.
* **The Technical Growth:**
  - Designed the **Fixed Key Vocabulary** system to eliminate key drift across turns.
  - Created a robust **JSON Repair Fallback** regex pipeline that strips code fences and corrects trailing syntax errors from LLM output.
  - Implemented the **Dual-Branch Concurrent Chat Pipeline**, running worker generation and memory extraction simultaneously using `asyncio` and thread pools.
* **The Strategic Breakthroughs:**
  - **Modular Service Layer:** Split the backend into 8 focused modules (`memory_engine`, `memory_extractor`, `conflict_detector`, `context_retriever`, `policy_engine`, `conversation_manager`, `auth`, `bedrock`).
  - **Production-Ready Frontend:** Built all 11 routes using TanStack Router with clean code-splitting, reaching a clean production build with 0 TypeScript errors.

---

### Saturday — AWS Integration, Deployment Debugging & Security
* **The Hurdles:**
  - Lambda packaging crashed when Windows-compiled native wheels (`pydantic_core`) landed on the Linux serverless environment.
  - Initial cloud API requests returned missing module exceptions (`requests`).
  - Browser requests were blocked by CORS headers between the Amplify domain and API Gateway.
* **The Technical Growth:**
  - Mastered Linux wheel cross-compilation for Lambda using `pip install --platform manylinux2014_x86_64 --only-binary=:all:`.
  - Implemented Cognito JWT verification in FastAPI with an in-memory cached JWKS public key rotation handler.
  - Wrote automated user isolation tests verifying that tenant separation is enforced cryptographically at the DynamoDB partition level.
* **The Strategic Breakthroughs:**
  - **Live Lambda Deployment:** Deployed the full FastAPI application via Mangum and API Gateway, achieving sub-second cloud responses.
  - **Amplify Build Success:** Resolved monorepo pathing and configured `.amplify-hosting` artifact deployment for TanStack Start.

---

### Sunday — Production Polish, Signup Verification & Final Validation
* **The Hurdles:**
  - End-to-end testing revealed that while Cognito created accounts, users were stuck in `UNCONFIRMED` status because there was no UI to submit email confirmation codes.
  - Users were confused when verification emails took 30–60 seconds or landed in spam folders.
* **The Technical Growth:**
  - Refactored `signup.tsx` to introduce a two-step state machine: Registration Form → Verification Code Form.
  - Added clear password policy indicators and proactive guidance advising users to check their Spam/Junk folders.
  - Implemented `confirmSignup()` in `auth-context.tsx` via the Amazon Cognito Identity SDK.
* **The Strategic Breakthroughs:**
  - **Complete End-to-End Live Validation:** Tested the entire user journey on the live Amplify and API Gateway deployment: Sign Up → Email Code Verification → Login → JWT Issue → Live Chat → Memory Extraction → DynamoDB Persistence.
  - **Clean GitHub Push:** Prepared the repository with strict `.gitignore` rules excluding all local Lambda packages, virtual environments, and temporary build files.

---

## 🎓 What I Learned Building Lelantos

1. **Cloud Architecture is an Application Feature:** Thinking about IAM roles, cold starts, and tenant partitioning cannot be postponed to "after the code is written." Designing for serverless forces clean modularity early.
2. **Provider Abstraction is Non-Negotiable:** Because our LLM service was decoupled behind a clean interface, pivoting from Bedrock to OpenRouter took minutes rather than requiring an architectural rewrite.
3. **Serverless Economics are Unbeatable for Hackathons:** Using AWS Lambda, DynamoDB on-demand, and Cognito free tiers meant our infrastructure costs during development were virtually ₹0.
4. **Structured Data Beats Vector Embeddings for Precise Context:** Unstructured RAG often retrieves conflicting text chunks. Categorizing context into typed, versioned objects (`DECISION`, `CONSTRAINT`) makes AI memory deterministic and explainable.
5. **LLM Output Must Be Treated as Untrusted Input:** Never assume a model will return clean JSON. Defensive parsing, markdown stripping, and fallback repair are mandatory in production pipelines.
6. **Provenance Creates Trust:** Allowing users to click *"Why did you remember this?"* and see the exact message quote turns AI memory from a creepy black box into an auditable tool.
7. **Local Success Does Not Equal Cloud Success:** Windows vs. Linux binary compilation in AWS Lambda was a harsh reminder that runtime environments must be mirrored during packaging.
8. **Tenant Isolation Must Be Structural:** Relying on application-level filtering for user data is dangerous. Enforcing isolation at the database partition key (`USER#<user_id>`) guarantees security at the storage layer.
9. **Production Polish is in the Edge Cases:** Building the confirmation code flow and adding a simple "Check Spam/Junk" message turned a frustrating login loop into a smooth onboarding experience.
10. **Solo Execution Demands Modularity:** When you're building frontend, backend, infrastructure, and documentation alone, strict separation of concerns is the only way to stay productive.

---

## 💰 Cost Analysis & Serverless Economics

Lelantos is built entirely on pay-per-use serverless primitives, ensuring near-zero baseline operating costs:

| Component | Pricing Model | Free Tier Allowance | Hackathon Cost Estimate |
| :--- | :--- | :--- | :--- |
| **AWS Lambda** | Requests & compute duration | 1,000,000 requests/month free | $0.00 |
| **Amazon DynamoDB** | Pay-per-request / On-demand | 25 GB storage + 25 RCU/WCU free | $0.00 |
| **Amazon Cognito** | Monthly Active Users (MAUs) | 50,000 MAUs free | $0.00 |
| **AWS Amplify** | Build minutes & hosting data transfer | 1,000 build minutes/month free | $0.00 |
| **Amazon API Gateway** | API calls | 1,000,000 HTTP requests/month free | $0.00 |
| **Amazon CloudWatch** | Ingestion & storage | 5 GB log data free | $0.00 |
| **OpenRouter LLM** | Pay-per-token | Free tier model options | < $1.00 |
| **Total** | — | — | **< ₹100 ($1.00)** |

*Note: In high-scale production, costs scale strictly with active usage. There are no idle EC2 instances or persistent container cluster fees.*

---

## 🔒 Security & Privacy

- **Zero Hardcoded Secrets:** All API keys, user pool IDs, and credentials are read from environment variables. Git history is strictly sanitized.
- **Cryptographic Verification:** Every incoming request to protected API routes is verified against Cognito's JSON Web Key Set (JWKS).
- **Tenant Partitioning:** DynamoDB enforces `PK = USER#<sub_uuid>`. Cross-tenant queries return `404 Not Found`.
- **Prompt Injection Defense:** Memory extraction inputs are wrapped in strict XML tags (`<user_message>`, `<existing_memories>`) and accompanied by explicit instructions forbidding the extraction of sensitive secrets, tokens, or credentials.
- **Right to Be Forgotten:** Users can soft-delete individual memories or execute a complete vault purge via `DELETE /memory`, wiping all user-partitioned items.

---

## 🗺️ Future Roadmap

- [ ] **Model Context Protocol (MCP) Server:** Native MCP endpoint allowing Claude Desktop, Cursor, and Windsurf to read and write context directly from Lelantos vaults.
- [ ] **Browser Extension:** Chrome/Brave extension that automatically captures decisions made in ChatGPT and Claude web chats.
- [ ] **Multi-Agent Memory Sharing:** Granular team-level vaults where specific project constraints are shared while personal preferences remain private.
- [ ] **Automated Memory Compaction:** Periodic background jobs that synthesize dozens of incremental edits into concise high-level summaries.
- [ ] **Local LLM Offline Mode:** Ollama integration for developers who want memory extraction and storage running 100% locally.

---

## 🇮🇳 Hackathon Context & Acknowledgments

This project was conceived, architected, and built from scratch by **Rayed Hasan** as a solo developer project for the **Bharat Builds Tour by WeMakeDevs** (2026).

Special thanks to:
- **Kunal Kushwaha** and the **WeMakeDevs** team for organizing the Bharat Builds Tour.
- The **AWS Community** for serverless documentation and architecture patterns.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

```text
Copyright (c) 2026 Rayed Hasan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<p align="center">
  <sub>Lelantos • Built with ☕, Python, React, and AWS Serverless • 2026</sub>
</p>
