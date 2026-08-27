import sys
import os

backend_path = os.path.abspath(r"C:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend")
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.routers.auth import get_current_user

db = SessionLocal()
def override_get_current_user():
    user = db.query(models.User).filter(models.User.email == "admin@agritwin.ai").first()
    return user

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

print("Calling /farms/5/yield")
res = client.get("/farms/5/yield")
print(res.status_code)
print(res.json())
