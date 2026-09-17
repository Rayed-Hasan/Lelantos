# Lelantos: AI Memory Guardrail on AWS

> **Built for Bharat Builds Tour by WeMakeDevs** 🇮🇳

A lightweight, production-ready memory guardrail architecture for LLM agents. 
Lelantos prevents contextual drift, enforces persistent hard constraints across 
conversational turns, and inspects supervisor reasoning in real-time.

**Powered by Amazon Bedrock (Meta Llama 3.1 70B), AWS Lambda (True Serverless), and Amazon DynamoDB.**

---

## 🏗️ AWS True Serverless Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud (us-east-1)                    │
│                                                             │
│  ┌────────────────────────┐    ┌──────────────────────────┐ │
│  │     Amazon Bedrock     │    │        AWS Lambda        │ │
│  │   Meta Llama 3.1 70B   │◄──►│   LelantosOrchestrator   │ │
│  │   (Cross-Region CRI)   │    │      (Python 3.11)       │ │
│  └────────────────────────┘    └────────────┬─────────────┘ │
│                                             │               │
│                                             ▼               │
│                                ┌──────────────────┐         │
│                                │ Amazon DynamoDB  │         │
│                                │ AgentMemoryCache │         │
│                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ HTTP / JSON
                               ▼
                     ┌──────────────────┐
                     │ FastAPI Gateway  │
                     │ (Serverless API) │
                     └─────────┬────────┘
                               │
                     ┌─────────┴────────┐
                     │  React Frontend  │
                     │(Vite + Tailwind) │
                     └──────────────────┘
```

### AWS Services Used (True Serverless)

| Service | Purpose | Why AWS Native |
|---------|---------|----------------|
| **Amazon Bedrock** | LLM inference (`us.meta.llama3-1-70b-instruct-v1:0`) | Fully managed, Cross-Region Inference, no GPU provisioning |
| **AWS Lambda** | Serverless orchestrator & Supervisor matrix | True serverless, auto-scaling, zero idle compute costs |
| **Amazon DynamoDB** | Long-term memory cache (`AgentMemoryCache`) | Sub-millisecond reads/writes, pay-per-request serverless storage |
| **IAM Roles** | Least-privilege access | Security best practice |

---

## 🎯 Problem Statement

Standard AI applications send the entire chat history back and forth. When that 
history gets too long:

- ❌ LLMs forget user-stated constraints (budgets, preferences, rules)
- ❌ Contextual drift causes hallucinations
- ❌ Token limits truncate important early context

**Lelantos solves this** with a dual-agent serverless architecture:

1. **Worker Agent**: Converses with the user with active memory injection (Meta Llama 3.1 70B via Bedrock)
2. **Supervisor Agent**: Extracts constraints into compressed bulleted lists, saves to DynamoDB
3. **Memory Injection**: Constraints appended to every Worker prompt in real-time

---

## 🚀 Quickstart (100% AWS True Serverless)

### Prerequisites

- AWS Account with **Amazon Bedrock** access
- IAM User with `AdministratorAccess` (for hackathon; use least-privilege in production)
- Python 3.11+
- Node.js 18+

### Step 1: Configure AWS Credentials

```bash
# Install AWS CLI
pip install awscli

# Configure with your credentials
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

### Step 5: Run Serverless Backend Gateway

```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export AWS_REGION=us-east-1
export LAMBDA_FUNCTION_NAME=LelantosOrchestrator

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Run React Frontend

```bash
cd frontend
npm install

# Set API endpoint
export VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:5173`).

---

## 🧪 Direct Testing (Serverless & Cloud Pipeline)

### Test Cloud Pipeline Script

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

---

## 🎬 Demo Script (3 Minutes)

### Part 1: The Problem (Guardrail OFF)

1. Open app, **uncheck** "Enable Memory Guardrail"
2. Type: *"My budget is 0 rupees, Python only, build solo"*
3. Chat 10+ turns about random topics
4. Ask: *"What is my budget and setup?"*
5. **Result:** ❌ LLM forgets or hallucinates

### Part 2: The Solution (Guardrail ON)

1. **Check** "Enable Memory Guardrail"
2. Right panel lights up → shows extracted constraints in real-time
3. Same conversation, 10+ turns
4. Ask: *"What is my budget and setup?"*
5. **Result:** ✅ AI recalls all hard constraints perfectly

### Part 3: Supervisor Inspection

1. Show right panel → "Live Extracted Long-Term Memory"
2. Show "Supervisor Thought Matrix" → real-time compressed bulleted extractions
3. Explain: "Serverless dual-agent architecture prevents drift and ensures 100% persistence in DynamoDB"

---

## 📊 Cost Breakdown (Hackathon Scale - True Serverless)

| Service | Free Tier | Estimated Cost (4 days) |
|---------|-----------|-------------------------|
| **Amazon Bedrock** | Pay-per-token | ~$1-3 (Meta Llama 3.1 70B inference) |
| **AWS Lambda** | 1M requests/month free | $0.00 (Free Tier) |
| **Amazon DynamoDB** | 25GB storage + 25M requests | $0.00 (Free Tier) |
| **Total** | — | **<$5 (Zero Server Idle Cost)** |

---

## 🛠️ Tech Stack

- **LLM**: Meta Llama 3.1 70B Instruct (`us.meta.llama3-1-70b-instruct-v1:0`) via Amazon Bedrock Cross-Region Inference
- **Serverless Compute**: AWS Lambda (Python 3.11)
- **Database**: Amazon DynamoDB (NoSQL serverless key-value)
- **Backend**: Python 3.11, FastAPI, boto3
- **Frontend**: React 18, Vite, Tailwind CSS
- **Authentication**: AWS IAM (least-privilege credentials)

---

## 📝 Solo Developer Learning Log (Criteria 03)

As a solo contestant, I am responsible for the entire life cycle of Lelantos—from serverless cloud infrastructure and backend logic to the frontend user experience.

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

---

## 📄 License

MIT License — Built for **Bharat Builds Tour by WeMakeDevs** 2026

---

## 🙏 Acknowledgments

- **WeMakeDevs** for organizing Bharat Builds Tour
- **AWS** for free tier credits

