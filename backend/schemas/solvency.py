from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from ..models.solvency import (
    VerificationMethod,
    VerificationStatus,
    SnapshotStatus,
    SolvencyStatus,
    AttestationStatus,
    AlertSeverity,
    AlertStatus,
)


# ─── Organization profile ────────────────────────────────────


class SolvencyOrgCreate(BaseModel):
    slug: str = Field(..., min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    display_name: str = Field(..., min_length=1, max_length=255)
    website: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = True
    required_coverage: str = "1.00"
    target_coverage: str = "1.10"
    strong_coverage: str = "1.20"


class SolvencyOrgUpdate(BaseModel):
    slug: Optional[str] = None
    display_name: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    required_coverage: Optional[str] = None
    target_coverage: Optional[str] = None
    strong_coverage: Optional[str] = None


class SolvencyOrgResponse(BaseModel):
    id: UUID
    org_id: UUID
    slug: str
    display_name: str
    website: Optional[str] = None
    description: Optional[str] = None
    is_public: bool
    methodology_version: str
    currency: str
    required_coverage: str
    target_coverage: str
    strong_coverage: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Reserve wallets ─────────────────────────────────────────


class DeclaredAsset(BaseModel):
    asset_address: Optional[str] = None
    symbol: str = "ETH"
    decimals: int = 18
    balance: Optional[str] = None


class ReserveWalletCreate(BaseModel):
    chain: str = "ethereum"
    address: str = Field(..., min_length=1, max_length=255)
    label: Optional[str] = None
    verification_method: VerificationMethod = VerificationMethod.SIGNATURE
    declared_assets: list[DeclaredAsset] = Field(default_factory=list)


class WalletSignatureSubmit(BaseModel):
    message: str
    signature: str = Field(..., min_length=10)


class ReserveWalletResponse(BaseModel):
    id: UUID
    org_id: UUID
    chain: str
    address: str
    label: Optional[str] = None
    verification_method: VerificationMethod
    verification_status: VerificationStatus
    verification_evidence: Optional[dict[str, Any]] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Liabilities ─────────────────────────────────────────────


class LiabilityEntryIn(BaseModel):
    user_ref: str = Field(..., min_length=1, max_length=200)
    balance: str = Field(..., description="USD balance, e.g. 2500.00")


class LiabilitySnapshotCreate(BaseModel):
    entries: list[LiabilityEntryIn] = Field(..., min_length=1)


class LiabilitySnapshotResponse(BaseModel):
    id: UUID
    org_id: UUID
    timestamp: datetime
    liability_root: str
    total_liabilities: str
    tree_type: str
    methodology_version: str
    user_count: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProofResponse(BaseModel):
    snapshotId: str
    leafIndex: int
    balance: str
    nonce: str
    commitment: str
    merkleProof: list[str]
    liabilityRoot: str


# ─── Verification ────────────────────────────────────────────


class ProofVerifyRequest(BaseModel):
    snapshotId: str
    leafIndex: int
    balance: str
    nonce: str
    commitment: str
    liabilityRoot: str
    merkleProof: list[str]


class ProofVerifyResponse(BaseModel):
    result: str  # "INCLUDED" | "INVALID"
    detail: str
    snapshotId: str
    liabilityRoot: str


# ─── Reserve snapshots ───────────────────────────────────────


class ReserveAssetResponse(BaseModel):
    id: UUID
    snapshot_id: UUID
    chain: str
    wallet_address: str
    asset_address: Optional[str] = None
    symbol: str
    balance: str
    price: str
    price_source: str
    price_timestamp: Optional[datetime] = None
    value_usd: str
    block_height: Optional[str] = None
    evidence_status: VerificationStatus

    model_config = {"from_attributes": True}


class ReserveSnapshotResponse(BaseModel):
    id: UUID
    org_id: UUID
    timestamp: datetime
    block_height: Optional[str] = None
    reserve_root: Optional[str] = None
    total_value_usd: Optional[str] = None
    methodology_version: str
    status: SnapshotStatus
    created_at: datetime
    assets: list[ReserveAssetResponse] = []

    model_config = {"from_attributes": True}


class SnapshotCreateResponse(BaseModel):
    snapshotId: str
    orgSlug: str
    orgName: str
    status: str
    message: str
    solvency: dict[str, Any]
    attestationId: str
    public_url: str


# ─── Solvency result ─────────────────────────────────────────


class SolvencyResultResponse(BaseModel):
    snapshotId: str
    reserveValueUsd: str
    liabilityValueUsd: str
    coverageRatio: str
    coveragePercent: str
    status: SolvencyStatus
    requiredCoverage: str
    targetCoverage: str
    strongCoverage: str


# ─── Attestations ────────────────────────────────────────────


class AttestationResponse(BaseModel):
    id: UUID
    org_id: UUID
    snapshot_id: Optional[UUID] = None
    liability_snapshot_id: Optional[UUID] = None
    reserve_root: Optional[str] = None
    liability_root: Optional[str] = None
    reserve_value: str
    liability_value: str
    coverage_ratio: str
    status: AttestationStatus
    signature: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    published_tx: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PublishOnChainRequest(BaseModel):
    chain: str = "ethereum"
    rpc_url: Optional[str] = None
    contract_address: Optional[str] = None


class PublishOnChainResponse(BaseModel):
    attestationId: str
    chain: str
    contractAddress: str
    txHash: str
    explorerUrl: str
    status: str


class OnChainStatusResponse(BaseModel):
    published: bool
    txHash: Optional[str] = None
    chain: Optional[str] = None
    contractAddress: Optional[str] = None
    explorerUrl: Optional[str] = None
    verified: Optional[bool] = None
    stored: Optional[dict[str, Any]] = None
    detail: Optional[str] = None


# ─── Alerts ──────────────────────────────────────────────────


class SolvencyAlertResponse(BaseModel):
    id: UUID
    org_id: UUID
    alert_type: str
    severity: AlertSeverity
    message: str
    value: Optional[str] = None
    threshold: Optional[str] = None
    status: AlertStatus
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Public dashboard ────────────────────────────────────────


class PublicDashboardResponse(BaseModel):
    orgSlug: str
    orgName: str
    website: Optional[str] = None
    description: Optional[str] = None
    methodologyVersion: str
    currency: str
    hasAttestation: bool
    latestAttestation: Optional[dict[str, Any]] = None
    solvency: Optional[dict[str, Any]] = None
    reserves: list[dict[str, Any]] = Field(default_factory=list)
    wallets: list[dict[str, Any]] = Field(default_factory=list)
    liabilityRoot: Optional[str] = None
    liabilityTotal: Optional[str] = None
    liabilityUserCount: Optional[str] = None
    snapshotTimestamp: Optional[datetime] = None
    blockHeight: Optional[str] = None
    priceSources: list[str] = Field(default_factory=list)
    requiredCoverage: str = "1.00"
    targetCoverage: str = "1.10"
    strongCoverage: str = "1.20"
