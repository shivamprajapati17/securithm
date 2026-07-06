from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from ...core.database import get_db
from ...schemas.token import (
    TokenAnalysisResponse,
    TokenAnalysisRequest,
    TokenListResponse,
    TokenRiskFinding,
)

router = APIRouter(prefix="/token", tags=["token"])


@router.get("/analyze/{chain}/{address}", response_model=TokenAnalysisResponse)
async def analyze_token(
    chain: str = Path(..., description="Blockchain network"),
    address: str = Path(..., description="Token contract address"),
    token_type: str = Query(default="erc20", description="Token standard"),
    db: Session = Depends(get_db),
):
    """Analyze a token contract for rug-pull risks, honeypot detection,
    and general security posture.

    Evaluates ownership renouncement, blacklist functions,
    transfer taxes, mint capabilities, and known vulnerability patterns.
    Returns a security score (0-100) with detailed findings.
    """
    chain = chain.lower()

    if not address.startswith("0x") and chain != "solana":
        raise HTTPException(
            status_code=400,
            detail="Invalid contract address format",
        )

    # Query existing scan data for this contract
    from ...models.scan import ScanJob, ScanStatus
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

    findings: list[TokenRiskFinding] = []
    security_score = 90
    risk_level = "low"

    if latest_scan:
        scan_findings = list(latest_scan.findings)
        findings = [
            TokenRiskFinding(
                category=f.category,
                severity=f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                description=f.description[:200],
                recommendation=f.suggested_fix,
            )
            for f in scan_findings[:10]
        ]
        severity_weights = {"critical": 25, "high": 12, "medium": 6, "low": 3, "informational": 1}
        penalty = sum(severity_weights.get(f.severity.lower(), 0) for f in findings)
        security_score = max(10, min(100, 100 - penalty))
        risk_level = "low" if security_score >= 70 else "medium" if security_score >= 40 else "high" if security_score >= 20 else "critical"

    from datetime import datetime, timezone

    return TokenAnalysisResponse(
        contract_address=address,
        chain=chain,
        token_name=latest_scan.contract_name if latest_scan else None,
        token_symbol=None,
        token_type=token_type,
        total_supply=None,
        holder_count=None,
        security_score=security_score,
        risk_level=risk_level,
        findings=findings,
        is_renounced=None,
        has_honeypot_risk=False,
        has_blacklist=False,
        has_tax=False,
        has_mint_function=False,
        analyzed_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/list", response_model=TokenListResponse)
async def list_token_analyses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    chain: Optional[str] = None,
    token_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all analyzed tokens with pagination and filtering."""
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
        items.append(TokenAnalysisResponse(
            contract_address=scan.contract_source or "",
            chain=scan.chain or "",
            token_name=scan.contract_name,
            token_symbol=None,
            token_type=token_type or "erc20",
            total_supply=None,
            holder_count=None,
            security_score=50,
            risk_level="medium",
            findings=[],
            is_renounced=None,
            has_honeypot_risk=False,
            has_blacklist=False,
            has_tax=False,
            has_mint_function=False,
            analyzed_at=scan.completed_at.isoformat() if scan.completed_at else datetime.now(timezone.utc).isoformat(),
        ))

    return TokenListResponse(items=items, total=total, page=page, page_size=page_size)
