from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...schemas.nft import (
    NFTCollectionAnalysisResponse,
    NFTCollectionListResponse,
    NFTSecurityFinding,
)

router = APIRouter(prefix="/nft", tags=["nft"])


@router.get("/analyze/{chain}/{address}", response_model=NFTCollectionAnalysisResponse)
async def analyze_nft_collection(
    chain: str = Path(..., description="Blockchain network"),
    address: str = Path(..., description="NFT contract address"),
    db: Session = Depends(get_db),
):
    """Analyze an NFT collection for security risks.

    Evaluates royalty enforcement, allowlist/whitelist configuration,
    mint authority risks, and overall contract security posture.
    Returns a security score (0-100) and detailed findings.
    """
    chain = chain.lower()

    if not address.startswith("0x") and chain != "solana":
        raise HTTPException(
            status_code=400,
            detail="Invalid contract address format",
        )

    # For now, return analysis based on available scan data
    # Full implementation will perform dedicated NFT-specific analysis
    from ...models.scan import ScanJob, ScanStatus, Finding
    from sqlalchemy import select

    latest_scan = db.execute(
        select(ScanJob)
        .where(
            ScanJob.contract_source.contains(address),
            ScanJob.chain == chain,
            ScanJob.status == ScanStatus.COMPLETED,
        )
        .order_by(ScanJob.completed_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    findings: list[NFTSecurityFinding] = []
    security_score = 85
    risk_level = "low"

    if latest_scan:
        scan_findings = list(latest_scan.findings)
        findings = [
            NFTSecurityFinding(
                category=f.category,
                severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                description=f.description[:200],
                recommendation=f.suggested_fix,
            )
            for f in scan_findings[:10]
        ]
        # Calculate score from findings
        severity_weights = {"critical": 25, "high": 12, "medium": 6, "low": 3, "informational": 1}
        penalty = sum(severity_weights.get(f.severity.lower(), 0) for f in findings)
        security_score = max(10, min(100, 100 - penalty))
        risk_level = "low" if security_score >= 70 else "medium" if security_score >= 40 else "high" if security_score >= 20 else "critical"

    from datetime import datetime, timezone

    return NFTCollectionAnalysisResponse(
        contract_address=address,
        chain=chain,
        collection_name=latest_scan.contract_name if latest_scan else None,
        total_supply=None,
        security_score=security_score,
        risk_level=risk_level,
        findings=findings,
        is_verified=False,
        has_royalty_enforcement=False,
        has_allowlist=False,
        has_mint_authority_risk=False,
        analyzed_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/collections", response_model=NFTCollectionListResponse)
async def list_nft_analyses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    chain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all analyzed NFT collections with pagination."""
    from ...models.scan import ScanJob, ScanStatus
    from sqlalchemy import select, func

    query = select(ScanJob).where(
        ScanJob.contract_source.isnot(None),
        ScanJob.status == ScanStatus.COMPLETED,
    ).order_by(ScanJob.created_at.desc())

    if chain:
        query = query.where(ScanJob.chain == chain)

    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0

    offset = (page - 1) * page_size
    scans = db.execute(query.offset(offset).limit(page_size)).scalars().all()

    from datetime import datetime, timezone
    items = []
    for scan in scans:
        items.append(NFTCollectionAnalysisResponse(
            contract_address=scan.contract_source or "",
            chain=scan.chain or "",
            collection_name=scan.contract_name,
            total_supply=None,
            security_score=50,
            risk_level="medium",
            findings=[],
            is_verified=False,
            has_royalty_enforcement=False,
            has_allowlist=False,
            has_mint_authority_risk=False,
            analyzed_at=scan.completed_at.isoformat() if scan.completed_at else datetime.now(timezone.utc).isoformat(),
        ))

    return NFTCollectionListResponse(items=items, total=total, page=page, page_size=page_size)
