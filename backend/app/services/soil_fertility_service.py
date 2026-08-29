from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models.soil import Soil
from .soil_fertility import predict_soil_fertility

def get_soil_fertility(db: Session, farm_id: int):
    # Fetch soil data
    soil = db.query(Soil).filter(Soil.farm_id == farm_id).first()
    if not soil:
        raise HTTPException(status_code=404, detail="Soil data not found for this farm")

    # Define required missing features for ML
    required_ml_features = ["n_val", "p_val", "k_val", "ec", "oc", "s", "zn", "fe", "cu", "mn", "b", "ph"]
    
    missing = []
    features = []
    
    for feature in required_ml_features:
        val = getattr(soil, feature, None)
        if val is None:
            missing.append(feature.upper() if len(feature) < 3 else feature.title())
        else:
            features.append(float(val))
            
    if not missing and len(features) == 12:
        # All 12 numeric ML features exist, run the PyTorch Model!
        try:
            prediction = predict_soil_fertility(features)
            status_map = {0: "Low Fertility", 1: "Medium Fertility", 2: "High Fertility"}
            return {
                "farm_id": farm_id,
                "model_used": True,
                "prediction": prediction,
                "fertility": status_map.get(prediction, "Unknown"),
                "health_score": 50 + (prediction * 25), # 50 for Low, 75 for Med, 100 for High
                "status": status_map.get(prediction, "Unknown")
            }
        except Exception as e:
            # Fallback if model fails to load
            pass

    # Rule-Based Fallback
    score = 0
    if soil.nitrogen == "High": score += 1
    elif soil.nitrogen == "Low": score -= 1
    
    if soil.phosphorus == "High": score += 1
    elif soil.phosphorus == "Low": score -= 1
    
    if soil.potassium == "High": score += 1
    elif soil.potassium == "Low": score -= 1
    
    if soil.ph and 6.0 <= soil.ph <= 7.5: score += 1
    elif soil.ph: score -= 1

    if score >= 2:
        fert_status = "High Fertility (Rule-Based)"
        health_score = 90
    elif score >= 0:
        fert_status = "Moderate Fertility (Rule-Based)"
        health_score = 70
    else:
        fert_status = "Low Fertility (Rule-Based)"
        health_score = 40

    return {
        "farm_id": farm_id,
        "model_used": False,
        "message": "Using Rule-Based estimation. Provide precise ML parameters for AI prediction.",
        "missing_features": missing,
        "prediction": score,
        "fertility": fert_status,
        "health_score": health_score,
        "status": fert_status
    }
