import logging
from sqlalchemy.orm import Session
from ..models import Farm, Soil
from ..routers.weather import get_weather
from .irrigation import predict_irrigation_need
from ..schemas.alerts import FarmAlertsResponse, AlertItem

logger = logging.getLogger(__name__)

def generate_farm_alerts(db: Session, farm_id: int) -> FarmAlertsResponse:
    alerts = []
    
    # 1. Fetch Farm
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise ValueError(f"Farm with ID {farm_id} not found")
        
    # 2. Fetch Soil Record
    soil_record = db.query(Soil).filter(Soil.farm_id == farm_id).order_by(Soil.created_at.desc()).first()
    has_soil_moisture = False
    soil_moisture_val = None
    if soil_record and soil_record.moisture is not None:
        has_soil_moisture = True
        soil_moisture_val = float(soil_record.moisture)
        
    # 3. Fetch Weather Data
    rain_expected = False
    has_real_weather = False
    weather_desc = ""
    try:
        weather_data = get_weather(farm.location)
        if weather_data.source != "FALLBACK":
            has_real_weather = True
            weather_desc = weather_data.description.lower()
            
            # Weather / Rain Check
            rain_keywords = ["rain", "storm", "drizzle", "shower", "thunderstorm"]
            if any(k in weather_desc for k in rain_keywords):
                rain_expected = True
                
            # High Temperature Alert
            if float(weather_data.temperature) >= 35.0:
                alerts.append(AlertItem(
                    type="temperature",
                    severity="warning",
                    title="Temperature Warning",
                    message="High temperature detected. Monitor crop water stress.",
                    value=f"{weather_data.temperature}°C"
                ))
                
            # High Humidity Alert
            if float(weather_data.humidity) >= 85.0:
                alerts.append(AlertItem(
                    type="weather",
                    severity="warning",
                    title="High Humidity",
                    message="High humidity detected. Monitor crop conditions.",
                    value=f"{weather_data.humidity}%"
                ))
    except Exception as e:
        logger.error(f"Failed to fetch weather for alerts: {str(e)}")

    # 4. Low Soil Moisture Alert
    if has_soil_moisture:
        if soil_moisture_val < 30.0:
            alerts.append(AlertItem(
                type="soil",
                severity="critical",
                title="Low Soil Moisture",
                message="Soil moisture is low. Irrigation is recommended.",
                value=f"{soil_moisture_val}%"
            ))
    else:
        alerts.append(AlertItem(
            type="soil",
            severity="info",
            title="Soil Data Unavailable",
            message="Please provide soil moisture data for accurate alerts."
        ))

    # 5. Irrigation ML Alert + Weather Combined
    ml_success = False
    irrigation_required = False
    
    try:
        # We need light intensity for the ML model, normally user provides this or we fallback.
        # Since this is a background alert service, we use the fallback in the model if we can't provide it, 
        # but wait, we made light_intensity_lux REQUIRED in irrigation.py.
        # We will pass a daylight approximation to evaluate general necessity if real sensor data isn't available.
        # Or better yet, we pass a reasonable default just for the alert engine.
        ml_prediction = predict_irrigation_need(db, farm_id, light_intensity_lux=45000.0)
        irrigation_required = ml_prediction["irrigation_required"]
        ml_success = True
    except Exception as e:
        logger.error(f"Irrigation ML failed during alert generation: {str(e)}")

    if ml_success:
        if irrigation_required:
            if rain_expected:
                alerts.append(AlertItem(
                    type="irrigation",
                    severity="info",
                    title="Rain Expected",
                    message="Rain is expected, so irrigation can be postponed.",
                    value=weather_desc.title()
                ))
            else:
                alerts.append(AlertItem(
                    type="irrigation",
                    severity="critical",
                    title="Irrigation Recommended",
                    message="Irrigation is recommended based on current conditions.",
                ))
        else:
            if rain_expected:
                alerts.append(AlertItem(
                    type="irrigation",
                    severity="info",
                    title="Rain Expected",
                    message="Rain expected. Irrigation may not be required.",
                    value=weather_desc.title()
                ))
            else:
                alerts.append(AlertItem(
                    type="irrigation",
                    severity="info",
                    title="Irrigation Status",
                    message="No irrigation is required right now."
                ))
    else:
        if rain_expected:
            alerts.append(AlertItem(
                type="irrigation",
                severity="info",
                title="Rain Expected",
                message="Rain expected. Consider postponing any planned irrigation."
            ))

    return FarmAlertsResponse(
        farm_id=farm_id, 
        farm_name=farm.farm_name,
        location=farm.location,
        crop=farm.current_crop or "Unknown",
        alerts=alerts
    )
