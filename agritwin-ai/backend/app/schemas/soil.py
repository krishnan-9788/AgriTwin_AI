from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SoilBase(BaseModel):
    soil_type: str
    moisture: float
    ph: float
    nitrogen: str
    phosphorus: str
    potassium: str
    
    n_val: Optional[float] = None
    p_val: Optional[float] = None
    k_val: Optional[float] = None
    ec: Optional[float] = None
    oc: Optional[float] = None
    s: Optional[float] = None
    zn: Optional[float] = None
    fe: Optional[float] = None
    cu: Optional[float] = None
    mn: Optional[float] = None
    b: Optional[float] = None

class SoilCreate(SoilBase):
    farm_id: int

class SoilUpdate(BaseModel):
    soil_type: Optional[str] = None
    moisture: Optional[float] = None
    ph: Optional[float] = None
    nitrogen: Optional[str] = None
    phosphorus: Optional[str] = None
    potassium: Optional[str] = None
    n_val: Optional[float] = None
    p_val: Optional[float] = None
    k_val: Optional[float] = None
    ec: Optional[float] = None
    oc: Optional[float] = None
    s: Optional[float] = None
    zn: Optional[float] = None
    fe: Optional[float] = None
    cu: Optional[float] = None
    mn: Optional[float] = None
    b: Optional[float] = None

class SoilResponse(SoilBase):
    id: int
    farm_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SoilFertilityRequest(BaseModel):
    N: float
    P: float
    K: float
    ph: float
    ec: float
    oc: float
    S: float
    zn: float
    fe: float
    cu: float
    Mn: float
    B: float

class SoilFertilityResponse(BaseModel):
    prediction: int
    fertility: str
    health_score: int
    status: str
