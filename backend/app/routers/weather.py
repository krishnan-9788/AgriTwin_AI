from fastapi import APIRouter, HTTPException
import requests
from ..config import settings
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["weather"])

class WeatherResponse(BaseModel):
    city: str
    temperature: float
    humidity: int
    description: str
    wind_speed: float
    feels_like: float
    pressure: int
    icon: str
    source: str

@router.get("/", response_model=WeatherResponse)
def get_weather(city: str):
    logger.info(f"[WEATHER] City: {city}")
    
    # Fallback/Demo Data
    fallback_data = {
        "city": city.title(),
        "temperature": 28.5,
        "humidity": 65,
        "description": "Scattered Clouds (Demo)",
        "wind_speed": 4.2,
        "feels_like": 30.1,
        "pressure": 1012,
        "icon": "03d",
        "source": "FALLBACK"
    }

    # Check API Key validity
    api_key = settings.weather_api_key
    if not api_key or "openweathermap.org" in api_key:
        logger.error("[WEATHER] Weather API key missing or invalid default string.")
        logger.info("[WEATHER] Source: FALLBACK")
        return WeatherResponse(**fallback_data)
        
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url, timeout=10)
        logger.info(f"[WEATHER] Weather API status: {response.status_code}")
        
        response.raise_for_status()
        data = response.json()
        logger.info("[WEATHER] Weather response received")
        logger.info("[WEATHER] Source: LIVE")
        
        return WeatherResponse(
            city=data.get("name", city),
            temperature=data.get("main", {}).get("temp", fallback_data["temperature"]),
            humidity=data.get("main", {}).get("humidity", fallback_data["humidity"]),
            description=data.get("weather", [{}])[0].get("description", "Unknown").title(),
            wind_speed=data.get("wind", {}).get("speed", fallback_data["wind_speed"]),
            feels_like=data.get("main", {}).get("feels_like", fallback_data["feels_like"]),
            pressure=data.get("main", {}).get("pressure", fallback_data["pressure"]),
            icon=data.get("weather", [{}])[0].get("icon", fallback_data["icon"]),
            source="LIVE"
        )
    except Exception as e:
        logger.error(f"[WEATHER] Weather API failed: {str(e)}")
        logger.info("[WEATHER] Source: FALLBACK")
        return WeatherResponse(**fallback_data)
