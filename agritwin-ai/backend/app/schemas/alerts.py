from pydantic import BaseModel
from typing import List, Optional

class AlertItem(BaseModel):
    type: str # irrigation, weather, soil, temperature
    severity: str # info, warning, critical
    title: str
    message: str
    value: Optional[str] = None
    
class FarmAlertsResponse(BaseModel):
    farm_id: int
    farm_name: str
    location: str
    crop: str
    alerts: List[AlertItem]
