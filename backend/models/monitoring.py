import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    ForeignKey,
    DateTime,
    Text,
    Enum as SAEnum,
    JSON,
    Uuid,
)
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum


class EventType(str, enum.Enum):
    LARGE_OUTFLOW = "large_outflow"
    UNKNOWN_CALLER = "unknown_caller"
    TVL_DROP = "tvl_drop"
    SUSPICIOUS_INTERACTION = "suspicious_interaction"
    OTHER = "other"


class ContractStatus(str, enum.Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


class MonitoredContract(Base):
    __tablename__ = "monitored_contracts"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False)
    contract_address = Column(String(255), nullable=False)
    chain = Column(String(50), nullable=False)
    label = Column(String(255), nullable=True)
    status = Column(
        SAEnum(ContractStatus, name="contract_status"),
        default=ContractStatus.HEALTHY,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_checked = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="monitored_contracts")
    events = relationship(
        "MonitoringEvent",
        back_populates="monitored_contract",
        cascade="all, delete-orphan",
        order_by="MonitoringEvent.timestamp.desc()",
    )


class MonitoringEvent(Base):
    __tablename__ = "monitoring_events"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    monitored_contract_id = Column(
        Uuid(), ForeignKey("monitored_contracts.id"), nullable=False
    )
    event_type = Column(SAEnum(EventType, name="event_type"), nullable=False)
    severity = Column(String(20), nullable=False, default="medium")
    message = Column(Text, nullable=False)
    event_data = Column(JSON, nullable=True)
    tx_hash = Column(String(255), nullable=True)
    timestamp = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    acknowledged = Column(Boolean, default=False)

    monitored_contract = relationship("MonitoredContract", back_populates="events")
