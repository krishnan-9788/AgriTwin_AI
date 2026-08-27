import torch
model_path = r"c:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend\app\ml_models\disease_detection\soil_fertility\fertility_model.pt"

try:
    model = torch.jit.load(model_path)
    print("Model is ScriptModule.")
except Exception as e:
    print(f"Jit load failed: {e}")
    try:
        model = torch.load(model_path)
        print(f"Loaded successfully via torch.load. Type: {type(model)}")
    except Exception as e2:
        print(f"Load failed: {e2}")
