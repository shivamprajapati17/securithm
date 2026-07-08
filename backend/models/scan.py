import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    DateTime,
    Text,
    Enum as SAEnum,
    Uuid,
)
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    WONT_FIX = "wont_fix"


class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=True)
    user_id = Column(Uuid(), ForeignKey("users.id"), nullable=True)
    contract_source = Column(Text, nullable=True)
    chain = Column(String(50), nullable=True, default="ethereum")
    status = Column(
        SAEnum(ScanStatus, name="scan_status"),
        default=ScanStatus.PENDING,
        index=True,
    )
    risk_score_overall = Column(String(1), nullable=True)
    contract_name = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="scan_jobs")
    user = relationship("User", back_populates="scan_jobs")
    findings = relationship(
        "Finding",
        back_populates="scan_job",
        cascade="all, delete-orphan",
        order_by="Finding.severity_order",
    )


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    scan_id = Column(Uuid(), ForeignKey("scan_jobs.id"), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(SAEnum(FindingSeverity, name="finding_severity"), nullable=False)
    severity_order = Column(Integer, nullable=False)
    line_number = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    fixed_code = Column(Text, nullable=True)
    assigned_to = Column(Uuid(), ForeignKey("users.id"), nullable=True)
    status = Column(
        SAEnum(FindingStatus, name="finding_status"),
        default=FindingStatus.OPEN,
    )
    remediation_sla = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    scan_job = relationship("ScanJob", back_populates="findings")
    assignee = relationship(
        "User", back_populates="assigned_findings", foreign_keys=[assigned_to]
    )
