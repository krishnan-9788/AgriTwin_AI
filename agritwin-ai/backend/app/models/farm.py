from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    farm_name = Column(String, index=True)
    location = Column(String)
    farm_size = Column(Float)
    soil_type = Column(String)
    water_source = Column(String)
    current_crop = Column(String)
    planting_date = Column(DateTime)
    latest_disease = Column(String, nullable=True)
    disease_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="farms")
    soil_data = relationship("Soil", back_populates="farm", uselist=False, cascade="all, delete-orphan")
