import sys
import os

sys.path.insert(0, os.path.abspath(r"C:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend"))

from app.services.disease import _load_model_if_needed

try:
    _load_model_if_needed()
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
