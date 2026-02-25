import pandas as pd
import os

print("Starting conversion to Parquet...")

# Read the split CSV files to reconstruct the full dataset
splits = [
    r"c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\data\train.csv",
    r"c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\data\test.csv",
    r"c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\data\further_test.csv"
]

dfs = []
for file in splits:
    if os.path.exists(file):
        print(f"Reading {file}...")
        dfs.append(pd.read_csv(file))

if not dfs:
    print("Could not find CSV files. Exiting.")
    exit(1)

df = pd.concat(dfs, ignore_index=True)
print(f"Total rows loaded: {len(df)}")

# Clean column names
df.rename(columns={
    'transaction id': 'transaction_id',
    'transaction type': 'transaction_type',
    'amount (INR)': 'amount_inr'
}, inplace=True)
print("Finished renaming columns.")

# Cast timestamps
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Optimize categorical columns
categorical_cols = [
    'transaction_type', 'merchant_category', 'transaction_status', 
    'sender_age_group', 'receiver_age_group', 'sender_state', 
    'sender_bank', 'receiver_bank', 'device_type', 'network_type', 
    'day_of_week'
]
for col in categorical_cols:
    df[col] = df[col].astype('category')
print("Optimized column types.")

# Ensure target directory exists
out_dir = r"c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\web\public"
if not os.path.exists(out_dir):
    os.makedirs(out_dir, exist_ok=True)

out_path = os.path.join(out_dir, "transactions.parquet")
df.to_parquet(out_path, engine='pyarrow', compression='snappy')
print(f"Successfully wrote {len(df)} rows to {out_path}")
