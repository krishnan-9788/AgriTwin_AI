from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Soil(Base):
    __tablename__ = "soil_data"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    soil_type = Column(String)
    moisture = Column(Float)
    ph = Column(Float)
    nitrogen = Column(String)
    phosphorus = Column(String)
    potassium = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ML Feature Columns
    n_val = Column(Float, nullable=True)
    p_val = Column(Float, nullable=True)
    k_val = Column(Float, nullable=True)
    ec = Column(Float, nullable=True)
    oc = Column(Float, nullable=True)
    s = Column(Float, nullable=True)
    zn = Column(Float, nullable=True)
    fe = Column(Float, nullable=True)
    cu = Column(Float, nullable=True)
    mn = Column(Float, nullable=True)
    b = Column(Float, nullable=True)

    farm = relationship("Farm", back_populates="soil_data")
