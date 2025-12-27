import torch
from .model_loader import load_model
from .text_utils import encode_batch

LABELS = ["clean", "offensive", "hate"]

def predict_comments(texts: list[str]):
    model, vocab, max_len = load_model()

    x = encode_batch(texts, vocab, max_len)

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)
        preds = torch.argmax(probs, dim=1)

    results = []
    for text, label_id, prob in zip(texts, preds, probs):
        results.append({
            "text": text,
            "label": LABELS[label_id.item()],
            "confidence": float(prob[label_id].item())
        })

    return results
