from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FarmBase(BaseModel):
    farm_name: str
    location: str
    farm_size: float
    soil_type: str
    water_source: str
    current_crop: str
    planting_date: datetime

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    location: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    current_crop: Optional[str] = None
    planting_date: Optional[datetime] = None

class FarmResponse(FarmBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
