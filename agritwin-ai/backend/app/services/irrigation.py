import os
import joblib
import datetime
from sqlalchemy.orm import Session
from ..models import Farm, Soil
from ..routers.weather import get_weather
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Load model lazily to avoid crashing on import if file is missing
_model = None

def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(__file__), "..", "ml_models", "irrigation", "smart_watering_model.pkl")
        try:
            _model = joblib.load(model_path)
            logger.info("Successfully loaded smart_watering_model.pkl")
            print("----------------------------------------")
            print("IRRIGATION ML MODEL FILE LOADED:")
            print(model_path)
            print("----------------------------------------")
        except Exception as e:
            logger.error(f"Failed to load smart watering model: {str(e)}")
            raise e
    return _model

def predict_irrigation_need(db: Session, farm_id: int, light_intensity_lux: float = None, soil_moisture_override: float = None):
    model = get_model()
    
    # 1. Fetch Farm and Soil
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise ValueError(f"Farm with ID {farm_id} not found")
        
    # 2. Fetch Soil Moisture
    if soil_moisture_override is not None:
        moisture = soil_moisture_override
    else:
        soil_record = db.query(Soil).filter(Soil.farm_id == farm_id).order_by(Soil.created_at.desc()).first()
        if soil_record and soil_record.moisture is not None:
            moisture = float(soil_record.moisture)
        else:
            raise ValueError("Soil moisture data is missing. Please provide it manually or update the farm's soil profile.")
            
    # 3. Fetch Weather
    try:
        # Reusing the existing weather router logic for consistency
        weather_data = get_weather(farm.location)
        if weather_data.source == "FALLBACK":
            raise ValueError("Weather API returned fallback data. Real weather data is required.")
        air_temp = float(weather_data.temperature)
        air_humidity = float(weather_data.humidity)
    except Exception as e:
        logger.error(f"Failed to fetch weather for irrigation: {str(e)}")
        raise ValueError(f"Real weather data could not be fetched for {farm.location}.")
        
    # 4. Handle Light Intensity and Hour
    hour_of_day = datetime.datetime.now().hour
    
    if light_intensity_lux is None:
        raise ValueError("Light intensity (lux) is a required ML feature but was not provided.")

    # 5. Prepare model input array
    # Model features: ['suhu_udara(C)', 'kelembapan_udara(%)', 'intensitas_cahaya(lux)', 'kelembapan_tanah(%)', 'jam']
    features = np.array([[
        air_temp,
        air_humidity,
        light_intensity_lux,
        moisture,
        float(hour_of_day)
    ]])
    
    print("----------------------------------------")
    print("IRRIGATION ML MODEL INPUT")
    print(f"Features: {features.tolist()}")
    print("----------------------------------------")
    
    # 6. Predict
    prediction = model.predict(features)[0]
    
    print("IRRIGATION ML MODEL PREDICTION")
    print(f"Raw Prediction: {prediction}")
    print("----------------------------------------")
    
    irrigation_required = bool(prediction == 1)
    
    # Example logic for UI display based on prediction
    if irrigation_required:
        recommendation = "Irrigation recommended immediately."
        reason = f"Soil moisture is at {moisture}% with {air_temp}C temperature."
        water_req = 25.5  # placeholder heuristic
        unit = "liters"
    else:
        recommendation = "No irrigation needed right now."
        reason = f"Soil moisture is adequate ({moisture}%)."
        water_req = 0.0
        unit = "liters"

    return {
        "farm_id": farm.id,
        "crop": farm.current_crop or "Unknown",
        "irrigation_required": irrigation_required,
        "water_requirement": water_req,
        "unit": unit,
        "recommendation": recommendation,
        "reason": reason
    }
