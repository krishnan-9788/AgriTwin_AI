from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.irrigation import IrrigationRequest, IrrigationResponse
from ..services.irrigation import predict_irrigation_need
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/irrigation", tags=["irrigation"])

@router.post("/predict", response_model=IrrigationResponse)
def predict_irrigation(request: IrrigationRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"[IRRIGATION] Predicting for farm_id: {request.farm_id}")
        result = predict_irrigation_need(
            db=db,
            farm_id=request.farm_id,
            light_intensity_lux=request.light_intensity_lux,
            soil_moisture_override=request.soil_moisture_override
        )
        return IrrigationResponse(**result)
    except ValueError as ve:
        logger.warning(f"[IRRIGATION] Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"[IRRIGATION] Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to predict irrigation requirement.")
