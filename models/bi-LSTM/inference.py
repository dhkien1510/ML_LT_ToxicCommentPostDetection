import torch
import torch.nn as nn
import pickle
import re
from underthesea import word_tokenize
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

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
        self.fc = nn.Linear(hidden_dim * 2, 3)   # ⚠️ 3 lớp

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

print("Model loaded successfully")


# ================= PREDICT FUNCTION =================
def predict(text):
    text = clean_text(text)
    tokens = word_tokenize(text)

    ids = [vocab.get(tok, vocab["<unk>"]) for tok in tokens]
    ids = ids[:max_len] + [0] * (max_len - len(ids))

    x = torch.tensor(ids, dtype=torch.long).unsqueeze(0)

    with torch.no_grad():
        logits = model(x)                    # (1, 3)
        probs = torch.softmax(logits, dim=1)
        label = torch.argmax(probs, dim=1).item()

    return {
        "probs": probs.squeeze(0).tolist(),
        "label": label
    }

# ===============================
# Load test data
# ===============================
df = pd.read_csv("../../data/vihsd/test.csv")
df["free_text"] = df["free_text"].fillna("")

y_true = []
y_pred = []

# ===============================
# Predict on test set
# ===============================
for _, row in df.iterrows():
    text = row["free_text"]
    true_label = int(row["label_id"])

    res = predict(text)              # hàm predict của bạn
    pred_label = int(res["label"])   # đảm bảo là int

    y_true.append(true_label)
    y_pred.append(pred_label)

# ===============================
# Compute metrics
# ===============================
accuracy  = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average="macro", zero_division=0)
recall    = recall_score(y_true, y_pred, average="macro", zero_division=0)
f1        = f1_score(y_true, y_pred, average="macro", zero_division=0)

print("Evaluation on Test Set")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1-score : {f1:.4f}")

# ===============================
# Confusion Matrix
# ===============================
cm = confusion_matrix(y_true, y_pred)
print("\nConfusion Matrix:")
print(cm)

# ===============================
# Detailed report (optional but recommended)
# ===============================
print("\nClassification Report:")
print(classification_report(y_true, y_pred, digits=4))