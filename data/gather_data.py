import pandas as pd

# Step 1: Read the data from each file

# File 1 (file1.csv) - Extracting 'free_text' only
file1 = pd.read_csv("vihsd/train.csv")
file1_data = file1[["free_text", "label_id"]]  # Selecting 'free_text' (comment) and 'label_id' (label)

# File 2 (file2.csv) - Extracting 'free_text' and 'label_id'

file2 = pd.read_csv("split_data/vu_data.csv")
file2_data = file2[["free_text", "label_id"]]  # Selecting 'free_text' (comment) and 'label_id' (label)

# File 3 (file3.csv) - Extracting 'free_text' and 'label_id'
file3 = pd.read_csv("split_data/thai_data.csv")
file3_data = file3[["free_text", "label_id"]]  # Selecting 'free_text' (comment) and 'label_id' (label)


# Step 2: Clean up the text columns (if there are any extra quotation marks or spaces)
file2_data['free_text'] = file2_data['free_text'].str.replace('"', '', regex=False).str.strip()
file3_data['free_text'] = file3_data['free_text'].str.replace('"', '', regex=False).str.strip()

# Step 3: Merge all data into one DataFrame
final_data = pd.concat([file1_data, file2_data, file3_data], ignore_index=True)  # Wrap the DataFrames in a list

# Step 4: Save the combined data to a new CSV file
final_data.to_csv("merged_file.csv", index=False)

print("Files merged successfully and saved to 'merged_file.csv'.")
