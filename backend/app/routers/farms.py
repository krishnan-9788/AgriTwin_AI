from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import database, models
from ..schemas import farm as farm_schema
from .auth import get_current_user

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/farms", tags=["farms"])

@router.get("/", response_model=List[farm_schema.FarmResponse])
def get_farms(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        logger.info(f"Fetching farms for user {current_user.email}")
        farms = db.query(models.Farm).filter(models.Farm.user_id == current_user.id).all()
        return farms
    except Exception as e:
        logger.error(f"Error fetching farms: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/", response_model=farm_schema.FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(farm: farm_schema.FarmCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        logger.info(f"Creating farm for user {current_user.email}: {farm.farm_name}")
        new_farm = models.Farm(**farm.model_dump(), user_id=current_user.id)
        db.add(new_farm)
        db.commit()
        db.refresh(new_farm)
        logger.info(f"Farm created successfully with ID {new_farm.id}")
        return new_farm
    except Exception as e:
        logger.error(f"Error creating farm: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
@router.get("/{id}", response_model=farm_schema.FarmResponse)
def get_farm(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        logger.info(f"Fetching farm ID {id} for user {current_user.email}")

        farm = (
            db.query(models.Farm)
            .filter(
                models.Farm.id == id,
                models.Farm.user_id == current_user.id
            )
            .first()
        )

        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )

        return farm

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching farm ID {id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )        

@router.put("/{id}", response_model=farm_schema.FarmResponse)
def update_farm(id: int, farm: farm_schema.FarmUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        logger.info(f"Updating farm ID {id} for user {current_user.email}")
        farm_query = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id)
        db_farm = farm_query.first()
        
        if db_farm == None:
            logger.warning(f"Farm ID {id} not found or not owned by user {current_user.email}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id: {id} does not exist")
        
        update_data = farm.model_dump(exclude_unset=True)
        farm_query.update(update_data, synchronize_session=False)
        db.commit()
        logger.info(f"Farm ID {id} updated successfully")
        return farm_query.first()
    except Exception as e:
        logger.error(f"Error updating farm: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        logger.info(f"Deleting farm ID {id} for user {current_user.email}")
        farm_query = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id)
        if farm_query.first() == None:
            logger.warning(f"Farm ID {id} not found or not owned by user {current_user.email}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm with id: {id} does not exist")
        farm_query.delete(synchronize_session=False)
        db.commit()
        logger.info(f"Farm ID {id} deleted successfully")
    except Exception as e:
        logger.error(f"Error deleting farm: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{id}/yield")
def predict_yield(id: int, sim_date: str = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")

        crop = farm.current_crop or "Unknown"
        area = farm.farm_size or 1.0
        
        # New Profitability Engine logic for flowers/crops
        from ..services.profitability import calculate_suitability
        
        soil_record = db.query(models.Soil).filter(models.Soil.farm_id == id).first()
        soil_dict = {}
        health_score = 100
        
        if soil_record:
            soil_dict = {
                "ph": soil_record.ph,
                "nitrogen": soil_record.nitrogen,
                "moisture": soil_record.moisture
            }
            if soil_record.moisture and (soil_record.moisture < 30 or soil_record.moisture > 85): health_score -= 15
            if soil_record.ph and (soil_record.ph < 5.5 or soil_record.ph > 8.0): health_score -= 10
            if soil_record.nitrogen == "Low": health_score -= 10
        else:
            health_score -= 20
            
        if farm.latest_disease and "healthy" not in farm.latest_disease.lower():
            health_score -= 15

        health_score = max(0, health_score)

        # Calculate Age and Stage (reusing Digital Twin logic)
        import datetime
        from datetime import timezone
        
        duration = 120
        # Check standard durations to match digital twin exactly
        CROP_DURATIONS = {"Corn": 120,"Maize": 100,"Wheat": 120,"Rice": 135,"Paddy": 135,"Tomato": 90,"Potato": 100,"Onion": 110,"Cotton": 160,"Jasmine": 130,"Banana": 300, "Mango": 365, "Sugarcane": 365, "Groundnut": 120, "Chilli": 150}
        for key, val in CROP_DURATIONS.items():
            if key.lower() in crop.lower():
                duration = val
                break
                
        planting_date = farm.planting_date
        now = datetime.datetime.now(timezone.utc)
        if sim_date:
            try:
                parsed_sim = datetime.datetime.fromisoformat(sim_date.replace('Z', '+00:00'))
                if parsed_sim.tzinfo is None:
                    parsed_sim = parsed_sim.replace(tzinfo=timezone.utc)
                now = parsed_sim
            except Exception: pass
            
        if planting_date:
            if planting_date.tzinfo is None:
                planting_date = planting_date.replace(tzinfo=timezone.utc)
            actual_crop_age = (now - planting_date).days
            if actual_crop_age < 0: actual_crop_age = 0
        else:
            actual_crop_age = 0
            
        effective_crop_age = min(actual_crop_age, duration)
        progress = (effective_crop_age / duration) * 100
        
        # Calculate text stage
        if progress < 20: growth_stage = "Seedling"
        elif progress < 50: growth_stage = "Vegetative"
        elif progress < 70: growth_stage = "Branching"
        elif progress < 100: growth_stage = "Flowering / Fruit Development"
        else: growth_stage = "Maturity / Harvest Ready"
            
        weather_dict = {"temperature": 28} # Fallback

        analysis = calculate_suitability(
            farm_area=area,
            current_crop=crop,
            soil=soil_dict,
            weather=weather_dict,
            growth_stage=growth_stage,
            health_score=health_score
        )

        return {
            "farm_id": id,
            "crop": analysis["crop"],
            "area_acres": analysis["area_acres"],
            "estimated_yield": analysis["estimated_yield"],
            "unit": analysis["unit"],
            "factors": analysis["reasons"],
            "economics": analysis["economics"],
            "land_allocation": analysis["land_allocation"]
        }

    except Exception as e:
        logger.error(f"Error predicting yield: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{id}/digital-twin")
def get_farm_digital_twin(id: int, sim_date: str = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")

        import datetime
        from datetime import timezone

        # 1. Base Crop Duration
        CROP_DURATIONS = {
            "Corn": 120,
            "Maize": 120,
            "Wheat": 150,
            "Rice": 120,
            "Paddy": 120,
            "Tomato": 90,
            "Potato": 100,
            "Onion": 110,
            "Cotton": 160,
            "Jasmine": 120,
            "Arabian Jasmine": 120,
            "Crossandra": 100,
            "Chrysanthemum": 90
        }
        
        crop_name = farm.current_crop or "Unknown"
        duration = 120 # Default
        for key, val in CROP_DURATIONS.items():
            if key.lower() in crop_name.lower():
                duration = val
                break

        # 2. Health Score & Recommendations (Calculate first to affect growth)
        soil = db.query(models.Soil).filter(models.Soil.farm_id == id).first()
        health_score = 100
        recommendations = []
        
        if not soil:
            health_score -= 20
            recommendations.append("Add soil data to get a more accurate health score.")
        else:
            # Moisture
            if soil.moisture is not None:
                if soil.moisture < 30:
                    health_score -= 15
                    recommendations.append("Schedule irrigation immediately due to low soil moisture.")
                elif soil.moisture > 85:
                    health_score -= 10
                    recommendations.append("Avoid irrigation, soil moisture is extremely high.")
                else:
                    recommendations.append("Soil moisture is adequate. No irrigation needed today.")
            
            # pH
            if soil.ph is not None:
                if soil.ph < 5.5:
                    health_score -= 10
                    recommendations.append("Soil is too acidic. Consider applying agricultural lime.")
                elif soil.ph > 8.0:
                    health_score -= 10
                    recommendations.append("Soil is too alkaline. Consider applying sulfur.")

            # NPK
            if soil.nitrogen == "Low":
                health_score -= 10
                recommendations.append("Apply nitrogen-rich fertilizer.")
            if soil.phosphorus == "Low":
                health_score -= 5
                recommendations.append("Apply phosphorus-rich fertilizer.")
            if soil.potassium == "Low":
                health_score -= 5
                recommendations.append("Apply potassium-rich fertilizer.")
                
        # Disease Integration
        if farm.latest_disease and "healthy" not in farm.latest_disease.lower():
            health_score -= 15
            recommendations.append(f"Disease Alert ({farm.latest_disease}): Apply appropriate treatment immediately.")

        health_score = max(0, health_score)

        # 3. Crop Age and Progress
        planting_date = farm.planting_date
        now = datetime.datetime.now(timezone.utc)
        
        if sim_date:
            try:
                parsed_sim = datetime.datetime.fromisoformat(sim_date.replace('Z', '+00:00'))
                if parsed_sim.tzinfo is None:
                    parsed_sim = parsed_sim.replace(tzinfo=timezone.utc)
                now = parsed_sim
            except Exception as e:
                logger.warning(f"Invalid sim_date format {sim_date}: {e}")
        
        if planting_date:
            if planting_date.tzinfo is None:
                planting_date = planting_date.replace(tzinfo=timezone.utc)
            actual_crop_age = (now - planting_date).days
            if actual_crop_age < 0: actual_crop_age = 0
        else:
            actual_crop_age = 0

        # Apply environmental modifier to growth
        environmental_modifier = health_score / 100.0
        effective_crop_age = actual_crop_age * environmental_modifier

        progress = (effective_crop_age / duration) * 100
        if progress > 100: progress = 100
        
        harvest_days = duration - actual_crop_age
        if harvest_days < 0: harvest_days = 0

        # 4. Growth Stage
        if progress < 20:
            growth_stage = "Seedling"
        elif progress < 50:
            growth_stage = "Vegetative"
        elif progress < 70:
            growth_stage = "Branching"
        elif progress < 100:
            growth_stage = "Flowering"
        else:
            growth_stage = "Maturity / Harvest Ready"

        if progress >= 100:
            recommendations.append("Crop is ready for harvest!")

        # 5. Weather Data
        weather_data = {
            "temperature": 0,
            "humidity": 0,
            "condition": "Unknown",
            "rainfall": 0
        }
        
        from ..config import settings
        import requests
        
        if settings.weather_api_key and farm.location:
            try:
                # We'll just fetch current weather, no 404 bubbling if fails
                url = f"https://api.openweathermap.org/data/2.5/weather?q={farm.location}&appid={settings.weather_api_key}&units=metric"
                res = requests.get(url, timeout=3)
                if res.status_code == 200:
                    wdata = res.json()
                    weather_data = {
                        "temperature": wdata["main"].get("temp", 0),
                        "humidity": wdata["main"].get("humidity", 0),
                        "condition": wdata["weather"][0].get("description", "Unknown").title(),
                        "rainfall": wdata.get("rain", {}).get("1h", 0)
                    }
            except Exception as e:
                logger.warning(f"Could not fetch weather for digital twin: {e}")

        return {
            "farm": {
                "id": str(farm.id),
                "name": farm.farm_name,
                "location": farm.location,
                "area_acres": farm.farm_size
            },
            "crop": {
                "name": farm.current_crop,
                "growth_stage": growth_stage,
                "age_days": actual_crop_age,
                "growth_progress": round(progress, 1),
                "expected_harvest_days": harvest_days,
                "planting_date": planting_date.isoformat() if planting_date else None
            },
            "soil": {
                "type": farm.soil_type,
                "ph": soil.ph if soil else None,
                "moisture": soil.moisture if soil else None,
                "nitrogen": soil.nitrogen if soil else None,
                "phosphorus": soil.phosphorus if soil else None,
                "potassium": soil.potassium if soil else None
            },
            "weather": weather_data,
            "health_score": health_score,
            "recommendations": recommendations
        }

    except Exception as e:
        logger.error(f"Error fetching digital twin data: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{id}/suitability")
def get_farm_suitability(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")

        # New Profitability Engine logic
        from ..services.profitability import calculate_suitability
        
        crop = farm.current_crop or "Unknown"
        area = farm.farm_size or 1.0
        
        soil_record = db.query(models.Soil).filter(models.Soil.farm_id == id).first()
        soil_dict = {}
        if soil_record:
            soil_dict = {
                "ph": soil_record.ph,
                "nitrogen": soil_record.nitrogen,
                "moisture": soil_record.moisture
            }
            
        weather_dict = {"temperature": 28}

        analysis = calculate_suitability(
            farm_area=area,
            current_crop=crop,
            soil=soil_dict,
            weather=weather_dict
        )

        return {
            "farm_id": id,
            "crop": analysis["crop"],
            "suitability_score": "High" if analysis["suitability_score"] > 80 else "Moderate" if analysis["suitability_score"] > 60 else "Low",
            "score_percentage": analysis["suitability_score"],
            "reasons": analysis["reasons"],
            "economics": analysis["economics"],
            "land_allocation": analysis["land_allocation"]
        }

    except Exception as e:
        logger.error(f"Error fetching suitability: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
        logger.error(f"Error fetching crop suitability: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{id}/recommendation")
def get_crop_recommendation(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        farm = db.query(models.Farm).filter(models.Farm.id == id, models.Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")

        from ..services.profitability import compare_crops
        
        area = farm.farm_size or 1.0
        
        soil_record = db.query(models.Soil).filter(models.Soil.farm_id == id).first()
        soil_dict = {}
        if soil_record:
            soil_dict = {
                "ph": soil_record.ph,
                "nitrogen": soil_record.nitrogen,
                "moisture": soil_record.moisture
            }
            
        weather_dict = {"temperature": 28} # Fallback for now

        analysis = compare_crops(
            farm_area=area,
            soil=soil_dict,
            weather=weather_dict
        )

        return analysis

    except Exception as e:
        logger.error(f"Error fetching crop recommendations: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
