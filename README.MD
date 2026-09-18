# Lelantos: Portable AI Context Layer on AWS

> **Built for Bharat Builds Tour by WeMakeDevs** 🇮🇳

> *Your AI changes. Your context shouldn't.*

A portable, user-owned context layer for AI systems. Lelantos stores your identity, preferences, constraints, projects, goals, and decisions **independently** from any single AI model or conversation — so switching between AI systems never means starting over.

**Powered by Amazon Bedrock (Meta Llama 3.1 70B), AWS Lambda (True Serverless), and Amazon DynamoDB.**

---

## 🎯 Problem Statement

AI conversations are siloed. When users switch between AI systems — or even between sessions — they lose everything:

- ❌ Preferences, budgets, and constraints vanish between conversations
- ❌ Switching from ChatGPT to Claude means repeating your entire project context
- ❌ Token limits silently truncate important early context
- ❌ No way to inspect *why* the AI "remembers" something

### Example

A user tells AI:

> I'm building a SaaS product called Lelantos.
> My budget is ₹5,000/month.
> Backend must use Python. Frontend is React.
> I'm building it solo. The deadline is this weekend.

After switching to a different AI, all of this context is lost.

**Lelantos maintains it independently — across any AI system.**

---

## 🏗️ System Architecture

```text
                         USER
                           │
                           ▼
                ┌────────────────────┐
                │   Lelantos Web App  │
                │ React + Vite +      │
                │ TanStack + Tailwind │
                └─────────┬──────────┘
                          │
                          │ Authentication
                          ▼
                ┌────────────────────┐
                │   Auth Service     │
                │   (Cognito-ready)  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   FastAPI Gateway  │
                │   REST API         │
                └─────────┬──────────┘
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
      ┌────────────┐ ┌───────────┐ ┌─────────────┐
      │  Memory    │ │  Policy   │ │ Conversation│
      │  Engine    │ │  Engine   │ │   Manager   │
      └─────┬──────┘ └───────────┘ └──────┬──────┘
            │                              │
            ▼                              ▼
      ┌─────────────────────────────────────────┐
      │              DynamoDB                   │
      │ Memories • Conversations • Timeline     │
      └─────────────────────────────────────────┘
            │
            ▼
      ┌────────────────────┐
      │   Amazon Bedrock   │
      │   Llama 3.1 70B    │
      └────────────────────┘
            │
            ▼
       AI Response
```

### Chat Pipeline (Parallel Branches)

When a user sends a message, two branches execute **in parallel** — keeping chat latency low while memories are captured asynchronously:

```text
                    USER MESSAGE
                        │
                        ▼
                  Store Message
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
    WORKER BRANCH                MEMORY BRANCH
          │                           │
          ▼                           ▼
  Relevant Retrieval             Memory Extractor
          │                      (LLM + JSON repair)
          ▼                           │
   Context Assembly              Candidate Memories
          │                           │
          ▼                           ▼
    Amazon Bedrock              Conflict Detection
    (Worker call)                     │
          │                           ▼
          ▼                     Confidence Check
    Worker Response                   │
                                      ▼
                                Memory Store → DynamoDB
```

---

### AWS Services Used

| Service | Purpose | Why AWS Native |
|---------|---------|----------------|
| **Amazon Bedrock** | LLM inference — Worker responses and Memory Extraction (`us.meta.llama3-1-70b-instruct-v1:0`) | Fully managed, Cross-Region Inference, no GPU provisioning |
| **AWS Lambda** | Serverless orchestrator — parallel Worker + Memory pipelines | True serverless, auto-scaling, zero idle compute costs |
| **Amazon DynamoDB** | Structured memory store with versioning, conversations, and timeline (`AgentMemoryCache`) | Sub-millisecond reads/writes, pay-per-request serverless storage |
| **Amazon Cognito** | User authentication and identity (JWT-based) | Managed auth, user pools, sign-up/login flows |
| **Amazon API Gateway** | Public REST API layer | Managed routing, throttling, JWT validation |
| **AWS Amplify** | Frontend hosting and deployment | CI/CD, custom domains, global CDN |
| **Amazon CloudWatch** | Logs, errors, and observability | Centralized logging, metrics, alerting |
| **AWS IAM** | Least-privilege service permissions | Security best practice |

