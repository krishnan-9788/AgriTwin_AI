import os
import torch
import torch.nn as nn

class SoilFertilityModel(nn.Module):
    def __init__(self, input_size=12, num_classes=3):
        super(SoilFertilityModel, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        return self.net(x)

# Load model globally once
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_models", "disease_detection", "soil_fertility")
MODEL_PATH = os.path.join(MODEL_DIR, "fertility_model.pt")

model = SoilFertilityModel(input_size=12, num_classes=3)
try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    model.eval()
    print("Soil Fertility Model loaded successfully.")
except Exception as e:
    print(f"Failed to load Soil Fertility Model: {e}")
    model = None

def predict_soil_fertility(features: list) -> int:
    if model is None:
        raise RuntimeError("Soil Fertility Model is not loaded.")
    
    # Features is a list of 12 floats: [N, P, K, ph, ec, oc, S, zn, fe, cu, Mn, B]
    if len(features) != 12:
        raise ValueError("Exactly 12 features are required.")
        
    with torch.no_grad():
        input_tensor = torch.tensor([features], dtype=torch.float32)
        outputs = model(input_tensor)
        _, predicted = torch.max(outputs, 1)
        return int(predicted.item())
