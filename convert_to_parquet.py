import pandas as pd
import os

print("Starting conversion to Parquet...")

# Read the main CSV file directly to maximize data context
csv_path = r"c:\Users\vitth\OneDrive\Documents\SEM VI\InsightsX\data\upi_transactions_2024.csv"

if not os.path.exists(csv_path):
    print("Could not find unified CSV file. Exiting.")
    exit(1)

print(f"Reading full dataset from {csv_path}...")
df = pd.read_csv(csv_path)
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
