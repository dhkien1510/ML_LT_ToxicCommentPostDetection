from fastapi import FastAPI
from .predict import predict_comments

app = FastAPI(title="Toxic Comment ML Service")

@app.post("/predict")
def predict(payload: dict):
    texts = payload["comments"]
    
    return {
        "results": predict_comments(texts)
    }

#uvicorn app.main:app --reload