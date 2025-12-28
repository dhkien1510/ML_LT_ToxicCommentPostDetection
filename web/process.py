import csv

input_csv = "test.csv"
output_txt = "comments.txt"
column_name = "free_text"   # change this

with open(input_csv, newline="", encoding="utf-8") as csvfile, \
        open(output_txt, "w", encoding="utf-8") as txtfile:

    reader = csv.DictReader(csvfile)

    for row in reader:
        value = row.get(column_name)
        if value:  # skip empty / None
            txtfile.write(value.strip() + "\n")

print("Done! Saved column to text file.")
