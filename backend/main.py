from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import boto3
import json
import os

app = FastAPI(title="Mnemosyne API")

# Enable CORS for Lovable.dev or localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lovable.dev", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Lambda client
lambda_client = boto3.client('lambda', region_name='us-east-1')

@app.post("/chat")
async def chat(payload: dict):
    """Forward chat to Lambda orchestrator"""
    try:
        response = lambda_client.invoke(
            FunctionName='MnemosyneOrchestrator',
            Payload=json.dumps(payload)
        )
        result = json.loads(response['Payload'].read())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/{user_id}")
async def get_memory(user_id: str):
    """Direct memory inspection endpoint"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('AgentMemoryCache')
    response = table.get_item(Key={'user_id': user_id})
    return response.get('Item', {})

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "mnemosyne-backend"}