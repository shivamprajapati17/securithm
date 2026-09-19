"""Securithm Solvency API — Proof of Reserves, Proof of Liabilities, Proof of Solvency.

Implements the blueprint API surface (section 19) plus organization setup,
wallet ownership verification, liability import, attestations, and the public
dashboard data endpoint.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...core.database import get_db
from ...models.solvency import (
    Attestation,
    LiabilityEntry,
    LiabilitySnapshot,
    ReserveAsset,
    ReserveSnapshot,
    ReserveWallet,
    SolvencyAlert,
    SolvencyOrg,
    SolvencyStatus,
    VerificationStatus,
)
from ...schemas.solvency import (
    AttestationResponse,
    LiabilitySnapshotCreate,
    LiabilitySnapshotResponse,
    OnChainStatusResponse,
    ProofVerifyRequest,
    ProofVerifyResponse,
    PublicDashboardResponse,
    PublishOnChainRequest,
    PublishOnChainResponse,
    ReserveAssetResponse,
    ReserveSnapshotResponse,
    ReserveWalletCreate,
    ReserveWalletResponse,
    SnapshotCreateResponse,
    SolvencyAlertResponse,
    SolvencyOrgCreate,
    SolvencyOrgResponse,
    SolvencyOrgUpdate,
    SolvencyResultResponse,
    UserProofResponse,
    WalletSignatureSubmit,
)
from ...services.solvency import onchain as onchain_service
from ...services.solvency.demo import seed_demo_organization
from ...services.solvency.engine import SolvencyEngine, _to_decimal
from ...services.solvency.export import (
    build_attestation_document,
    render_attestation_pdf,
)
from ...services.solvency.reserve import ReserveEngine
from ..v1.auth import get_current_user

settings = get_settings()
router = APIRouter(tags=["solvency"])


# ─── Helpers ─────────────────────────────────────────────


def _get_org_profile(db: Session, org_id: UUID) -> SolvencyOrg:
    org = db.query(SolvencyOrg).filter(SolvencyOrg.org_id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=404,
            detail="No solvency profile for this organization. Create one first.",
        )
    return org


def _get_public_org(db: Session, slug: str) -> SolvencyOrg:
    org = db.query(SolvencyOrg).filter(SolvencyOrg.slug == slug).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not org.is_public:
        raise HTTPException(status_code=403, detail="Organization is not public")
    return org


def _get_public_snapshot_org(db: Session, org_id: UUID) -> SolvencyOrg:
    """Return the org for a snapshot, gated on is_public (privacy for private orgs)."""
    org = db.query(SolvencyOrg).filter(SolvencyOrg.org_id == org_id).first()
    if not org or not org.is_public:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return org


# ─── Organization profile ────────────────────────────────


@router.post("/solvency/profile", response_model=SolvencyOrgResponse, status_code=201)
async def create_solvency_profile(
    data: SolvencyOrgCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create the public solvency profile for the current user's organization."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")

    if db.query(SolvencyOrg).filter(SolvencyOrg.org_id == current_user.org_id).first():
        raise HTTPException(status_code=409, detail="Solvency profile already exists")

    if db.query(SolvencyOrg).filter(SolvencyOrg.slug == data.slug).first():
        raise HTTPException(status_code=409, detail="Slug already in use")

    org = SolvencyOrg(
        org_id=current_user.org_id,
        slug=data.slug,
        display_name=data.display_name,
        website=data.website,
        description=data.description,
        is_public=data.is_public,
        required_coverage=data.required_coverage,
        target_coverage=data.target_coverage,
        strong_coverage=data.strong_coverage,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/solvency/profile", response_model=SolvencyOrgResponse)
async def get_solvency_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's solvency profile."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    return _get_org_profile(db, current_user.org_id)


@router.patch("/solvency/profile", response_model=SolvencyOrgResponse)
async def update_solvency_profile(
    data: SolvencyOrgUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's solvency profile."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    org = _get_org_profile(db, current_user.org_id)

    if data.slug is not None and data.slug != org.slug:
        if db.query(SolvencyOrg).filter(SolvencyOrg.slug == data.slug).first():
            raise HTTPException(status_code=409, detail="Slug already in use")
        org.slug = data.slug
    if data.display_name is not None:
        org.display_name = data.display_name
    if data.website is not None:
        org.website = data.website
    if data.description is not None:
        org.description = data.description
    if data.is_public is not None:
        org.is_public = data.is_public
    if data.required_coverage is not None:
        org.required_coverage = data.required_coverage
    if data.target_coverage is not None:
        org.target_coverage = data.target_coverage
    if data.strong_coverage is not None:
        org.strong_coverage = data.strong_coverage

    db.commit()
    db.refresh(org)
    return org


# ─── Reserve wallets ─────────────────────────────────────


@router.post("/solvency/wallets", response_model=ReserveWalletResponse, status_code=201)
async def add_reserve_wallet(
    data: ReserveWalletCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register a reserve wallet for the organization.

    Wallets start as UNVERIFIED. To verify control, request a challenge and
    submit a signed message (POST /solvency/wallets/{id}/verify-signature).
    Wallets can also carry `declared_assets` (simulated balances) for demo
    purposes — these are always labeled with their evidence status.
    """
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    _get_org_profile(db, current_user.org_id)

    wallet = ReserveWallet(
        org_id=current_user.org_id,
        chain=data.chain,
        address=data.address,
        label=data.label,
        verification_method=data.verification_method,
        verification_status=VerificationStatus.UNVERIFIED,
        verification_evidence={
            "declared_assets": [a.model_dump() for a in data.declared_assets]
            if data.declared_assets
            else []
        },
    )
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.get("/solvency/wallets", response_model=list[ReserveWalletResponse])
async def list_reserve_wallets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the organization's reserve wallets."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    return (
        db.query(ReserveWallet)
        .filter(ReserveWallet.org_id == current_user.org_id)
        .order_by(ReserveWallet.created_at)
        .all()
    )


