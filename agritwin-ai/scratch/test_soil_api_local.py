import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.routers.auth import get_current_user

client = TestClient(app)
db = SessionLocal()

def override_get_current_user():
    user = db.query(models.User).filter(models.User.email == "admin@agritwin.ai").first()
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

response = client.get("/soil/5")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

res2 = client.get("/soil/5/fertility")
print(f"Status2: {res2.status_code}")
print(f"Response2: {res2.json()}")
