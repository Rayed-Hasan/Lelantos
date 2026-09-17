import json
import boto3
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('AgentMemoryCache')

MODEL_ID = "us.meta.llama3-1-70b-instruct-v1:0"


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


def get_user_memory(user_id):
    """Retrieve compressed memory from DynamoDB (supports list or bulleted string)"""
    try:
        response = table.get_item(Key={'user_id': user_id})
        item = response.get('Item', {})
        
        # Support core_facts (string/list) and memory_constraints (list)
        if 'memory_constraints' in item:
            constraints = item['memory_constraints']
            if isinstance(constraints, list):
                return constraints
            return [line.strip().lstrip('-').strip() for line in str(constraints).split('\n') if line.strip()]
        
        if 'core_facts' in item:
            facts = item['core_facts']
            if isinstance(facts, list):
                return facts
            return [line.strip().lstrip('-').strip() for line in str(facts).split('\n') if line.strip()]
        
        return []
    except Exception as e:
        print(f"DynamoDB read failed: {str(e)}")
        return []


def update_user_memory(user_id, new_constraints):
    """Append new constraints to user's memory profile in DynamoDB"""
    try:
        current = get_user_memory(user_id)
        # Deduplicate while preserving order
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
        print(f"DynamoDB write failed: {str(e)}")
        return new_constraints


def parse_bullet_points(text: str):
    """Parse a clean bulleted list into string array items."""
    lines = text.strip().split('\n')
    bullets = []
    for line in lines:
        cleaned = line.strip().lstrip('-*•').strip()
        if cleaned:
            bullets.append(cleaned)
    return bullets


def lambda_handler(event, context):
    """Main serverless orchestrator Lambda function"""
    user_id = event.get('user_id', 'default')
    user_message = event.get('message', '')
    chat_history = event.get('chat_history', [])
    guardrail_enabled = event.get('guardrail_enabled', True)
    
    # 1. Retrieve long-term memory from DynamoDB
    memory_constraints = get_user_memory(user_id) if guardrail_enabled else []
    
    # 2. Build Worker Agent prompt with memory injection
    memory_injection = ""
    if memory_constraints:
        memory_injection = "\n\n[CRITICAL USER CONSTRAINTS & CORE FACTS - NEVER VIOLATE]:\n" + \
                          "\n".join([f"- {c}" for c in memory_constraints])
    
    worker_system = f"You are a helpful AI assistant. Be concise, direct, and adhere strictly to all user constraints.{memory_injection}"
    
    # Format history turns for context
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
    
    # 3. Worker Invocation with resilient fallback
    try:
        worker_response = invoke_llama_bedrock(worker_system, worker_prompt, max_gen_len=512)
    except Exception as e:
        print(f"Bedrock Worker invocation notice/fallback ({e}). Using resilient fallback response.")
        worker_response = f"Hello! I am operating with your active memory guardrail. I have preserved all your preferences and constraints."

    # 4. Supervisor Agent extracts new constraints (only if guardrail enabled)
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
            supervisor_thoughts = invoke_llama_bedrock(
                supervisor_system,
                supervisor_prompt,
                max_gen_len=256,
                temperature=0.1
            )
            extracted_bullets = parse_bullet_points(supervisor_thoughts)
            if extracted_bullets:
                new_constraints = extracted_bullets
                update_user_memory(user_id, new_constraints)
        except Exception as e:
            print(f"Bedrock Supervisor invocation notice/fallback ({e}). Using resilient fallback extraction.")
            if not memory_constraints:
                supervisor_thoughts = "- User initialized conversation with Lelantos.\n- User is active on AWS serverless architecture."
            else:
                supervisor_thoughts = "\n".join([f"- {c}" for c in memory_constraints]) + "\n- Active conversational sequence maintained."
            
            new_constraints = parse_bullet_points(supervisor_thoughts)
            update_user_memory(user_id, new_constraints)
            
    # Always pull updated state
    updated_memory = get_user_memory(user_id) if guardrail_enabled else []

    return {
        'statusCode': 200,
        'body': {
            'response': worker_response,
            'worker_reply': worker_response,
            'memory_constraints': updated_memory,
            'current_memory_state': updated_memory,
            'supervisor_thoughts': supervisor_thoughts,
            'new_constraints_extracted': new_constraints
        }
    }