@router.get("/solvency/wallets/{wallet_id}/challenge")
async def get_wallet_challenge(
    wallet_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a challenge message the wallet owner must sign (Method A)."""
    wallet = db.get(ReserveWallet, wallet_id)
    if not wallet or wallet.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Wallet not found")

    engine = ReserveEngine()
    challenge = engine.create_challenge(wallet.address)
    # Persist the challenge so verification can bind to this exact message
    evidence = wallet.verification_evidence or {}
    evidence["pending_challenge"] = challenge
    wallet.verification_evidence = evidence
    db.commit()

    return {"message": challenge["message"], "walletAddress": wallet.address}


@router.post(
    "/solvency/wallets/{wallet_id}/verify-signature",
    response_model=ReserveWalletResponse,
)
async def verify_wallet_signature(
    wallet_id: UUID,
    data: WalletSignatureSubmit,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify an EIP-191 signature proving control of the reserve wallet."""
    wallet = db.get(ReserveWallet, wallet_id)
    if not wallet or wallet.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Wallet not found")

    engine = ReserveEngine()
    valid = engine.verify_signature(wallet.address, data.message, data.signature)
    if not valid:
        raise HTTPException(
            status_code=400,
            detail="Signature does not match the wallet address",
        )

    wallet.verification_status = VerificationStatus.DIRECTLY_VERIFIED
    evidence = wallet.verification_evidence or {}
    evidence.update(
        {
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verified_message": data.message,
            "verified_by": "signature",
        }
    )
    wallet.verification_evidence = evidence
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post(
    "/solvency/wallets/{wallet_id}/attest",
    response_model=ReserveWalletResponse,
)
async def attest_reserve_wallet(
    wallet_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a wallet as ATTESTED (custodian attestation, Method C)."""
    wallet = db.get(ReserveWallet, wallet_id)
    if not wallet or wallet.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Wallet not found")

    wallet.verification_status = VerificationStatus.ATTESTED
    evidence = wallet.verification_evidence or {}
    evidence["attested_at"] = datetime.now(timezone.utc).isoformat()
    wallet.verification_evidence = evidence
    db.commit()
    db.refresh(wallet)
    return wallet


@router.delete("/solvency/wallets/{wallet_id}", status_code=204)
async def delete_reserve_wallet(
    wallet_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a reserve wallet."""
    wallet = db.get(ReserveWallet, wallet_id)
    if not wallet or wallet.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Wallet not found")
    db.delete(wallet)
    db.commit()


# ─── Liabilities ─────────────────────────────────────────


@router.post(
    "/solvency/liabilities",
    response_model=LiabilitySnapshotResponse,
    status_code=201,
)
async def create_liability_snapshot(
    data: LiabilitySnapshotCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Commit to a liability dataset via a Merkle Sum Tree.

    Accepts a list of (user_ref, balance_usd) entries. Raw customer balances are
    never exposed — only the root commitment and per-user proofs.
    """
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    org = _get_org_profile(db, current_user.org_id)

    entries = [(e.user_ref, e.balance) for e in data.entries]
    engine = SolvencyEngine(db)
    try:
        snapshot = engine.create_liability_snapshot(org, entries)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return snapshot


@router.get("/solvency/liabilities", response_model=list[LiabilitySnapshotResponse])
async def list_liability_snapshots(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the organization's liability commitments."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    return (
        db.query(LiabilitySnapshot)
        .filter(LiabilitySnapshot.org_id == current_user.org_id)
        .order_by(LiabilitySnapshot.created_at.desc())
        .all()
    )


@router.get(
    "/solvency/liabilities/{snapshot_id}/proof",
    response_model=UserProofResponse,
)
async def get_user_proof(
    snapshot_id: UUID,
    user_ref: str = Query(..., description="The user's public reference"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a private inclusion proof for a user (blueprint section 10)."""
    snapshot = db.get(LiabilitySnapshot, snapshot_id)
    if not snapshot or snapshot.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Liability snapshot not found")

    engine = SolvencyEngine(db)
    proof = engine.get_user_proof(snapshot, user_ref)
    if not proof:
        raise HTTPException(status_code=404, detail="User not found in snapshot")
    return proof


# ─── Snapshots (full pipeline) ──────────────────────────


@router.post("/solvency/snapshots", response_model=SnapshotCreateResponse)
async def generate_solvency_snapshot(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run the full pipeline: fetch reserves, value assets, commit liabilities,
    compute solvency, sign an attestation, and generate monitoring alerts."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    org = _get_org_profile(db, current_user.org_id)

    engine = SolvencyEngine(db)
    try:
        result = await engine.run_full_snapshot(org)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Snapshot generation failed: {e}")

    solvency = result["solvency"]
    return SnapshotCreateResponse(
        snapshotId=str(result["reserve_snapshot"].id),
        orgSlug=org.slug,
        orgName=org.display_name,
        status="completed",
        message="Snapshot generated and attestation signed",
        solvency={
            "reserveValueUsd": str(solvency["reserve_value_usd"]),
            "liabilityValueUsd": str(solvency["liability_value_usd"]),
            "coverageRatio": str(solvency["coverage_ratio"]),
            "coveragePercent": str(solvency["coverage_percent"]),
            "status": solvency["status"].value,
            "requiredCoverage": str(solvency["required_coverage"]),
            "targetCoverage": str(solvency["target_coverage"]),
            "strongCoverage": str(solvency["strong_coverage"]),
        },
        attestationId=str(result["attestation"].id),
        public_url=f"/solvency/{org.slug}",
    )


@router.get("/solvency/snapshots", response_model=list[ReserveSnapshotResponse])
async def list_reserve_snapshots(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the organization's reserve snapshots."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    return (
        db.query(ReserveSnapshot)
        .filter(ReserveSnapshot.org_id == current_user.org_id)
        .order_by(ReserveSnapshot.created_at.desc())
        .all()
    )


@router.get("/solvency/snapshots/{snapshot_id}", response_model=ReserveSnapshotResponse)
async def get_reserve_snapshot(
    snapshot_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a reserve snapshot with its asset breakdown."""
    snapshot = db.get(ReserveSnapshot, snapshot_id)
    if not snapshot or snapshot.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snapshot


# ─── Alerts ─────────────────────────────────────────────


@router.get("/solvency/alerts", response_model=list[SolvencyAlertResponse])
async def list_solvency_alerts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List monitoring alerts for the organization."""
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User has no organization")
    return (
        db.query(SolvencyAlert)
        .filter(SolvencyAlert.org_id == current_user.org_id)
        .order_by(SolvencyAlert.created_at.desc())
        .limit(100)
        .all()
    )


# ─── Blueprint public endpoints ─────────────────────────


@router.get("/solvency/public/{slug}", response_model=PublicDashboardResponse)
async def get_public_dashboard(slug: str, db: Session = Depends(get_db)):
    """Public transparency dashboard data for an organization (section 17/18)."""
    org = _get_public_org(db, slug)

    latest_att = (
        db.query(Attestation)
        .filter(Attestation.org_id == org.org_id)
        .order_by(Attestation.created_at.desc())
        .first()
    )
    if not latest_att:
        return PublicDashboardResponse(
            orgSlug=org.slug,
            orgName=org.display_name,
            website=org.website,
            description=org.description,
            methodologyVersion=org.methodology_version,
            currency=org.currency,
            hasAttestation=False,
            requiredCoverage=org.required_coverage,
            targetCoverage=org.target_coverage,
            strongCoverage=org.strong_coverage,
        )

    # Solvency summary
    reserve_value = _to_decimal(latest_att.reserve_value)
    liability_value = _to_decimal(latest_att.liability_value)
    ratio = reserve_value / liability_value if liability_value > 0 else Decimal("0")

    # Reserves breakdown
    assets = (
        db.query(ReserveAsset)
        .filter(ReserveAsset.snapshot_id == latest_att.snapshot_id)
        .all()
    )
    reserves = [
        {
            "wallet": a.wallet_address,
            "symbol": a.symbol,
            "balance": a.balance,
            "price": a.price,
            "priceSource": a.price_source,
            "valueUsd": a.value_usd,
            "evidenceStatus": a.evidence_status.value,
            "blockHeight": a.block_height,
        }
        for a in assets
    ]

    wallets = [
        {
            "address": w.address,
            "label": w.label,
            "chain": w.chain,
            "verificationStatus": w.verification_status.value,
            "verificationMethod": w.verification_method.value,
        }
        for w in (
            db.query(ReserveWallet).filter(ReserveWallet.org_id == org.org_id).all()
        )
    ]

    liability = (
        db.query(LiabilitySnapshot)
        .filter(LiabilitySnapshot.org_id == org.org_id)
        .order_by(LiabilitySnapshot.created_at.desc())
        .first()
    )

    block_height = None
    if latest_att.snapshot_id:
        snap = db.get(ReserveSnapshot, latest_att.snapshot_id)
        block_height = snap.block_height if snap else None

    price_sources = sorted({a.price_source for a in assets})

    return PublicDashboardResponse(
        orgSlug=org.slug,
        orgName=org.display_name,
        website=org.website,
        description=org.description,
        methodologyVersion=org.methodology_version,
        currency=org.currency,
        hasAttestation=True,
        latestAttestation={
            "id": str(latest_att.id),
            "reserveRoot": latest_att.reserve_root,
            "liabilityRoot": latest_att.liability_root,
            "coverageRatio": latest_att.coverage_ratio,
            "status": latest_att.status.value,
            "createdAt": latest_att.created_at.isoformat(),
            "expiresAt": latest_att.expires_at.isoformat()
            if latest_att.expires_at
            else None,
            "signature": latest_att.signature,
            "payload": latest_att.payload,
        },
        solvency={
            "reserveValueUsd": str(reserve_value.quantize(Decimal("0.01"))),
            "liabilityValueUsd": str(liability_value.quantize(Decimal("0.01"))),
            "coverageRatio": str(ratio.quantize(Decimal("0.0001"))),
            "coveragePercent": str((ratio * 100).quantize(Decimal("0.01"))),
            "status": (
                "SOLVENT"
                if ratio >= _to_decimal(org.required_coverage)
                else "UNDER-COLLATERALIZED"
            ),
        },
        reserves=reserves,
        wallets=wallets,
        liabilityRoot=liability.liability_root if liability else None,
        liabilityTotal=liability.total_liabilities if liability else None,
        liabilityUserCount=liability.user_count if liability else None,
        snapshotTimestamp=latest_att.created_at,
        blockHeight=block_height,
        priceSources=price_sources,
        requiredCoverage=org.required_coverage,
        targetCoverage=org.target_coverage,
        strongCoverage=org.strong_coverage,
    )


@router.get("/solvency/snapshot/{snapshot_id}", response_model=SolvencyResultResponse)
async def get_solvency_result(snapshot_id: UUID, db: Session = Depends(get_db)):
    """Get the solvency result for a reserve snapshot (public)."""
    snapshot = db.get(ReserveSnapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    org = db.query(SolvencyOrg).filter(SolvencyOrg.org_id == snapshot.org_id).first()
    if not org or not org.is_public:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    att = (
        db.query(Attestation)
        .filter(Attestation.snapshot_id == snapshot_id)
        .order_by(Attestation.created_at.desc())
        .first()
    )
    if not att:
        raise HTTPException(status_code=404, detail="No attestation for snapshot")

    reserve_value = _to_decimal(att.reserve_value)
    liability_value = _to_decimal(att.liability_value)
    ratio = reserve_value / liability_value if liability_value > 0 else Decimal("0")

    return SolvencyResultResponse(
        snapshotId=str(snapshot_id),
        reserveValueUsd=str(reserve_value.quantize(Decimal("0.01"))),
        liabilityValueUsd=str(liability_value.quantize(Decimal("0.01"))),
        coverageRatio=str(ratio.quantize(Decimal("0.0001"))),
        coveragePercent=str((ratio * 100).quantize(Decimal("0.01"))),
        status=(
            SolvencyStatus.SOLVENT
            if ratio >= _to_decimal(org.required_coverage)
            else SolvencyStatus.UNDER_COLLATERALIZED
        ),
        requiredCoverage=org.required_coverage,
        targetCoverage=org.target_coverage,
        strongCoverage=org.strong_coverage,
    )


@router.get(
    "/solvency/attestation/{attestation_id}", response_model=AttestationResponse
)
async def get_attestation(
    attestation_id: UUID,
    verify: bool = Query(default=False, description="Re-verify the signature"),
    db: Session = Depends(get_db),
):
    """Get a signed attestation by ID (public, is_public-gated)."""
    att = db.get(Attestation, attestation_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attestation not found")
    _get_public_snapshot_org(db, att.org_id)

    if verify:
        engine = SolvencyEngine(db)
        if not engine.verify_attestation_signature(att):
            raise HTTPException(
                status_code=400, detail="Attestation signature verification failed"
            )
    return att


@router.get("/solvency/attestation/{attestation_id}/export")
async def export_attestation(
    attestation_id: UUID,
    format: str = Query(default="json", pattern="^(json|pdf)$"),
    db: Session = Depends(get_db),
):
    """Export a signed attestation as a JSON document or a PDF (section 15).

    Both formats contain only aggregate, non-sensitive data. Public endpoints
    are is_public-gated like the rest of the transparency surface.
    """
    att = db.get(Attestation, attestation_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attestation not found")
    org = _get_public_snapshot_org(db, att.org_id)

    document = build_attestation_document(att, org)
    filename = f"attestation_{att.id}.{format}"

    if format == "json":
        content = json.dumps(document, indent=2, default=str)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    pdf_bytes = render_attestation_pdf(document)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/solvency/attestation/{attestation_id}/publish",
    response_model=PublishOnChainResponse,
)
async def publish_attestation_onchain(
    attestation_id: UUID,
    data: PublishOnChainRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Publish an attestation commitment on-chain (management, org-authed).

    The signer key is always read from server configuration — never accepted
    over the API. RPC URL and contract address can be overridden per-request
    (useful for testnets) or come from settings.
    """
    att = db.get(Attestation, attestation_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attestation not found")
    if not current_user.org_id or att.org_id != current_user.org_id:
        raise HTTPException(
            status_code=403, detail="Attestation belongs to another organization"
        )
    if att.published_tx:
        raise HTTPException(
            status_code=409, detail="Attestation already published on-chain"
        )

    rpc_url = data.rpc_url or settings.solvency_chain_rpc_url
    contract_address = data.contract_address or settings.solvency_chain_contract_address
    signer_key = settings.solvency_chain_signer_key
    if not rpc_url:
        raise HTTPException(
            status_code=400,
            detail="No RPC URL configured (set SOLVENCY_CHAIN_RPC_URL)",
        )
    if not contract_address:
        raise HTTPException(
            status_code=400,
            detail="No contract address configured (set SOLVENCY_CHAIN_CONTRACT_ADDRESS)",
        )
    if not signer_key:
        raise HTTPException(
            status_code=400,
            detail="No signer key configured (set SOLVENCY_CHAIN_SIGNER_KEY)",
        )

    try:
        tx_hash = await onchain_service.publish_attestation(
            att,
            rpc_url=rpc_url,
            contract_address=contract_address,
            signer_key=signer_key,
        )
    except onchain_service.OnChainError as exc:
        raise HTTPException(status_code=502, detail=f"On-chain publish failed: {exc}")

    att.published_tx = tx_hash
    att.published_chain = data.chain
    att.published_contract_address = contract_address
    db.commit()
    db.refresh(att)

    return PublishOnChainResponse(
        attestationId=str(att.id),
        chain=data.chain,
        contractAddress=contract_address,
        txHash=tx_hash,
        explorerUrl=onchain_service.tx_explorer_url(data.chain, tx_hash),
        status="published",
    )


@router.get(
    "/solvency/attestation/{attestation_id}/onchain",
    response_model=OnChainStatusResponse,
)
async def get_attestation_onchain_status(
    attestation_id: UUID,
    db: Session = Depends(get_db),
):
    """Public on-chain verification of a published attestation.

    Reads the stored commitment back from the contract (eth_call) and compares
    it to the signed payload. Returns verified=true only when the on-chain
    roots match the published attestation.
    """
    att = db.get(Attestation, attestation_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attestation not found")
    _get_public_snapshot_org(db, att.org_id)

    if not att.published_tx:
        return OnChainStatusResponse(
            published=False,
            detail="Attestation has not been published on-chain",
        )

    rpc_url = settings.solvency_chain_rpc_url
    contract_address = (
        att.published_contract_address or settings.solvency_chain_contract_address
    )
    if not rpc_url or not contract_address:
        return OnChainStatusResponse(
            published=True,
            txHash=att.published_tx,
            chain=att.published_chain,
            contractAddress=contract_address or None,
            explorerUrl=onchain_service.tx_explorer_url(
                att.published_chain, att.published_tx
            ),
            verified=None,
            detail="On-chain verification is not configured on this deployment",
        )

    payload = att.payload or {}
    attestation_id_str = payload.get("attestationId") or f"att_{att.id}"
    try:
        onchain = await onchain_service.fetch_onchain_attestation(
            rpc_url, contract_address, attestation_id_str
        )
    except onchain_service.OnChainError as exc:
        raise HTTPException(status_code=502, detail=f"On-chain lookup failed: {exc}")

    expected_reserve = (payload.get("reserveRoot") or att.reserve_root or "").lower()
    expected_liability = (
        payload.get("liabilityRoot") or att.liability_root or ""
    ).lower()
    match = bool(
        onchain["exists"]
        and onchain["reserveRoot"].lower() == expected_reserve
        and onchain["liabilityRoot"].lower() == expected_liability
    )

    stored = {
        "reserveRoot": onchain["reserveRoot"],
        "liabilityRoot": onchain["liabilityRoot"],
        "reserveValueUsd": onchain_service.cents_to_usd(onchain["reserveValueCents"]),
        "liabilityValueUsd": onchain_service.cents_to_usd(
            onchain["liabilityValueCents"]
        ),
        "timestamp": datetime.fromtimestamp(
            onchain["timestamp"], tz=timezone.utc
        ).isoformat()
        if onchain["timestamp"]
        else None,
    }

    return OnChainStatusResponse(
        published=True,
        txHash=att.published_tx,
        chain=att.published_chain,
        contractAddress=contract_address,
        explorerUrl=onchain_service.tx_explorer_url(
            att.published_chain, att.published_tx
        ),
        verified=match,
        stored=stored,
        detail=(
            "On-chain commitment matches the published attestation"
            if match
            else "On-chain commitment does not match the published attestation"
        ),
    )


@router.post("/solvency/liabilities/verify", response_model=ProofVerifyResponse)
async def verify_user_proof(data: ProofVerifyRequest, db: Session = Depends(get_db)):
    """Verify a user's Merkle proof against the published liability root.

    Returns INCLUDED when the proof reconstructs the published root, INVALID
    otherwise. This is the public, independently-repeatable check (section 10).
    """
    snapshot = db.get(LiabilitySnapshot, UUID(data.snapshotId))
    if not snapshot:
        raise HTTPException(status_code=404, detail="Liability snapshot not found")

    from ...services.solvency.crypto import verify_liability_proof

    # The provided liabilityRoot must match the published root for the snapshot
    if data.liabilityRoot.lower() != snapshot.liability_root.lower():
        return ProofVerifyResponse(
            result="INVALID",
            detail="Provided liability root does not match the published snapshot",
            snapshotId=str(snapshot.id),
            liabilityRoot=snapshot.liability_root,
        )

    # The leaf at this index must exist and its commitment must match the payload
    leaf = (
        db.query(LiabilityEntry)
        .filter(
            LiabilityEntry.snapshot_id == snapshot.id,
            LiabilityEntry.leaf_index == str(data.leafIndex),
        )
        .first()
    )
    if not leaf:
        return ProofVerifyResponse(
            result="INVALID",
            detail="No leaf exists at this index in the snapshot",
            snapshotId=str(snapshot.id),
            liabilityRoot=snapshot.liability_root,
        )

    if leaf.commitment.lower() != data.commitment.lower():
        return ProofVerifyResponse(
            result="INVALID",
            detail="Commitment does not match the stored leaf",
            snapshotId=str(snapshot.id),
            liabilityRoot=snapshot.liability_root,
        )

    # The leaf amount is derived from the submitted balance: if the user's
    # balance does not match the committed value, the recomputed root diverges.
    try:
        amount = int(Decimal(data.balance) * 100)
    except (InvalidOperation, ValueError):
        return ProofVerifyResponse(
            result="INVALID",
            detail="Invalid balance format in proof payload",
            snapshotId=str(snapshot.id),
            liabilityRoot=snapshot.liability_root,
        )
    ok = verify_liability_proof(
        root=snapshot.liability_root,
        leaf_index=data.leafIndex,
        commitment=leaf.commitment,
        amount=amount,
        proof=data.merkleProof,
    )

    return ProofVerifyResponse(
        result="INCLUDED" if ok else "INVALID",
        detail=(
            "Proof verified: your balance is included in the published liability root."
            if ok
            else "Proof verification failed."
        ),
        snapshotId=str(snapshot.id),
        liabilityRoot=snapshot.liability_root,
    )


# ─── Blueprint API aliases (section 19) ──────────────────
# The management surface above uses /solvency/*. These top-level paths match
# the blueprint's documented public API exactly.


@router.get("/reserves/{snapshot_id}", response_model=list[ReserveAssetResponse])
async def get_reserves(snapshot_id: UUID, db: Session = Depends(get_db)):
    """Get the reserve asset breakdown for a snapshot (public, is_public-gated)."""
    snapshot = db.get(ReserveSnapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    _get_public_snapshot_org(db, snapshot.org_id)
    return (
        db.query(ReserveAsset)
        .filter(ReserveAsset.snapshot_id == snapshot_id)
        .order_by(ReserveAsset.value_usd.desc())
        .all()
    )


@router.get("/liabilities/{snapshot_id}", response_model=LiabilitySnapshotResponse)
async def get_liability_snapshot(snapshot_id: UUID, db: Session = Depends(get_db)):
    """Get the liability commitment root + totals for a snapshot (public)."""
    snapshot = db.get(LiabilitySnapshot, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Liability snapshot not found")
    _get_public_snapshot_org(db, snapshot.org_id)
    return snapshot


# ─── Demo ───────────────────────────────────────────────


@router.post("/solvency/demo")
async def seed_demo(db: Session = Depends(get_db)):
    """Seed a demo organization with wallets, liabilities, and a signed attestation."""
    result = await seed_demo_organization(db)
    org = result["org"]
    if result.get("reused"):
        latest_att = (
            db.query(Attestation)
            .filter(Attestation.org_id == org.org_id)
            .order_by(Attestation.created_at.desc())
            .first()
        )
        return {
            "orgSlug": org.slug,
            "orgName": org.display_name,
            "reused": True,
            "public_url": f"/solvency/{org.slug}",
            "attestationId": str(latest_att.id) if latest_att else None,
        }

    pipeline = result["result"]
    return {
        "orgSlug": org.slug,
        "orgName": org.display_name,
        "reused": False,
        "public_url": f"/solvency/{org.slug}",
        "attestationId": str(pipeline["attestation"].id),
        "solvency": {
            "reserveValueUsd": str(pipeline["solvency"]["reserve_value_usd"]),
            "liabilityValueUsd": str(pipeline["solvency"]["liability_value_usd"]),
            "coverageRatio": str(pipeline["solvency"]["coverage_ratio"]),
            "coveragePercent": str(pipeline["solvency"]["coverage_percent"]),
            "status": pipeline["solvency"]["status"].value,
        },
    }
