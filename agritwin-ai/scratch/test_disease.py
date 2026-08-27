import asyncio
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.services.disease import predict_disease

async def test():
    # create a dummy RGB image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (224, 224), color = (73, 109, 137))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    try:
        res = predict_disease(img_bytes)
        print("Prediction result:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
