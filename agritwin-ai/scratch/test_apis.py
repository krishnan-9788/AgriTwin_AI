import requests

token_res = requests.post("http://localhost:8000/auth/login", json={"email": "test@test.com", "password": "test"})
if token_res.status_code == 200:
    token = token_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test Yield
    res = requests.get("http://localhost:8000/farms/5/yield", headers=headers)
    print("Yield Status:", res.status_code)
    print("Yield Data:", res.text)
    
    # Test Market
    market_res = requests.get("http://localhost:8000/api/market-prices?state=Tamil%20Nadu&district=Erode&commodity=Tomato", headers=headers)
    print("Market Status:", market_res.status_code)
    print("Market Data:", market_res.text[:200])
else:
    print("Login Failed")
