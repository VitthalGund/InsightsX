import csv
import random
import os

input_file = r'c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\upi_transactions_2024.csv'
data_dir = r'c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\data'

os.makedirs(data_dir, exist_ok=True)

print("Reading data...")
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    rows = list(reader)

print("Shuffling data...")
random.seed(42) # For reproducibility
random.shuffle(rows)

total = len(rows)
train_end = int(total * 0.70)
test_end = train_end + int(total * 0.20)

train_rows = rows[:train_end]
test_rows = rows[train_end:test_end]
further_test_rows = rows[test_end:]

print(f"Total rows: {total}")
print(f"Writing train.csv ({len(train_rows)} rows)...")
with open(os.path.join(data_dir, 'train.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(train_rows)

print(f"Writing test.csv ({len(test_rows)} rows)...")
with open(os.path.join(data_dir, 'test.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(test_rows)

print(f"Writing further_test.csv ({len(further_test_rows)} rows)...")
with open(os.path.join(data_dir, 'further_test.csv'), 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(further_test_rows)

print("Split complete.")
