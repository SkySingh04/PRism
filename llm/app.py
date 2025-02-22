from fastapi import FastAPI
import requests

app = FastAPI()

OLLAMA_URL = "http://localhost:11434/api/generate"

@app.post("/generate")
async def generate_response(prompt: str):
    payload = {
        "model": "llama3",
        "prompt": prompt
    }
    response = requests.post(OLLAMA_URL, json=payload)
    return response.json()
