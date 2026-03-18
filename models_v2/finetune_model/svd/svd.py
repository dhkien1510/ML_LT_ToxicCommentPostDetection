import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, learning_curve
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

# 1. Load dữ liệu
df = pd.read_csv('../../../data/final_clean_segment_data/final_segment_data.csv')

# Xử lý giá trị thiếu và ép kiểu label
df['comment'] = df['comment'].fillna('')
df['label_id'] = df['label_id'].astype(int)

X = df['comment']
y = df['label_id']

# Chia tập Train/Test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Định nghĩa Pipeline
# n_components thường chọn từ 100-500 cho NLP mức độ vừa
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=5000)),
    ('svd', TruncatedSVD(n_components=100, random_state=42)),
    ('clf', LogisticRegression(solver='lbfgs', max_iter=1000))
])

# Huấn luyện model
pipeline.fit(X_train, y_train)


def plot_learning_curve(estimator, X, y):
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=5, n_jobs=-1, 
        train_sizes=np.linspace(0.1, 1.0, 5),
        scoring='accuracy'
    )

    train_mean = np.mean(train_scores, axis=1)
    test_mean = np.mean(test_scores, axis=1)

    plt.figure(figsize=(10, 6))
    plt.plot(train_sizes, 1 - train_mean, label='Training Error', marker='o')
    plt.plot(train_sizes, 1 - test_mean, label='Cross-Validation Error', marker='s')
    
    plt.title('Learning Curve (SVD + Logistic Regression)')
    plt.xlabel('Training Samples')
    plt.ylabel('Error Rate (1 - Accuracy)')
    plt.legend()
    plt.grid(True)
    plt.show()

plot_learning_curve(pipeline, X_train, y_train)


y_pred = pipeline.predict(X_test)
print(classification_report(y_test, y_pred, target_names=['CLEAN', 'OFFENSIVE', 'HATE']))