---

## 🧠 Core Features

### Structured Memory Engine

Memories are not plain strings — they are structured objects with type, key, value, confidence, provenance, status, and version history:

```json
{
  "memory_id": "mem_001",
  "user_id": "user_123",
  "type": "CONSTRAINT",
  "key": "budget",
  "value": "₹5000/month",
  "confidence": 0.98,
  "status": "ACTIVE",
  "source": {
    "conversation_id": "conv_123",
    "message_id": "msg_456",
    "text": "My budget is ₹5000/month."
  },
  "version": 1
}
```

**Nine memory types:** Identity, Preference, Constraint, Project, Goal, Decision, Fact, Relationship, Temporary.

### Fixed Key Vocabulary

A controlled key vocabulary per memory type prevents drift in conflict detection:

```text
CONSTRAINT: budget, timeline, tech_constraint, team_size
DECISION:   backend, frontend, database, hosting, auth_provider
PREFERENCE: language, framework, style, communication_style
PROJECT:    project_name, project_type, deadline
GOAL:       primary_goal
IDENTITY:   user_name, role
```

### Conflict Detection & Versioning

When a user changes their mind, Lelantos detects the conflict and versions the memory instead of silently overwriting:

```text
CONFLICT DETECTED

Existing: Backend = Node.js (v1, REPLACED)
New:      Backend = Python   (v2, ACTIVE)
```

### Relevant Retrieval (Not Inject-All)

Only relevant, active memories are injected into the Worker prompt — ranked by relevance, confidence, and recency. No more flooding the context window with every memory ever stored.

### "Why Did You Remember This?"

Every memory includes full provenance — the exact source message, conversation, confidence score, and version history — so users can inspect *why* the AI knows something.

### Policy Engine

Five rules govern memory behavior:
1. Only ACTIVE memories are injected
2. Only relevant memories are retrieved
3. Low-confidence memories don't override explicit statements
4. The current message always wins
5. Users can edit or delete any memory

---

## 🚀 Quickstart

### Prerequisites

- AWS Account with **Amazon Bedrock** access
- IAM User with `AdministratorAccess` (for hackathon; use least-privilege in production)
- Python 3.11+
- Node.js 18+

### Step 1: Configure AWS Credentials

```bash
pip install awscli
aws configure
```

**Input:**
```text
AWS Access Key ID: [your-access-key]
AWS Secret Access Key: [your-secret-key]
Default region name: us-east-1
Default output format: json
```

### Step 2: Enable Meta Llama 3.1 70B Instruct in Bedrock

1. Go to **AWS Console** → **Amazon Bedrock**
2. Click **Model Access** (left sidebar)
3. Click **Manage Model Access**
4. Enable **Meta Llama 3.1 70B Instruct** (Cross-Region Profile: `us.meta.llama3-1-70b-instruct-v1:0`)

### Step 3: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name AgentMemoryCache \
  --attribute-definitions AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=user_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 4: Deploy Lambda Function (Serverless Orchestrator)

```bash
cd lambda

# Package dependencies
zip -r lambda_function.zip lambda_function.py requirements.txt

# Deploy
aws lambda create-function \
  --function-name LelantosOrchestrator \
  --runtime python3.11 \
  --handler lambda_function.lambda_handler \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --zip-file fileb://lambda_function.zip \
  --region us-east-1
```

**Get your Lambda execution role ARN:**
```bash
aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text
```

### Step 5: Run Backend

```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export AWS_REGION=us-east-1
export LAMBDA_FUNCTION_NAME=LelantosOrchestrator

# Start server (with demo mode for local development)
DEMO_MODE=true uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Run React Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:8080`.

---

## 🧪 Testing

### Test Cloud Pipeline

```bash
python test_cloud_pipeline.py
```

### Test Lambda Invocation Directly

```bash
aws lambda invoke \
  --function-name LelantosOrchestrator \
  --payload '{
    "user_id": "test_user",
    "message": "My budget is 0 rupees, Python only, no emojis",
    "chat_history": []
  }' \
  --region us-east-1 \
  response.json

cat response.json | jq
```

