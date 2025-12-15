import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader, random_split
from underthesea import word_tokenize
import re
from collections import Counter
import torch.nn as nn
import torch.optim as optim
import pickle
import os
import matplotlib.pyplot as plt

# ===============================
# Preprocessing
# ===============================
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return text

class ToxicDataset(Dataset):
    def __init__(self, data, vocab, max_len=50):
        self.data = data.reset_index(drop=True)
        self.vocab = vocab
        self.max_len = max_len
        
    def encode(self, text):
        text = clean_text(text)
        tokens = word_tokenize(text)
        ids = [self.vocab.get(tok, self.vocab["<unk>"]) for tok in tokens]
        ids = ids[:self.max_len]
        return ids + [0] * (self.max_len - len(ids))
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text = self.data.iloc[idx]["free_text"]
        label = self.data.iloc[idx]["label_id"]
        x = torch.tensor(self.encode(text), dtype=torch.long)
        y = torch.tensor(label, dtype=torch.long)
        return x, y

def build_vocab(texts, min_freq=2):
    counter = Counter()
    for text in texts:
        counter.update(word_tokenize(clean_text(text)))

    vocab = {"<pad>": 0, "<unk>": 1}
    for word, freq in counter.items():
        if freq >= min_freq:
            vocab[word] = len(vocab)
    return vocab

# ===============================
# Model
# ===============================
class BiLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim=100, hidden_dim=128):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, 3)
        
    def forward(self, x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        h = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(h)

# ===============================
# Load data
# ===============================
df = pd.read_csv("../../data/vihsd/train.csv")
df["free_text"] = df["free_text"].fillna("")

vocab = build_vocab(df["free_text"])
dataset = ToxicDataset(df, vocab)

# Train / Validation split (80/20)
train_size = int(0.8 * len(dataset))
val_size = len(dataset) - train_size
train_ds, val_ds = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
val_loader = DataLoader(val_ds, batch_size=16)

# ===============================
# Training setup
# ===============================
model = BiLSTM(len(vocab))
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

num_epochs = 5

train_losses, val_losses = [], []
train_accs, val_accs = [], []

# ===============================
# Training loop
# ===============================
for epoch in range(num_epochs):
    # ---- Train ----
    model.train()
    total_loss, correct, total = 0, 0, 0

    for x, y in train_loader:
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        preds = torch.argmax(logits, dim=1)
        correct += (preds == y).sum().item()
        total += y.size(0)

    train_loss = total_loss / len(train_loader)
    train_acc = correct / total

    # ---- Validation ----
    model.eval()
    val_loss, correct, total = 0, 0, 0

    with torch.no_grad():
        for x, y in val_loader:
            logits = model(x)
            loss = criterion(logits, y)
            val_loss += loss.item()

            preds = torch.argmax(logits, dim=1)
            correct += (preds == y).sum().item()
            total += y.size(0)

    val_loss /= len(val_loader)
    val_acc = correct / total

    train_losses.append(train_loss)
    val_losses.append(val_loss)
    train_accs.append(train_acc)
    val_accs.append(val_acc)

    print(f"Epoch {epoch+1}/{num_epochs} | "
        f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | "
        f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")

# ===============================
# Plot Learning Curves
# ===============================
epochs = range(1, num_epochs + 1)

# ---- Loss Curve ----
plt.figure(figsize=(6,4))
plt.plot(epochs, train_losses, label="Train Loss")
plt.plot(epochs, val_losses, label="Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Learning Curve - Loss")
plt.legend()
plt.grid(True)
plt.savefig("loss_curve.png", dpi=300, bbox_inches="tight")
plt.close()

# ---- Accuracy Curve ----
plt.figure(figsize=(6,4))
plt.plot(epochs, train_accs, label="Train Accuracy")
plt.plot(epochs, val_accs, label="Validation Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.title("Learning Curve - Accuracy")
plt.legend()
plt.grid(True)
plt.savefig("accuracy_curve.png", dpi=300, bbox_inches="tight")
plt.close()

print("✅ Saved learning curves: loss_curve.png & accuracy_curve.png")

# ===============================
# Save model
# ===============================
os.makedirs("checkpoints", exist_ok=True)

checkpoint = {
    "model_state_dict": model.state_dict(),
    "vocab": vocab,
    "max_len": dataset.max_len
}

with open("checkpoints/bi_lstm_toxic.pkl", "wb") as f:
    pickle.dump(checkpoint, f)

print("✅ Model saved at checkpoints/bi_lstm_toxic.pkl")
