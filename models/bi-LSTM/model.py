import pandas as pd
import torch
from torch.utils.data import Dataset
from underthesea import word_tokenize
import re
from collections import Counter
import torch.nn as nn
from torch.utils.data import DataLoader
import torch.optim as optim
import pickle
import os

def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]"," ", text)
    
    return text

class ToxicDataset(Dataset):
    def __init__(self, data, vocab, max_len=50):
        self.data = data
        self.vocab = vocab
        self.max_len = max_len
        
    def encode(self,text):
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
        x = torch.tensor(self.encode(text))
        y = torch.tensor(label, dtype=torch.float)
        return x,y

def build_vocab(texts, min_freq=2):
    counter = Counter()
    for text in texts:
        text = clean_text(text)
        counter.update(word_tokenize(text))

    vocab = {"<pad>": 0, "<unk>": 1}
    for word, freq in counter.items():
        if freq >= min_freq:
            vocab[word] = len(vocab)
    return vocab
    
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
        self.fc = nn.Linear(hidden_dim * 2,1)
        
    def forward(self,x):
        x = self.embedding(x)
        _, (h_n, _) = self.lstm(x)
        h = torch.cat([h_n[-2], h_n[-1]], dim=1)
        return self.fc(h)
        
df = pd.read_csv("../../data/vihsd/train.csv")
df["free_text"] = df["free_text"].fillna("")

vocab = build_vocab(df["free_text"])
dataset = ToxicDataset(df, vocab)
loader = DataLoader(dataset, batch_size=16, shuffle=True)

model = BiLSTM(len(vocab))
criterion = nn.BCEWithLogitsLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(5):
    model.train()
    total_loss = 0
    for x,y in loader:
        optimizer.zero_grad()
        logits = model(x).squeeze(1)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    print(f"Epoch {epoch + 1} | Loss: {total_loss/len(loader):.4f}")
    
def predict(text):
    model.eval()
    encoded = dataset.encode(text)
    x = torch.tensor(encoded).unsqueeze(0)
    with torch.no_grad():
        prob = torch.sigmoid(model(x)).item()
    
    return prob, int(prob > 0.5)

os.makedirs("checkpoints", exist_ok=True)

checkpoint = {
    "model_state_dict": model.state_dict(),
    "vocab": vocab,
    "max_len": dataset.max_len,
    "embed_dim": 100,
    "hidden_dim": 128
}

with open("checkpoints/bi_lstm_toxic.pkl", "wb") as f:
    pickle.dump(checkpoint, f)

print("✅ Model saved at checkpoints/bi_lstm_toxic.pkl")
