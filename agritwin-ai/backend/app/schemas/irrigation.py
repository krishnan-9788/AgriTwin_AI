from pydantic import BaseModel
from typing import Optional

class IrrigationRequest(BaseModel):
    farm_id: int
    light_intensity_lux: Optional[float] = None
    soil_moisture_override: Optional[float] = None

class IrrigationResponse(BaseModel):
    farm_id: int
    crop: str
    irrigation_required: bool
    water_requirement: Optional[float] = None
    unit: Optional[str] = None
    recommendation: str
    reason: str
