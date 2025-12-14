import torch
import torch.nn as nn
import pickle
import re
from underthesea import word_tokenize
import pandas as pd

# ================= CLEAN TEXT =================
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return text


# ================= MODEL =================
class BiLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim=100, hidden_dim=128):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            batch_first=True,
            bidirectional=True
        )
        self.fc = nn.Linear(hidden_dim * 2, 1)

    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        h = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(h)


# ================= LOAD PKL =================
with open("checkpoints/bi_lstm_toxic.pkl", "rb") as f:
    checkpoint = pickle.load(f)

vocab = checkpoint["vocab"]
max_len = checkpoint["max_len"]

model = BiLSTM(
    vocab_size=len(vocab),
    embed_dim=checkpoint["embed_dim"],
    hidden_dim=checkpoint["hidden_dim"]
)

model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

print("✅ Model loaded successfully")


# ================= PREDICT FUNCTION =================
def predict(text):
    text = clean_text(text)
    tokens = word_tokenize(text)

    ids = [vocab.get(tok, vocab["<unk>"]) for tok in tokens]
    ids = ids[:max_len] + [0] * (max_len - len(ids))

    x = torch.tensor(ids, dtype=torch.long).unsqueeze(0)

    with torch.no_grad():
        prob = torch.sigmoid(model(x)).item()

    return {
        "probability": prob,
        "label": int(prob > 0.5)
    }


# ================= TEST =================

# Load test data
df = pd.read_csv("../../data/vihsd/test.csv")
df["free_text"] = df["free_text"].fillna("")

correct = 0
total = len(df)

y_true = []
y_pred = []

for _, row in df.iterrows():
    text = row["free_text"]
    true_label = int(row["label_id"])

    res = predict(text)
    pred_label = res["label"]

    y_true.append(true_label)
    y_pred.append(pred_label)

    if pred_label == true_label:
        correct += 1

accuracy = correct / total
print(f"✅ Accuracy on test set: {accuracy:.4f}")