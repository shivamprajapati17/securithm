import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean, Uuid, Text
from sqlalchemy.orm import relationship
from ..core.database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(8), nullable=False)  # First 8 chars for display (e.g. "sk_live_")
    key_hash = Column(String(255), nullable=False)  # Hashed full key
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    rate_limit_per_hour = Column(Integer, default=100)  # Requests per hour

    user = relationship("User", back_populates="api_keys")
