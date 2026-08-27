import torch
model_path = r"c:\Users\krish\Desktop\AI Digital Twin\agritwin-ai\backend\app\ml_models\disease_detection\soil_fertility\fertility_model.pt"
sd = torch.load(model_path)
for k, v in sd.items():
    print(f"{k}: {v.shape}")
