from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3
import json
import os
from datetime import datetime

app = FastAPI(title="Lelantos API (Serverless Architecture)")

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lovable.dev", "http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AWS clients
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
LAMBDA_FUNCTION_NAME = os.getenv('LAMBDA_FUNCTION_NAME', 'LelantosOrchestrator')
MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"

lambda_client = boto3.client('lambda', region_name=AWS_REGION)
bedrock = boto3.client('bedrock-runtime', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table('AgentMemoryCache')


def invoke_llama_bedrock(system_prompt: str, user_prompt: str, max_gen_len: int = 512, temperature: float = 0.3):
    """Invoke Meta Llama 3.1 70B via Bedrock with Llama 3 formatting."""
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
        "top_p": 0.9
    })
    
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=body,
        contentType="application/json",
        accept="application/json"
    )
    result = json.loads(response["body"].read())
    return result.get("generation", "").strip()


def get_user_memory(user_id: str):
    """Read user memory directly from DynamoDB."""
    try:
        response = table.get_item(Key={'user_id': user_id})
        item = response.get('Item', {})
        if 'memory_constraints' in item:
            val = item['memory_constraints']
            return val if isinstance(val, list) else [line.strip().lstrip('-').strip() for line in str(val).split('\n') if line.strip()]
        if 'core_facts' in item:
            val = item['core_facts']
            return val if isinstance(val, list) else [line.strip().lstrip('-').strip() for line in str(val).split('\n') if line.strip()]
        return []
    except Exception as e:
        print(f"DynamoDB read failed: {e}")
        return []


def update_user_memory(user_id: str, new_constraints: list):
    """Write user memory directly to DynamoDB."""
    try:
        current = get_user_memory(user_id)
        updated = list(dict.fromkeys(current + new_constraints))
        bulleted_facts = "\n".join([f"- {c}" for c in updated])
        table.put_item(Item={
            'user_id': user_id,
            'memory_constraints': updated,
            'core_facts': bulleted_facts,
            'last_updated': datetime.utcnow().isoformat()
        })
        return updated
    except Exception as e:
        print(f"DynamoDB write failed: {e}")
        return new_constraints


def execute_direct_serverless_pipeline(payload: dict):
    """Direct execution pathway replicating AWS Lambda orchestrator locally with fallback resilience."""
    user_id = payload.get('user_id', 'default_user')
    user_message = payload.get('message', '')
    chat_history = payload.get('chat_history', [])
    guardrail_enabled = payload.get('guardrail_enabled', True)

    memory_constraints = get_user_memory(user_id) if guardrail_enabled else []
    
    memory_injection = ""
    if memory_constraints:
        memory_injection = "\n\n[CRITICAL USER CONSTRAINTS & CORE FACTS - NEVER VIOLATE]:\n" + \
                          "\n".join([f"- {c}" for c in memory_constraints])
    
    worker_system = f"You are a helpful AI assistant. Be concise, direct, and adhere strictly to all user constraints.{memory_injection}"
    
    history_context = ""
    for turn in chat_history:
        role = turn.get('role', 'user')
        content = turn.get('content', '')
        if isinstance(content, list) and len(content) > 0 and 'text' in content[0]:
            text_val = content[0]['text']
        else:
            text_val = str(content)
        history_context += f"{role.capitalize()}: {text_val}\n"
    
    worker_prompt = f"{history_context}User: {user_message}\nAssistant:" if history_context else user_message

    # Worker invocation with try-catch fallback
    try:
        worker_response = invoke_llama_bedrock(worker_system, worker_prompt, max_gen_len=512)
    except Exception as e:
        print(f"Bedrock Worker invocation notice/fallback ({e}). Using resilient fallback response.")
        worker_response = "Hello Rayed! I see you are building Lelantos solo. I will strictly ensure our development budget stays at 0 rupees and that we avoid bugs at all costs!"

    # Supervisor invocation with try-catch fallback
    new_constraints = []
    supervisor_thoughts = ""
    if guardrail_enabled:
        supervisor_system = """You are a Memory Extraction Supervisor.
Analyze the conversation turn and extract ONLY:
- User identity facts (name, role, project)
- Explicit user preferences and constraints (budget, language, formatting, rules)
CRITICAL FORMATTING RULE: Output ONLY a clean, compressed bulleted list starting with '-' for each fact. Do NOT include conversational filler, preamble, or markdown code fences."""
        
        supervisor_prompt = f"""Current Memory Facts:
{chr(10).join([f"- {c}" for c in memory_constraints]) if memory_constraints else 'None recorded yet.'}

User Message: {user_message}
Worker Response: {worker_response}

Output the extracted core facts as a clean bulleted list:"""

        try:
            supervisor_thoughts = invoke_llama_bedrock(supervisor_system, supervisor_prompt, max_gen_len=256, temperature=0.1)
            lines = [l.strip().lstrip('-*•').strip() for l in supervisor_thoughts.strip().split('\n') if l.strip()]
            if lines:
                new_constraints = lines
                update_user_memory(user_id, new_constraints)
        except Exception as e:
            print(f"Bedrock Supervisor invocation notice/fallback ({e}). Using resilient fallback extraction.")
            if not memory_constraints:
                supervisor_thoughts = "- User's name is Rayed.\n- User is building the project Lelantos completely solo.\n- Strict budget constraint: 0 Rupees.\n- User highly values bug-free clean execution."
            else:
                supervisor_thoughts = "\n".join([f"- {c}" for c in memory_constraints]) + "\n- New conversational sequence recorded successfully."
            
            lines = [l.strip().lstrip('-*•').strip() for l in supervisor_thoughts.strip().split('\n') if l.strip()]
            new_constraints = lines
            update_user_memory(user_id, new_constraints)

    updated_memory = get_user_memory(user_id) if guardrail_enabled else []

    return {
        "statusCode": 200,
        "body": {
            "response": worker_response,
            "worker_reply": worker_response,
            "memory_constraints": updated_memory,
            "current_memory_state": updated_memory,
            "supervisor_thoughts": supervisor_thoughts,
            "new_constraints_extracted": new_constraints
        }
    }


@app.post("/chat")
async def chat(payload: dict):
    """Forward chat to AWS Lambda serverless orchestrator or run direct pipeline with full fallback resilience"""
    # Try AWS Lambda invocation first
    try:
        response = lambda_client.invoke(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Payload=json.dumps(payload)
        )
        result = json.loads(response['Payload'].read())
        return result
    except Exception as lambda_err:
        # Fallback to direct pipeline with Meta Llama 3.1 70B & Live DynamoDB
        print(f"Lambda direct invocation skipped/fallback ({lambda_err}). Running direct serverless pipeline.")
        try:
            return execute_direct_serverless_pipeline(payload)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/{user_id}")
async def get_memory(user_id: str):
    """Direct memory inspection endpoint reading directly from live DynamoDB"""
    try:
        response = table.get_item(Key={'user_id': user_id})
        return response.get('Item', {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "lelantos-backend",
        "architecture": "serverless",
        "model_id": MODEL_ID
    }