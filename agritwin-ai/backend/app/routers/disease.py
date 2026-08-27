from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from .. import models, database
from .auth import get_current_user
from ..services.disease import predict_disease
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/disease", tags=["disease"])

@router.post("/predict")
async def predict(
    image: UploadFile = File(...),
    farm_id: int = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File provided is not an image.")
            
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
            
        result = predict_disease(contents)
        
        # Determine if confidence is low
        if result["confidence"] < 50.0:
            result["disease"] = f"Low confidence: {result['disease']}"
            
        if farm_id is not None:
            farm = db.query(models.Farm).filter(models.Farm.id == farm_id, models.Farm.user_id == current_user.id).first()
            if farm:
                farm.latest_disease = result["disease"]
                farm.disease_confidence = result["confidence"]
                db.commit()
            
        return result
        
    except ValueError as ve:
        logger.error(f"Image validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Model prediction error: {re}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
