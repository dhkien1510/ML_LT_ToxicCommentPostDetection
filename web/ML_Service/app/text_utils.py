import re
import torch
from underthesea import word_tokenize

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return text

def encode_text(text, vocab, max_len):
    tokens = word_tokenize(clean_text(text))
    ids = [vocab.get(tok, vocab["<unk>"]) for tok in tokens]
    ids = ids[:max_len]
    return ids + [0] * (max_len - len(ids))

def encode_batch(texts, vocab, max_len):
    encoded = [encode_text(t, vocab, max_len) for t in texts]
    return torch.tensor(encoded, dtype=torch.long)
