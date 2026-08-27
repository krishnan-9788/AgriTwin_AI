import requests

base_url = "http://localhost:8000"

# 1. Register or Login
login_data = {
    "email": "test@test.com",
    "password": "test"
}
try:
    res = requests.post(f"{base_url}/auth/register", json={
        "name": "Test",
        "email": "test@test.com",
        "password": "test",
        "confirm_password": "test"
    })
except:
    pass

res = requests.post(f"{base_url}/auth/login", json=login_data)
if res.status_code == 200:
    token = res.json()["access_token"]
    print("Got Token")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check farms
    farm_res = requests.get(f"{base_url}/farms/", headers=headers)
    print("Farms:", farm_res.json())
    
    if farm_res.status_code == 200 and len(farm_res.json()) > 0:
        farm_id = farm_res.json()[0]["id"]
        print(f"Testing Soil for Farm ID: {farm_id}")
        
        soil_res = requests.get(f"{base_url}/soil/{farm_id}", headers=headers)
        print("Soil Response Status:", soil_res.status_code)
        print("Soil Response:", soil_res.text)
else:
    print("Login Failed:", res.text)
