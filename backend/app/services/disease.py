import os
import json
import torch
from io import BytesIO
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

# Global variables for lazy loading
_processor = None
_model = None
_id2label = {}

# Fix: Point to the correct nested directory containing config.json and model.safetensors
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml_models", "disease_detection", "disease_detection")

def _load_model_if_needed():
    global _processor, _model, _id2label
    if _model is None:
        try:
            print("Loading disease detection model...")
            
            # Read config to get id2label
            config_path = os.path.join(MODEL_DIR, "config.json")
            with open(config_path, "r") as f:
                config_data = json.load(f)
                _id2label = config_data.get("id2label", {})
                
            _processor = AutoImageProcessor.from_pretrained(MODEL_DIR, local_files_only=True)
            _model = AutoModelForImageClassification.from_pretrained(MODEL_DIR, local_files_only=True)
            _model.eval()
            print("Disease detection model loaded successfully.")
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Failed to load disease detection model from {MODEL_DIR}:\n{error_trace}")
            
            # Check if model files actually exist to provide a better error
            if not os.path.exists(os.path.join(MODEL_DIR, "config.json")):
                raise RuntimeError(f"Model file config.json is missing in directory: {MODEL_DIR}")
            if not os.path.exists(os.path.join(MODEL_DIR, "model.safetensors")):
                raise RuntimeError(f"Model file model.safetensors is missing in directory: {MODEL_DIR}")
                
            raise RuntimeError(f"Model initialization failed: {e}")

def predict_disease(image_bytes: bytes):
    _load_model_if_needed()
    
    try:
        # Load image
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")
        
    try:
        # Preprocess
        inputs = _processor(images=image, return_tensors="pt")
        
        # Predict
        with torch.no_grad():
            outputs = _model(**inputs)
            logits = outputs.logits
            
        # Get probabilities
        probabilities = torch.softmax(logits, dim=-1)
        confidence, predicted_idx = torch.max(probabilities, dim=-1)
        
        confidence_val = confidence.item() * 100
        predicted_class_id = str(predicted_idx.item())
        disease_name = _id2label.get(predicted_class_id, "Unknown Disease")
        
        # Clean up disease name for frontend
        disease_name = disease_name.replace("___", " - ").replace("_", " ")
        
        return {
            "success": True,
            "disease": disease_name,
            "confidence": round(confidence_val, 2),
            "recommendation": f"Consult a local agronomist for {disease_name.lower()} treatment."
        }
    except Exception as e:
        import traceback
        print(f"Prediction failed:\n{traceback.format_exc()}")
        raise RuntimeError(f"Prediction failed: {e}")
