import pandas as pd

# Load CSV safely (handle commas inside quotes)
df = pd.read_csv("vu_label.csv", quotechar='"')

# Extract relevant columns
result = df[["comment", "label_id"]].copy()

# Remove any double quotes inside comments
result["comment"] = result["comment"].astype(str).str.replace('"', '', regex=False).str.strip()

# Define sentiment mapping
sentiment_map = {
    "CLEAN": 0,
    "OFFENSIVE": 1,
    "HATE": 2
}

# # Map sentiment to numeric, safely handling NaN and extra spaces
# result["label_id"] = result["sentiment"].astype(str).str.upper().str.strip().map(sentiment_map)

# Fill unmapped/missing sentiments with -1 if needed
result["label_id"] = result["label_id"].fillna(9).astype(int)

# Keep only comment and label_id
result = result[["comment", "label_id"]]

# Save to CSV without quotes, using escapechar
result.to_csv(
    "processed_comments_vu.csv",
    index=False,
    quoting=3,           # csv.QUOTE_NONE
    escapechar='\\'      # escape commas, newlines, etc.
)
