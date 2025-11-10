import csv
import glob
import os
import pandas as pd

# --- Cấu hình ---
folder_path = "data"              # thư mục chứa các file CSV
output_file = "merged_comments_clean.csv"

# --- Lấy tất cả file CSV trong thư mục ---
csv_files = glob.glob(os.path.join(folder_path, "*.csv"))

clean_rows = []
header = ["name", "comment"]

for f in csv_files:
    print(f"📄 Đang xử lý file: {f}")
    try:
        with open(f, "r", encoding="utf-8") as infile:
            reader = csv.reader(infile, skipinitialspace=True, quotechar='"')
            file_header = next(reader)  # đọc tiêu đề
            for row in reader:
                if len(row) >= 2:
                    name = row[0].strip()
                    comment = ",".join(row[1:]).replace('""', '"').strip()
                    clean_rows.append([name, comment])
    except Exception as e:
        print(f"⚠️ Lỗi khi đọc file {f}: {e}")

# --- Tạo DataFrame và xuất CSV ---
df = pd.DataFrame(clean_rows, columns=header)
df.to_csv(output_file, index=False, encoding="utf-8", quoting=csv.QUOTE_ALL)

print(f"✅ Hoàn tất! Đã gộp {len(csv_files)} file vào {output_file}")
