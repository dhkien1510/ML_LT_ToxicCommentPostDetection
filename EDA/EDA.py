import pandas as pd
import re
import matplotlib.pyplot as plt
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer
from wordcloud import WordCloud

def clean_comment(text):
    text = text.lower()                       # Lowercase
    text = text.replace('"', '')               # Remove double quotes
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)  # Remove URLs
    text = re.sub(r'facebook\S+', '', text)   # Remove Facebook mentions
    text = re.sub(r',+', ',', text)           # Replace repeated commas with single comma
    text = re.sub(r'\s+', ' ', text)          # Replace multiple spaces with single space
    text = text.strip()                        # Remove leading/trailing spaces
    return text

# Đọc dữ liệu

data = pd.read_csv('../data/final_EDA.csv', quotechar='"', on_bad_lines='skip')
df = pd.DataFrame(data)
# Đảm bảo free_text luôn là string
df["free_text"] = df["free_text"].fillna("").astype(str)

df["free_text"] = df["free_text"].apply(clean_comment)
df = df[df["free_text"] != ""]

# -----------------------------
# 1. Độ dài ký tự & từ
# -----------------------------
df["char_len"] = df["free_text"].str.len()
df["word_len"] = df["free_text"].str.split().str.len()

print("\n--- Thống kê độ dài ---")
print(df[["char_len", "word_len"]].describe())

# Histogram char_len
plt.figure(figsize=(6,4))
df["char_len"].plot(kind="hist", bins=30)
plt.title("Phân bố độ dài ký tự")
plt.xlabel("Số ký tự")
plt.savefig("char_length_distribution.png", dpi=300)
plt.show()

# Histogram word_len
plt.figure(figsize=(6,4))
df["word_len"].plot(kind="hist", bins=30)
plt.title("Phân bố độ dài từ")
plt.xlabel("Số từ")
plt.savefig("word_length_distribution.png", dpi=300)
plt.show()

# -----------------------------
# 2. Làm sạch text
# -----------------------------
def clean_text(t):
    t = t.lower()
    t = re.sub(r"[^\w\s]", " ", t)  # ký tự đặc biệt thành space
    t = re.sub(r"\d+", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()

df["clean"] = df["free_text"].apply(clean_text)

# -----------------------------
# 3. Tần suất từ khóa
# -----------------------------
all_words = " ".join(df["clean"]).split()
counter = Counter(all_words)

print("\n--- Top 20 từ phổ biến ---")
print(counter.most_common(20))

common = counter.most_common(10)
words, counts = zip(*common)

plt.figure(figsize=(8,5))
plt.bar(words, counts)
plt.xticks(rotation=45)
plt.title("Top 10 từ phổ biến nhất")
plt.savefig("top10_words.png", dpi=300)
plt.show()

# -----------------------------
# 4. Ký tự đặc biệt
# -----------------------------
def extract_special_chars(text):
    return re.findall(r"[^\w\s]", text)

all_specials = []
df["free_text"].apply(lambda t: all_specials.extend(extract_special_chars(t)))

special_counter = Counter(all_specials)
print("\n--- Top ký tự đặc biệt ---")
print(special_counter.most_common(20))

if len(special_counter) > 0:
    top_spec = special_counter.most_common(10)
    chars, freqs = zip(*top_spec)
    plt.figure(figsize=(6,4))
    plt.bar(chars, freqs)
    plt.title("Top 10 ký tự đặc biệt")
    plt.savefig("top_special_chars.png", dpi=300)
    plt.show()

df["special_char_count"] = df["free_text"].apply(lambda t: len(extract_special_chars(t)))
df["special_ratio"] = df["special_char_count"] / df["char_len"].replace(0, 1)
print("\n--- Tỉ lệ ký tự đặc biệt ---")
print(df["special_ratio"].describe())

# -----------------------------
# 5. Emoji
# -----------------------------
def count_emoji(text):
    return sum(1 for ch in text if ch.encode("utf-8").startswith(b'\xf0'))

df["emoji_count"] = df["free_text"].apply(count_emoji)
print("\n--- Emoji count ---")
print(df["emoji_count"].describe())

# -----------------------------
# 6. Uppercase ratio
# -----------------------------
df["uppercase_ratio"] = df["free_text"].apply(lambda t: sum(1 for c in t if c.isupper()) / (len(t)+1))
print("\n--- Uppercase ratio ---")
print(df["uppercase_ratio"].describe())

# -----------------------------
# 7. Lexical diversity
# -----------------------------
df["unique_words"] = df["free_text"].apply(lambda t: len(set(t.split())))
df["lexical_diversity"] = df["unique_words"] / df["word_len"].replace(0, 1)
print("\n--- Lexical Diversity ---")
print(df["lexical_diversity"].describe())

# -----------------------------
# 8. WordCloud
# -----------------------------
wc = WordCloud(width=800, height=400, background_color="white").generate(" ".join(all_words))
plt.figure(figsize=(10,5))
plt.imshow(wc)
plt.axis("off")
plt.title("WordCloud - Từ khóa phổ biến")
plt.savefig("wordcloud.png", dpi=300)
plt.show()

df["clean"] = df["free_text"].apply(clean_text)

# -----------------------------
# Stopwords (có thể thêm stopwords tiếng Việt)
# -----------------------------
stopwords_vi = set([
    "và","của","là","có","cho","cái","một","những","này","tôi","bạn","ra","thì","nhé"
])
def remove_stopwords(text):
    return " ".join([w for w in text.split() if w not in stopwords_vi])

df["clean_no_stop"] = df["clean"].apply(remove_stopwords)

# -----------------------------
# Bigram
# -----------------------------
vectorizer_bigram = CountVectorizer(ngram_range=(2,2), max_features=100)
X2 = vectorizer_bigram.fit_transform(df["clean_no_stop"])
bigrams = dict(zip(vectorizer_bigram.get_feature_names_out(), X2.sum(axis=0).tolist()[0]))

df_bigrams = pd.DataFrame(list(bigrams.items()), columns=["bigram", "count"]).sort_values(by="count", ascending=False)
df_bigrams.to_csv("bigrams.csv", index=False)

# Vẽ top 20 bigram
top_bigrams = df_bigrams.head(20)
plt.figure(figsize=(10,6))
plt.bar(top_bigrams["bigram"], top_bigrams["count"])
plt.xticks(rotation=45, ha="right")
plt.title("Top 20 Bi-gram")
plt.xlabel("Bi-gram")
plt.ylabel("Số lần xuất hiện")
plt.tight_layout()
plt.savefig("top20_bigrams.png", dpi=300)
plt.show()

# -----------------------------
# Trigram
# -----------------------------
vectorizer_trigram = CountVectorizer(ngram_range=(3,3), max_features=100)
X3 = vectorizer_trigram.fit_transform(df["clean_no_stop"])
trigrams = dict(zip(vectorizer_trigram.get_feature_names_out(), X3.sum(axis=0).tolist()[0]))

df_trigrams = pd.DataFrame(list(trigrams.items()), columns=["trigram", "count"]).sort_values(by="count", ascending=False)
df_trigrams.to_csv("trigrams.csv", index=False)

# Vẽ top 20 trigram
top_trigrams = df_trigrams.head(20)
plt.figure(figsize=(10,6))
plt.bar(top_trigrams["trigram"], top_trigrams["count"])
plt.xticks(rotation=45, ha="right")
plt.title("Top 20 Tri-gram")
plt.xlabel("Tri-gram")
plt.ylabel("Số lần xuất hiện")
plt.tight_layout()
plt.savefig("top20_trigrams.png", dpi=300)
plt.show()