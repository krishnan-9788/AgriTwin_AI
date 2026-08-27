from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app.main import app

client = TestClient(app)

# We can't easily test authentication without a valid token, but we can verify the route exists by checking for a 401 instead of 404.
response = client.get("/api/market/prices?state=Tamil+Nadu&district=Coimbatore&commodity=Rice")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
