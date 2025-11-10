import csv

input_file = "output2.txt"
output_file = "comments16.csv"

rows = []
with open(input_file, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]


new_lines = []
new_line = ""
k = 0
while k < len(lines):
  
    new_line += lines[k] 
    if (lines[k] == "Reply"):
        new_lines.append(new_line)
        new_line = ""
    else:
        new_line += ">"
    k += 1

print(len(lines))
lines = new_lines

filter_line = []
for i in lines:
    seg = i.split(">")
    seg = [j.strip() for j in seg if j.strip() not in [".", "", "Top fan", "Hay Hóng Hớt", "·"]]
    if seg[0] == 'Edited':
        seg = seg[1:]
    filter_line.append(seg)

lines = filter_line

with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
    csvfile.write("name,comment\n")
    for i in lines:
        csvfile.write(f'{i[0]}, "{i[1]}"\n')

