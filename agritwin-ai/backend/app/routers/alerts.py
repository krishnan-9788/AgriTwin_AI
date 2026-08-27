from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas.alerts import FarmAlertsResponse
from ..services.alert_service import generate_farm_alerts
from .auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/{farm_id}", response_model=FarmAlertsResponse)
def get_farm_alerts(farm_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # Check ownership
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id, models.Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found or not owned by user")
            
        return generate_farm_alerts(db, farm_id)
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch farm alerts")
