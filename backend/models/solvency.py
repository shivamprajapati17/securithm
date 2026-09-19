import uuid
import enum
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


class VerificationMethod(str, enum.Enum):
    """How wallet control was established (blueprint section 8)."""

    SIGNATURE = "signature"
    TRANSACTION = "transaction"
    CUSTODIAN_ATTESTATION = "custodian_attestation"


class VerificationStatus(str, enum.Enum):
    """Evidence quality label shown on every reserve (blueprint section 8)."""

    DIRECTLY_VERIFIED = "directly_verified"
    ATTESTED = "attested"
    UNVERIFIED = "unverified"


class SnapshotStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class SolvencyStatus(str, enum.Enum):
    SOLVENT = "solvent"
    UNDER_COLLATERALIZED = "under-collateralized"


class AttestationStatus(str, enum.Enum):
    VERIFIED = "verified"
    PENDING = "pending"
    EXPIRED = "expired"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class SolvencyOrg(Base):
    """Public-facing solvency profile for an organization (blueprint section 17/18)."""

    __tablename__ = "solvency_orgs"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, unique=True)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    methodology_version = Column(String(20), default="0.1", nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    # Configurable solvency thresholds (blueprint section 14)
    required_coverage = Column(String(20), default="1.00", nullable=False)
    target_coverage = Column(String(20), default="1.10", nullable=False)
    strong_coverage = Column(String(20), default="1.20", nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    organization = relationship("Organization", back_populates="solvency_profile")


class ReserveWallet(Base):
    """A reserve wallet owned/controlled by the organization (blueprint section 5.1/8)."""

    __tablename__ = "reserve_wallets"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, index=True)
    chain = Column(String(50), nullable=False, default="ethereum")
    address = Column(String(255), nullable=False)
    label = Column(String(255), nullable=True)
    # Method A/B/C (blueprint section 8)
    verification_method = Column(
        SAEnum(VerificationMethod, name="verification_method"),
        default=VerificationMethod.SIGNATURE,
        nullable=False,
    )
    verification_status = Column(
        SAEnum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.UNVERIFIED,
        nullable=False,
    )
    # Stores the challenge message, submitted signature, attester, tx hash, etc.
    verification_evidence = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ReserveSnapshot(Base):
    """A point-in-time snapshot of on-chain reserve balances (blueprint section 5.1)."""

    __tablename__ = "reserve_snapshots"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, index=True)
    timestamp = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    block_height = Column(String(50), nullable=True)
    reserve_root = Column(String(130), nullable=True)
    total_value_usd = Column(String(50), nullable=True)
    methodology_version = Column(String(20), default="0.1", nullable=False)
    status = Column(
        SAEnum(SnapshotStatus, name="snapshot_status"),
        default=SnapshotStatus.PENDING,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    assets = relationship(
        "ReserveAsset",
        back_populates="snapshot",
        cascade="all, delete-orphan",
        order_by="ReserveAsset.value_usd.desc()",
    )


class ReserveAsset(Base):
    """Individual reserve balance captured in a snapshot (blueprint section 5.1)."""

    __tablename__ = "reserve_assets"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    snapshot_id = Column(
        Uuid(), ForeignKey("reserve_snapshots.id"), nullable=False, index=True
    )
    chain = Column(String(50), nullable=False, default="ethereum")
    wallet_address = Column(String(255), nullable=False)
    asset_address = Column(String(255), nullable=True)  # NULL for native asset
    symbol = Column(String(30), nullable=False)
    balance = Column(String(60), nullable=False)  # human-readable decimal string
    price = Column(String(40), nullable=False)
    price_source = Column(String(80), nullable=False)
    price_timestamp = Column(DateTime(timezone=True), nullable=True)
    value_usd = Column(String(50), nullable=False)
    block_height = Column(String(50), nullable=True)
    evidence_status = Column(
        SAEnum(VerificationStatus, name="asset_evidence_status"),
        default=VerificationStatus.UNVERIFIED,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    snapshot = relationship("ReserveSnapshot", back_populates="assets")


class LiabilitySnapshot(Base):
    """A commitment to the organization's liabilities via a Merkle Sum Tree."""

    __tablename__ = "liability_snapshots"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, index=True)
    timestamp = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    liability_root = Column(String(130), nullable=False)
    total_liabilities = Column(String(60), nullable=False)  # USD
    tree_type = Column(String(40), default="merkle_sum_tree", nullable=False)
    methodology_version = Column(String(20), default="0.1", nullable=False)
    user_count = Column(String(20), default="0", nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    leaves = relationship(
        "LiabilityEntry",
        back_populates="snapshot",
        cascade="all, delete-orphan",
        order_by="LiabilityEntry.leaf_index",
    )


class LiabilityEntry(Base):
    """A single leaf in the Merkle Sum Tree (blueprint section 9/10)."""

    __tablename__ = "liability_entries"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    snapshot_id = Column(
        Uuid(), ForeignKey("liability_snapshots.id"), nullable=False, index=True
    )
    leaf_index = Column(String(20), nullable=False)
    # Public-safe reference for the user (hashed identifier, never a raw customer id)
    user_ref = Column(String(130), nullable=False, index=True)
    balance = Column(String(60), nullable=False)  # USD, human-readable
    nonce = Column(String(130), nullable=False)
    commitment = Column(String(130), nullable=False)  # H(user_ref || balance || nonce)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    snapshot = relationship("LiabilitySnapshot", back_populates="leaves")


class Attestation(Base):
    """Signed, immutable attestation record (blueprint section 15)."""

    __tablename__ = "attestations"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, index=True)
    snapshot_id = Column(Uuid(), ForeignKey("reserve_snapshots.id"), nullable=True)
    liability_snapshot_id = Column(
        Uuid(), ForeignKey("liability_snapshots.id"), nullable=True
    )
    reserve_root = Column(String(130), nullable=True)
    liability_root = Column(String(130), nullable=True)
    reserve_value = Column(String(50), nullable=False)
    liability_value = Column(String(50), nullable=False)
    coverage_ratio = Column(String(20), nullable=False)
    status = Column(
        SAEnum(AttestationStatus, name="attestation_status"),
        default=AttestationStatus.VERIFIED,
        nullable=False,
    )
    signature = Column(Text, nullable=True)
    # Full canonical attestation payload (the verifiable evidence chain)
    payload = Column(JSON, nullable=True)
    # On-chain publication (blueprint section 16) — set when the commitment
    # has been published to the SecurithmAttestation contract.
    published_tx = Column(String(130), nullable=True)
    published_chain = Column(String(50), nullable=True)
    published_contract_address = Column(String(130), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at = Column(DateTime(timezone=True), nullable=True)


class SolvencyAlert(Base):
    """Monitoring alert generated from solvency checks (blueprint section 21/22)."""

    __tablename__ = "solvency_alerts"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    org_id = Column(Uuid(), ForeignKey("organizations.id"), nullable=False, index=True)
    alert_type = Column(String(60), nullable=False)  # coverage, reserve_outflow, wallet
    severity = Column(
        SAEnum(AlertSeverity, name="alert_severity"),
        default=AlertSeverity.MEDIUM,
        nullable=False,
    )
    message = Column(Text, nullable=False)
    value = Column(String(60), nullable=True)
    threshold = Column(String(60), nullable=True)
    status = Column(
        SAEnum(AlertStatus, name="alert_status"),
        default=AlertStatus.OPEN,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
