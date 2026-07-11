import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, Uuid
from sqlalchemy.orm import relationship
from ..core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    plan_id = Column(Uuid(), ForeignKey("plans.id"), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    plan = relationship("Plan", back_populates="organizations")
    users = relationship("User", back_populates="organization")
    scan_jobs = relationship("ScanJob", back_populates="organization")
    usage_meters = relationship("UsageMeter", back_populates="organization")
    monitored_contracts = relationship(
        "MonitoredContract", back_populates="organization"
    )
    team_invites = relationship("TeamInvite", back_populates="organization")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    max_scans_per_month = Column(Integer, default=50)
    max_monitored_contracts = Column(Integer, default=1)
    price_usd = Column(Float, default=0.0)

    organizations = relationship("Organization", back_populates="plan")


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    display_name = Column(String(255), nullable=True)
    github_id = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_login = Column(DateTime(timezone=True), nullable=True)
    wallet_address = Column(String(255), nullable=True)
    github_repo_token = Column(String(512), nullable=True)
    role = Column(String(20), default="member")  # admin, member, viewer
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=True)

    organization = relationship("Organization", back_populates="users")
    scan_jobs = relationship("ScanJob", back_populates="user")
    assigned_findings = relationship(
        "Finding", back_populates="assignee", foreign_keys="Finding.assigned_to"
    )
    api_keys = relationship(
        "ApiKey", back_populates="user", cascade="all, delete-orphan"
    )
    sent_invites = relationship(
        "TeamInvite", back_populates="inviter", foreign_keys="TeamInvite.invited_by"
    )
