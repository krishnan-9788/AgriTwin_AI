import os
import torch
import torch.nn as nn

class SoilFertilityModel(nn.Module):
    def __init__(self, input_size=12, num_classes=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        return self.net(x)


MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ml_models",
    "disease_detection",
    "soil_fertility"
)

MODEL_PATH = os.path.join(MODEL_DIR, "fertility_model.pt")

_model = None


def get_model():
    global _model

    if _model is None:
        model = SoilFertilityModel(input_size=12, num_classes=3)

        try:
            state_dict = torch.load(
                MODEL_PATH,
                map_location="cpu"
            )

            model.load_state_dict(state_dict)
            model.eval()

            _model = model

            print("Soil Fertility Model loaded successfully.")

        except Exception as e:
            print(f"Failed to load Soil Fertility Model: {e}")
            raise RuntimeError(
                f"Soil Fertility Model initialization failed: {e}"
            )

    return _model


def predict_soil_fertility(features: list) -> int:

    if len(features) != 12:
        raise ValueError("Exactly 12 features are required.")

    model = get_model()

    with torch.inference_mode():

        input_tensor = torch.tensor(
            [features],
            dtype=torch.float32
        )

        outputs = model(input_tensor)

        predicted = torch.argmax(outputs, dim=1)

        return int(predicted.item())