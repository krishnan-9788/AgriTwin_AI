from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..schemas.soil import SoilCreate, SoilUpdate, SoilResponse, SoilFertilityRequest, SoilFertilityResponse
from ..services.soil_fertility import predict_soil_fertility
from ..services.soil_fertility_service import get_soil_fertility
from ..database import get_db
from ..routers.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/soil", tags=["soil"])

def get_user_farm(db: Session, farm_id: int, user_id: int):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id, models.Farm.user_id == user_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or not owned by user")
    return farm

@router.post("/", response_model=SoilResponse)
def create_soil(
    soil: SoilCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify farm ownership
    get_user_farm(db, soil.farm_id, current_user.id)

    # Check if soil data already exists
    existing_soil = db.query(models.Soil).filter(models.Soil.farm_id == soil.farm_id).first()
    if existing_soil:
        raise HTTPException(status_code=400, detail="Soil data already exists for this farm. Use PUT to update.")

    db_soil = models.Soil(**soil.model_dump())
    db.add(db_soil)
    db.commit()
    db.refresh(db_soil)
    return db_soil

@router.get("/{farm_id}", response_model=SoilResponse)
def get_soil(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Verify farm ownership
        get_user_farm(db, farm_id, current_user.id)

        soil = db.query(models.Soil).filter(models.Soil.farm_id == farm_id).first()
        if not soil:
            raise HTTPException(status_code=404, detail="Soil data not found for this farm")
        
        return soil
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching soil for farm {farm_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{farm_id}", response_model=SoilResponse)
def update_soil(
    farm_id: int,
    soil_update: SoilUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify farm ownership
    get_user_farm(db, farm_id, current_user.id)

    db_soil = db.query(models.Soil).filter(models.Soil.farm_id == farm_id).first()
    if not db_soil:
        raise HTTPException(status_code=404, detail="Soil data not found for this farm")

    update_data = soil_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_soil, key, value)

    db.commit()
    db.refresh(db_soil)
    return db_soil

@router.get("/{farm_id}/fertility")
def get_fertility(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify farm ownership
    get_user_farm(db, farm_id, current_user.id)
    
    return get_soil_fertility(db, farm_id)
