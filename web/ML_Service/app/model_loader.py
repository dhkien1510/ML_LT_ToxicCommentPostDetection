import pickle
import torch
from pathlib import Path
from .model import BiLSTM

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "checkpoints" / "bi_lstm_toxic.pkl"

_model = None
_vocab = None
_max_len = None

def load_model():
    global _model, _vocab, _max_len

    if _model is not None:
        return _model, _vocab, _max_len

    with open(MODEL_PATH, "rb") as f:
        checkpoint = pickle.load(f)

    _vocab = checkpoint["vocab"]
    _max_len = checkpoint["max_len"]

    _model = BiLSTM(vocab_size=len(_vocab))
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.eval()

    return _model, _vocab, _max_len
