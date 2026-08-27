import sys
import os

# Add backend directory to sys path so we can import config
backend_path = os.path.abspath(r"C:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend")
sys.path.insert(0, backend_path)

from app.services.market import get_market_prices
from app.config import settings

print(f"API Key: {settings.data_gov_api_key[:10]}...")

print("Testing exact match query:")
res1 = get_market_prices("Tamil Nadu", "Erode", "Tomato")
print(res1)

print("\nTesting fallback (no district):")
res2 = get_market_prices("Tamil Nadu", "", "Tomato")
print(res2)
