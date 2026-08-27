import urllib.request
import urllib.parse
import json
import os

# Let's get the API key from backend/app/config.py using sys path
import sys
sys.path.insert(0, os.path.abspath(r"C:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend"))
from app.config import settings

api_key = settings.data_gov_api_key
base_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Test 1: Corn/Maize in Tamil Nadu
params = {
    "api-key": api_key,
    "format": "json",
    "limit": 10,
    "offset": 0,
    "filters[state]": "Tamil Nadu",
    "filters[commodity]": "Maize"
}
query_string = urllib.parse.urlencode(params)
url = f"{base_url}?{query_string}"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("Maize in Tamil Nadu:", len(data.get("records", [])))
        if data.get("records"):
            print(data["records"][0])
except Exception as e:
    print(e)
    
# Test 2: Try without State to see if Maize exists at all
params2 = {
    "api-key": api_key,
    "format": "json",
    "limit": 10,
    "offset": 0,
    "filters[commodity]": "Maize"
}
query_string2 = urllib.parse.urlencode(params2)
url2 = f"{base_url}?{query_string2}"
req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req2, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("Maize Anywhere:", len(data.get("records", [])))
        if data.get("records"):
            print("First record:", data["records"][0])
except Exception as e:
    print(e)