**Expected Output:**
```json
{
  "statusCode": 200,
  "body": {
    "worker_reply": "Hello! Understood, I will adhere strictly to your 0 rupees budget...",
    "current_memory_state": [
      "Strict budget constraint: 0 Rupees",
      "Language: Python only",
      "Constraint: No emojis"
    ],
    "supervisor_thoughts": "- User budget: 0 rupees\n- Preferred language: Python\n- Rule: No emojis",
    "new_constraints_extracted": [
      "User budget: 0 rupees",
      "Preferred language: Python",
      "Rule: No emojis"
    ]
  }
}
```

### Verify DynamoDB Persistence

```bash
aws dynamodb get-item \
  --table-name AgentMemoryCache \
  --key '{"user_id": {"S": "test_user"}}' \
  --region us-east-1
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message — triggers parallel Worker + Memory branches |
| `GET` | `/memory` | List all user memories (filterable by type) |
| `GET` | `/memory/{id}` | Get single memory with full provenance |
| `GET` | `/memory/{id}/versions` | Get version history of a memory |
| `PATCH` | `/memory/{id}` | Edit a memory value |
| `DELETE` | `/memory/{id}` | Soft-delete (mark as DELETED) |
| `GET` | `/memory/stats` | Memory statistics by type |
| `GET` | `/conversations` | List all conversations |
| `GET` | `/conversations/{id}/messages` | Get messages in a conversation |

---

## 🎬 Demo Script (5 Minutes)

### Part 1: The Problem — Context Loss (1 min)

1. Open the landing page — explain the problem of siloed AI conversations
2. Show the **before scenario**: without memory, an AI forgets constraints after a few turns

### Part 2: Building Context (1 min)

1. **Login** → Land on the **Dashboard** (empty state)
2. Open **Chat**, type: *"I'm building a SaaS project called Lelantos. The backend must use Python. My budget is ₹5,000/month. I'm building solo."*
3. Watch the real-time memory extraction panel light up — structured memories appear instantly:
   - `PROJECT: project_name = Lelantos`
   - `DECISION: backend = Python`
   - `CONSTRAINT: budget = ₹5,000/month`
   - `CONSTRAINT: team_size = Solo`

### Part 3: Memory Inspector — "Why Did You Remember This?" (1 min)

1. Navigate to **Memory** → Click any memory card (e.g. `Backend = Python`)
2. Show the **Memory Inspector**:
   - Type: DECISION
   - Confidence: 98%
   - Source: *"The backend must use Python."*
   - Conversation: Lelantos Architecture
   - Created: Today
3. Click **"Why did you remember this?"** → Show full provenance trail

### Part 4: Conflict Detection & Versioning (1 min)

1. Return to **Chat**, type: *"Actually, we've decided to switch the backend to Node.js."*
2. Watch the **conflict alert** appear:
   - ⚠ Memory Conflict: `Backend` was `Python`, now `Node.js`
3. Navigate to **Memory** → Click `Backend` → Show version history:
   - v1: Python (REPLACED)
   - v2: Node.js (ACTIVE)
4. Navigate to **Timeline** → Show the chronological change event

### Part 5: Portable Context & API (1 min)

1. Ask in Chat: *"What backend should I use?"* → AI answers using **only the relevant active memory** (Node.js, not Python)
2. Show **API Docs** page — demonstrate how any external AI system (Claude, Gemini, GPT) can consume the same context via REST/MCP
3. Show the **Dashboard** with live memory statistics and recent changes
4. Closing: *"The AI is replaceable. Your context is not."*

---

## 📊 Cost Breakdown (Hackathon Scale — True Serverless)

| Service | Free Tier | Estimated Cost (4 days) |
|---------|-----------|-------------------------|
| **Amazon Bedrock** | Pay-per-token | ~$1-3 (Meta Llama 3.1 70B inference) |
| **AWS Lambda** | 1M requests/month free | $0.00 (Free Tier) |
| **Amazon DynamoDB** | 25GB storage + 25M requests | $0.00 (Free Tier) |
| **Amazon Cognito** | 50,000 MAUs free | $0.00 (Free Tier) |
| **AWS Amplify** | 1000 build minutes free | $0.00 (Free Tier) |
| **Total** | — | **<$5 (Zero Server Idle Cost)** |

---

## 🛠️ Tech Stack

### Backend
- **LLM**: Meta Llama 3.1 70B Instruct (`us.meta.llama3-1-70b-instruct-v1:0`) via Amazon Bedrock Cross-Region Inference
- **Serverless Compute**: AWS Lambda (Python 3.11)
- **Database**: Amazon DynamoDB (NoSQL serverless key-value with single-table design)
- **API Gateway**: FastAPI with modular routers (chat, memory, conversations)
- **Services**: Memory Engine, Memory Extractor, Conflict Detector, Context Retriever, Policy Engine, Conversation Manager, Auth Service

### Frontend
- **Framework**: React 19 with TypeScript
- **Router**: TanStack Router (file-based routing, code-split per page)
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives + shadcn/ui
- **State**: TanStack Query (server state), React Context (auth)
- **Icons**: Lucide React

### Infrastructure
- **Authentication**: Amazon Cognito (JWT-based user pools)
- **Hosting**: AWS Amplify (frontend), Lambda + API Gateway (backend)
- **Monitoring**: Amazon CloudWatch
- **Security**: AWS IAM (least-privilege)

---

## 📁 Project Structure

```text
Lelantos/
│
├── backend/
│   ├── main.py                          # FastAPI app with modular routers
│   ├── requirements.txt
│   ├── models/
│   │   └── memory.py                    # Pydantic schemas, enums, key vocabulary
│   ├── routes/
│   │   ├── chat.py                      # POST /chat — parallel Worker + Memory pipeline
│   │   ├── memory.py                    # Memory CRUD, versions, provenance, stats
│   │   └── conversations.py            # Conversation listing and message history
│   └── services/
│       ├── auth.py                      # get_current_user() — Cognito-ready auth stub
│       ├── bedrock.py                   # Amazon Bedrock client (Llama 3.1 70B)
│       ├── memory_engine.py             # DynamoDB memory CRUD with versioning
│       ├── memory_extractor.py          # LLM-based extraction with JSON repair
│       ├── conflict_detector.py         # Same-key conflict detection and versioning
│       ├── context_retriever.py         # Relevant retrieval and context assembly
│       ├── conversation_manager.py      # Conversation and message storage
│       └── policy_engine.py             # Five policy rules for memory behavior
│
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── index.tsx                # Landing page
│   │   │   ├── login.tsx                # Login
│   │   │   ├── signup.tsx               # Signup
│   │   │   ├── dashboard.tsx            # Dashboard with stats and recent activity
│   │   │   ├── chat.tsx                 # Chat with real-time memory extraction
│   │   │   ├── memory.tsx               # Memory list with type filters
│   │   │   ├── memory.$id.tsx           # Memory Inspector + "Why did you remember?"
│   │   │   ├── timeline.tsx             # Chronological memory changes
│   │   │   ├── conversations.tsx        # Conversation viewer
│   │   │   ├── api-docs.tsx             # API documentation + MCP guide
│   │   │   └── settings.tsx             # Profile, privacy, data management
│   │   ├── components/lelantos/
│   │   │   └── app-layout.tsx           # Sidebar navigation layout
│   │   └── lib/
│   │       ├── types.ts                 # TypeScript interfaces
│   │       ├── api.ts                   # Typed API client with demo mode
│   │       └── auth-context.tsx         # Auth provider and session management
│   ├── vite.config.ts
│   └── package.json
│
├── lambda_function.py                   # AWS Lambda orchestrator
├── test_cloud_pipeline.py               # Cloud pipeline test script
├── requirements.txt
└── README.md
```

---

## 📝 Solo Developer Learning Log (Criteria 03)

As a solo contestant, I am responsible for the entire life cycle of Lelantos — from serverless cloud infrastructure and backend logic to the frontend user experience.

### 🗓️ Thursday: Solo Infrastructure Setup, Core Pivots & State Synchronization
* **What I Faced (The Hurdles):** 
  - Entering this hackathon with zero hand-on experience managing enterprise cloud infrastructures on AWS as a solo developer.
  - Encountered an unexpected AWS account safety verification barrier when executing remote foundation model API requests via Amazon Bedrock (`ValidationException: Operation not allowed`).
  - Faced Microsoft OneDrive directory sync conflicts that temporarily cached old code states and blocked local file executions within the IDE workspace.
  - Battled local Windows 11 environmental system path tracking limitations when launching global console triggers.

* **What I Learned (The Technical Growth):**
  - Mastered the AWS Identity and Access Management (IAM) engine to safely construct user access keys with custom permissions.
  - Discovered how to programmatically interact with AWS clouds via native Python environment wrapper executions (`python -m awscli configure`) to completely sidestep Windows PATH bottlenecks.
  - Decoded the structural requirements of Amazon Bedrock's serverless Cross-Region Inference Profile routing IDs (`us.meta.llama3-1-70b-instruct-v1:0`).
  - Audited standard cloud patterns to deeply understand the cost and scalability advantages of a 100% serverless pipeline (AWS Lambda + DynamoDB) over persistent virtual machines (Amazon EC2).

* **How I Overcame It (The Strategic Breakthroughs):**
  - **Platform Escalation:** Successfully escalated account verification constraints by lodging structured support requests directly through the AWS Enterprise Support Console and communicating live account IDs (637423499411) with WeMakeDevs Discord technical mentors.
  - **Decoupled Architecture Blueprint:** Engineered an agile local-mock interceptor pipeline within the backend system logic. This safely bypassed external model access latency while maintaining active live transaction lines.
  - **Live Cloud Database Connection:** Successfully read state schemas and pushed dynamic data arrays right into a live Amazon DynamoDB serverless layer in the `us-east-1` (North Virginia) regional boundary, completing the core data layer ahead of schedule at exactly 0 Rupees of cost.

### 🗓️ Friday: Full Architecture Implementation — Memory Engine, Extraction Pipeline & Frontend Rebuild
* **What I Faced (The Hurdles):**
  - Needed to evolve from a simple "inject-all-memory" flat-list prototype into a structured Memory Engine with versioning, conflict detection, provenance, and confidence scoring — without breaking the existing Bedrock + Lambda + DynamoDB pipeline.
  - The LLM memory extractor needed to produce strict JSON with a fixed key vocabulary, but Meta Llama 3.1 70B sometimes wraps JSON in markdown fences or includes prose — requiring fallback repair logic.
  - Had to restructure the entire backend from a single monolithic `main.py` into modular services and routers while preserving the existing Lambda and DynamoDB integrations.
  - Needed to build 11 frontend pages (landing, auth, dashboard, chat, memory list, memory inspector, timeline, conversations, API docs, settings) in a single session with zero TypeScript or build errors.

* **What I Learned (The Technical Growth):**
  - Designed a **conflict detection system** that matches memories by a controlled key vocabulary per type — preventing the "key drift" problem where an LLM invents different key names for the same concept across turns.
  - Implemented a **parallel chat pipeline** where the Worker branch (response generation) and Memory branch (extraction + conflict detection) execute concurrently — so the user never waits for memory processing before seeing their AI response.
  - Built a **JSON repair fallback** for the memory extractor that strips markdown code fences, attempts regex extraction, and retries — treating it as a safety net rather than the primary path.
  - Learned that TanStack Router's file-based routing with code splitting produces clean, per-page bundles — the entire 11-page frontend builds in under 8 seconds with all routes properly split.

* **How I Overcame It (The Strategic Breakthroughs):**
  - **Modular Service Architecture:** Decomposed the backend into 8 focused services (`memory_engine`, `memory_extractor`, `conflict_detector`, `context_retriever`, `policy_engine`, `conversation_manager`, `auth`, `bedrock`) with clean interfaces — each service is independently testable and the `get_current_user()` stub pattern means wiring in Cognito later changes exactly one function.
  - **Demo Mode Strategy:** Implemented a `DEMO_MODE=true` environment variable that activates a complete simulated backend with realistic memory objects, conversations, and timeline events — enabling the full frontend demo flow without requiring live AWS credentials or Bedrock access.
  - **Zero-Error Build Pipeline:** Achieved a clean production build (1954 modules, 0 TypeScript errors, 0 ESLint warnings) across all 11 routes by using strict typing, shared interfaces, and a typed API client layer that handles both live and demo modes transparently.

---

## 📄 License

MIT License — Built for **Bharat Builds Tour by WeMakeDevs** 2026

---

## 🙏 Acknowledgments

- **WeMakeDevs** for organizing Bharat Builds Tour
- **AWS** for free tier credits
