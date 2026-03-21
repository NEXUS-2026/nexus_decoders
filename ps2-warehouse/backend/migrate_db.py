"""
One-shot migration: add new challan columns to the existing session table.
Safe to run multiple times (uses IF NOT EXISTS semantics via exception catch).
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "storage" / "ps2.db"
print(f"Migrating: {DB_PATH}")

conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()

new_columns = [
    ("customer_ms",    "TEXT DEFAULT ''"),
    ("transporter_id", "TEXT DEFAULT ''"),
    ("courier_partner","TEXT DEFAULT ''"),
    ("challan_no",     "TEXT DEFAULT ''"),
    ("pickup_date",    "TEXT DEFAULT ''"),
    ("products_json",  "TEXT DEFAULT '[]'"),
]

# Get existing columns
cur.execute("PRAGMA table_info(session)")
existing = {row[1] for row in cur.fetchall()}
print("Existing columns:", existing)

for col_name, col_def in new_columns:
    if col_name not in existing:
        sql = f"ALTER TABLE session ADD COLUMN {col_name} {col_def}"
        print(f"  Adding: {sql}")
        cur.execute(sql)
    else:
        print(f"  Already exists: {col_name}")

conn.commit()
conn.close()
print("Migration complete.")
