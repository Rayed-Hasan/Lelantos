# Lelantos: AI Memory Guardrail on AWS

> **Built for Bharat Builds Tour by WeMakeDevs** 🇮🇳

A lightweight, production-ready memory guardrail architecture for LLM agents. 
Lelantos prevents contextual drift, enforces persistent hard constraints across 
conversational turns, and inspects supervisor reasoning in real-time.

**Powered by Amazon Bedrock, AWS Lambda, and Amazon DynamoDB.**

---

## 🏗️ AWS Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud (us-east-1)                    │
│                                                             │
│  ┌──────────────────┐          ┌──────────────────────────┐ │
│  │  Amazon Bedrock  │          │        AWS Lambda        │ │
│  │   Claude 3.5     │◄────────►│   LelantosOrchestrator   │ │
│  │     Sonnet       │          │      (Python 3.11)       │ │
│  └──────────────────┘          └────────────┬─────────────┘ │
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
                     │  (Local / EC2)   │
                     └─────────┬────────┘
                               │
                     ┌─────────┴────────┐
                     │  React Frontend  │
                     │(Vite + Tailwind) │
                     └──────────────────┘
```

### AWS Services Used

| Service | Purpose | Why AWS Native |
|---------|---------|----------------|
| **Amazon Bedrock** | LLM inference (Claude 3.5 Sonnet) | Fully managed, no GPU provisioning |
| **AWS Lambda** | Orchestrator function | Serverless, auto-scaling, pay-per-invocation |
| **Amazon DynamoDB** | Long-term memory cache | Sub-millisecond reads, 99.99% availability |
| **IAM Roles** | Least-privilege access | Security best practice |

---

## 🎯 Problem Statement

Standard AI applications send the entire chat history back and forth. When that 
history gets too long:

- ❌ LLMs forget user-stated constraints (budgets, preferences, rules)
- ❌ Contextual drift causes hallucinations
- ❌ Token limits truncate important early context

**Lelantos solves this** with a dual-agent architecture:

1. **Worker Agent**: Converses with the user (Claude 3.5 Sonnet via Bedrock)
2. **Supervisor Agent**: Extracts constraints, saves to DynamoDB
3. **Memory Injection**: Constraints appended to every Worker prompt

---

## 🚀 Quickstart (100% AWS-Native)

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

### Step 2: Enable Claude 3.5 Sonnet in Bedrock

1. Go to **AWS Console** → **Amazon Bedrock**
2. Click **Model Access** (left sidebar)
3. Click **Manage Model Access**
4. Check **Anthropic Claude 3.5 Sonnet** → **Request Model Access** (instant)

### Step 3: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name AgentMemoryCache \
  --attribute-definitions AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=user_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 4: Deploy Lambda Function

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

### Step 5: Run FastAPI Backend (Local or EC2)

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

Open `http://localhost:3000`.

---

## 🧪 Local Testing (No Frontend)

### Test Lambda Invocation Directly

```bash
aws lambda invoke \
  --function-name LelantosOrchestrator \
  --payload '{
    "user_id": "test_user",
    "message": "My budget is $500, Python only, no emojis",
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
  "worker_reply": "Understood! I'll keep your budget of $500...",
  "current_memory_state": [
    "Budget: $500",
    "Language: Python only",
    "Constraint: No emojis"
  ]
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
2. Type: *"My budget is $500, Python only, no emojis"*
3. Chat 10+ turns about random topics
4. Ask: *"What's my budget?"*
5. **Result:** ❌ AI forgets or hallucinates

### Part 2: The Solution (Guardrail ON)

1. **Check** "Enable Memory Guardrail"
2. Right panel lights up → shows extracted constraints
3. Same conversation, 10+ turns
4. Ask: *"What's my budget?"*
5. **Result:** ✅ AI recalls perfectly

### Part 3: Supervisor Inspection

1. Show right panel → "Live Extracted Long-Term Memory"
2. Show "Supervisor Thought Matrix" → real-time extraction logs
3. Explain: "Dual-agent architecture prevents drift"

---

## 📊 Cost Breakdown (Hackathon Scale)

| Service | Free Tier | Estimated Cost (4 days) |
|---------|-----------|-------------------------|
| **Amazon Bedrock** | N/A | ~$2-5 (1000 messages × $0.003/1K tokens) |
| **AWS Lambda** | 1M requests/month | $0.00 (free tier covers it) |
| **Amazon DynamoDB** | 25GB storage + 25M requests | $0.00 (free tier covers it) |
| **Total** | — | **<$5** |

---

## 🛠️ Tech Stack

- **LLM**: Anthropic Claude 3.5 Sonnet via Amazon Bedrock (`bedrock.converse()` API)
- **Backend**: Python 3.11, FastAPI, boto3
- **Frontend**: React 18, Vite, Tailwind CSS
- **Database**: Amazon DynamoDB (NoSQL, key-value)
- **Compute**: AWS Lambda (serverless)
- **Authentication**: AWS IAM (access keys)

---

## 📄 License

MIT License — Built for **Bharat Builds Tour by WeMakeDevs** 2026

---

## 🙏 Acknowledgments

- **WeMakeDevs** for organizing Bharat Builds Tour
- **AWS** for free tier credits
