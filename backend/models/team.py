import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Uuid, Text
from sqlalchemy.orm import relationship
from ..core.database import Base


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False)
    invited_by = Column(Uuid(), ForeignKey("users.id"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, accepted, declined, expired
    message = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="team_invites")
    inviter = relationship("User", back_populates="sent_invites")
