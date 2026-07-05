import uuid
from sqlalchemy import (
    Column, String, Integer, ForeignKey, Uuid
)
from sqlalchemy.orm import relationship
from ..core.database import Base


class UsageMeter(Base):
    __tablename__ = "usage_meters"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False)
    period = Column(String(7), nullable=False)  # YYYY-MM
    scans_used = Column(Integer, default=0)
    api_calls_used = Column(Integer, default=0)

    organization = relationship("Organization", back_populates="usage_meters")
