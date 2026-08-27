import requests

def test_apis():
    print("Testing /auth/login for token...")
    # Get token for test user
    login_res = requests.post("http://localhost:8000/auth/login", json={"email": "test@test.com", "password": "test"})
    if login_res.status_code != 200:
        print("Login failed:", login_res.text)
        return
        
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- Testing GET /api/market-prices/test ---")
    test_res = requests.get("http://localhost:8000/api/market-prices/test", headers=headers)
    print("Status:", test_res.status_code)
    print("Data:", test_res.text)
    
    print("\n--- Testing GET /api/market-prices (Tamil Nadu, Erode, Corn) ---")
    # Using 'corn' and 'erode' intentionally lowercased/unmapped to test mappings
    market_res = requests.get("http://localhost:8000/api/market-prices?state=tamil nadu&district=erode&commodity=corn", headers=headers)
    print("Status:", market_res.status_code)
    if market_res.status_code == 200:
        data = market_res.json()
        print(f"Success: {data.get('success')}")
        print(f"Count: {data.get('count')}")
        print(f"Message/Error: {data.get('message') or data.get('error')}")
        print("Filters Applied:", data.get('filters'))
        if data.get('records'):
            print("First Record Location:", f"{data['records'][0].get('district')}, {data['records'][0].get('state')}")
    else:
        print("Error:", market_res.text)

if __name__ == "__main__":
    test_apis()
