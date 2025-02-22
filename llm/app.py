from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json

app = FastAPI()

# LLM API URL (assuming Ollama or similar running locally)
LLM_URL = "http://localhost:11434/api/generate"

# Define request model
class ReviewRequest(BaseModel):
    diff: str  # Full Git diff sent from frontend
    rules: list[str]  # List of coding rules to check against

# Function to format prompt for LLM

def make_prompt(diff: str, rules: list[str]) -> str:
    prompt = """
    You are a code review assistant. Analyze the given Git diff and check if it violates any of the provided coding rules.
    
    Rules:
    {}
    
    Diff:
    ```
    {}
    ```
    
    Provide feedback for each violation in JSON format:
    [
        {{"file": "filename.go", "line": 12, "rule": "Rule description", "comment": "Detailed feedback"}}
    ]
    """.format("\n".join(rules), diff)
    return prompt

# Function to send request to LLM
def send_to_llm(prompt: str):
    payload = {"model": "gemma", "prompt": prompt, "response_format": "json", "stream": False}
    headers = {"Content-Type": "application/json"}
    response = requests.post(LLM_URL, json=payload, headers=headers)
    
    if response.status_code == 200:
        try:
            return response.json().get("response", "[]")  # Default empty JSON list
        except json.JSONDecodeError:
            return "[]"
    else:
        raise HTTPException(status_code=500, detail="LLM request failed")

# API route for code review
@app.post("/review")
async def review_code(request: ReviewRequest):
    prompt = make_prompt(request.diff, request.rules)
    review_result = send_to_llm(prompt)
    return json.loads(review_result)  # Return structured JSON feedback
