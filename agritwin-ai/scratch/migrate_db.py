from sqlalchemy import create_engine, text

def migrate():
    print("Connecting to postgres...")
    engine = create_engine("postgresql://postgres:postgres@localhost:5432/agritwin")
    
    columns_to_add = [
        "n_val FLOAT",
        "p_val FLOAT",
        "k_val FLOAT",
        "ec FLOAT",
        "oc FLOAT",
        "s FLOAT",
        "zn FLOAT",
        "fe FLOAT",
        "cu FLOAT",
        "mn FLOAT",
        "b FLOAT"
    ]
    
    with engine.connect() as conn:
        for col in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE soil_data ADD COLUMN IF NOT EXISTS {col}"))
                print(f"Added column {col}")
            except Exception as e:
                print(f"Error adding {col}: {e}")
        
        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
