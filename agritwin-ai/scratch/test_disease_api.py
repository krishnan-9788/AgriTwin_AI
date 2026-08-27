import requests

# Assuming backend is running locally at 8000
try:
    login_res = requests.post("http://localhost:8000/auth/login", json={"email": "test@test.com", "password": "test"})
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing Disease Endpoint...")
    # create dummy image 
    with open("dummy_leaf.jpg", "wb") as f:
        # just an empty valid jpeg header or simple image?
        # actually, transformers expects a valid image. Let's make a real solid color jpeg using PIL
        from PIL import Image
        img = Image.new('RGB', (224, 224), color = 'green')
        img.save(f, format='JPEG')
        
    with open("dummy_leaf.jpg", "rb") as img_file:
        files = {"image": ("leaf.jpg", img_file, "image/jpeg")}
        res = requests.post("http://localhost:8000/disease/predict", headers=headers, files=files)
        print("Status:", res.status_code)
        print("Response:", res.text)
except Exception as e:
    print(f"Test failed: {e}")
