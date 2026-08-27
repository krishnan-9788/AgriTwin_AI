from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:SafeOS%40123@localhost:5432/agritwin"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

result = db.execute(text("SELECT id, email FROM users;"))
for row in result:
    print(f"User: {row}")

result2 = db.execute(text("SELECT id, user_id, farm_name FROM farms;"))
for row in result2:
    print(f"Farm: {row}")
