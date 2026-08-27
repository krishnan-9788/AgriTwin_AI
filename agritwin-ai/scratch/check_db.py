import psycopg2
import json

try:
    # Use postgres connection string for backend
    conn = psycopg2.connect("postgresql://postgres:SafeOS%40123@localhost:5432/agritwin")
    cursor = conn.cursor()
    cursor.execute("SELECT id, farm_id, soil_type, moisture, ph FROM soil_data ORDER BY farm_id;")
    records = cursor.fetchall()
    for r in records:
        print(r)
except Exception as e:
    print(e)
