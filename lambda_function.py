import json
import boto3
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('AgentMemoryCache')


def invoke_bedrock(model_id, system_prompt, messages, max_tokens=1024):
    """Invoke Claude via Bedrock with proper error handling"""
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": messages,
        "temperature": 0.3,
        "top_p": 0.9
    })
    
    try:
        response = bedrock.invoke_model(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json"
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception as e:
        print(f"Bedrock invocation failed: {str(e)}")
        raise


def get_user_memory(user_id):
    """Retrieve compressed memory from DynamoDB"""
    try:
        response = table.get_item(Key={'user_id': user_id})
        return response.get('Item', {}).get('memory_constraints', [])
    except Exception as e:
        print(f"DynamoDB read failed: {str(e)}")
        return []


def update_user_memory(user_id, new_constraints):
    """Append new constraints to user's memory profile"""
    try:
        current = get_user_memory(user_id)
        # Deduplicate while preserving order
        updated = list({json.dumps(c, sort_keys=True): c 
                       for c in current + new_constraints}.values())
        
        table.put_item(Item={
            'user_id': user_id,
            'memory_constraints': updated,
            'last_updated': datetime.utcnow().isoformat()
        })
        return updated
    except Exception as e:
        print(f"DynamoDB write failed: {str(e)}")
        return current


def lambda_handler(event, context):
    """Main orchestrator Lambda function"""
    user_id = event.get('user_id', 'default')
    user_message = event['message']
    chat_history = event.get('chat_history', [])
    guardrail_enabled = event.get('guardrail_enabled', True)
    
    # Retrieve long-term memory
    memory_constraints = get_user_memory(user_id) if guardrail_enabled else []
    
    # Inject memory into Worker Agent prompt
    memory_injection = ""
    if memory_constraints:
        memory_injection = "\n\n[CRITICAL USER CONSTRAINTS - NEVER VIOLATE]:\n" + \
                          "\n".join([f"- {c}" for c in memory_constraints])
    
    # Worker Agent conversation (FIXED: nested content format)
    worker_messages = chat_history + [{"role": "user", "content": [{"text": user_message}]}]
    worker_system = f"""You are a helpful AI assistant. Be concise and accurate.{memory_injection}"""
    
    worker_response = invoke_bedrock(
        "anthropic.claude-3-5-sonnet-20241022-v2:0",
        worker_system,
        worker_messages
    )
    
    # Supervisor Agent extracts new constraints (only if guardrail enabled)
    new_constraints = []
    supervisor_thoughts = ""
    
    if guardrail_enabled and len(chat_history) >= 2:
        supervisor_system = """You are a Memory Extraction Specialist. 
        Analyze the last 5 conversation turns and extract ONLY:
        - Explicit user preferences (language, format, style)
        - Hard constraints (budgets, deadlines, technical requirements)
        - Identity facts (name, role, location if stated)
        - Rules the user wants remembered
        
        Output JSON array only: [{"fact": "string", "priority": "high|medium"}]
        If nothing new to extract, output []."""
        
        recent_turns = chat_history[-5:] + [{"role": "assistant", "content": [{"text": worker_response}]}]
        supervisor_thoughts = invoke_bedrock(
            "anthropic.claude-3-5-sonnet-20241022-v2:0",
            supervisor_system,
            recent_turns,
            max_tokens=512
        )
        
        try:
            new_constraints = json.loads(supervisor_thoughts)
            if new_constraints:
                update_user_memory(user_id, [c['fact'] for c in new_constraints])
        except:
            pass  # Supervisor failed to extract valid JSON
    
    return {
        'statusCode': 200,
        'body': {
            'response': worker_response,
            'memory_constraints': memory_constraints + [c['fact'] for c in new_constraints],
            'supervisor_thoughts': supervisor_thoughts,
            'new_constraints_extracted': new_constraints
        }
    }