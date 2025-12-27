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
