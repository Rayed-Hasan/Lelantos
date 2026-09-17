from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3
import json
import os

app = FastAPI(title="Lelantos API")

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lovable.dev", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Lambda client
lambda_client = boto3.client('lambda', region_name=os.getenv('AWS_REGION', 'us-east-1'))
LAMBDA_FUNCTION_NAME = os.getenv('LAMBDA_FUNCTION_NAME', 'LelantosOrchestrator')

@app.post("/chat")
async def chat(payload: dict):
    """Forward chat to Lambda orchestrator"""
    try:
        response = lambda_client.invoke(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Payload=json.dumps(payload)
        )
        result = json.loads(response['Payload'].read())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/{user_id}")
async def get_memory(user_id: str):
    """Direct memory inspection endpoint"""
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
    table = dynamodb.Table('AgentMemoryCache')
    response = table.get_item(Key={'user_id': user_id})
    return response.get('Item', {})

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "lelantos-backend"}