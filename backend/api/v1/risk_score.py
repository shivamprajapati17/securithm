from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from ...core.database import get_db
from ...models.scan import ScanJob, ScanStatus, Finding, FindingSeverity

router = APIRouter(prefix="/risk-score", tags=["risk-score"])


class RiskScoreResponse(BaseModel):
    chain: str
    address: str
    risk_score: int  # 0-100
    grade: str  # A-F
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    last_scanned: Optional[str] = None
    confidence: str  # high, medium, low

    model_config = {
        "json_schema_extra": {
            "example": {
                "chain": "ethereum",
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
                "risk_score": 72,
                "grade": "D",
                "total_findings": 5,
                "critical_count": 1,
                "high_count": 2,
                "medium_count": 1,
                "low_count": 1,
                "last_scanned": "2026-07-05T08:30:00Z",
                "confidence": "high",
            }
        }
    }


def calculate_risk_from_findings(findings: list[Finding]) -> tuple[int, str]:
    """Calculate numeric risk score (0-100) and letter grade from findings."""
    weights = {
        FindingSeverity.CRITICAL: 25,
        FindingSeverity.HIGH: 12,
        FindingSeverity.MEDIUM: 6,
        FindingSeverity.LOW: 3,
        FindingSeverity.INFORMATIONAL: 1,
    }

    base_score = 10  # Start at low risk
    for f in findings:
        base_score += weights.get(f.severity, 0)

    score = min(base_score, 100)

    if score >= 80:
        grade = "F"
    elif score >= 60:
        grade = "E"
    elif score >= 40:
        grade = "D"
    elif score >= 25:
        grade = "C"
    elif score >= 15:
        grade = "B"
    else:
        grade = "A"

    return score, grade


@router.get("/{chain}/{address}", response_model=RiskScoreResponse)
async def get_risk_score(
    chain: str = Path(
        ..., description="Blockchain (ethereum, solana, base, arbitrum, polygon, bsc)"
    ),
    address: str = Path(..., description="Contract address to evaluate"),
    db: Session = Depends(get_db),
):
    """Get the risk score for a deployed contract address.

    This is the institutional-facing API endpoint, designed for:
    - Exchanges performing listing due diligence
    - Insurers underwriting coverage
    - Funds evaluating portfolio risk

    Returns a normalized risk score (0-100), letter grade (A-F),
    and breakdown of findings by severity.
    """
    chain = chain.lower()

    if not address.startswith("0x") and chain != "solana":
        raise HTTPException(
            status_code=400,
            detail="Invalid contract address format",
        )

    # Find the most recent completed scan for this contract
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

    # Also search by findings association for deeper lookup
    if not latest_scan:
        latest_scan = db.execute(
            select(ScanJob)
            .where(ScanJob.chain == chain)
            .order_by(ScanJob.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

    if not latest_scan:
        return RiskScoreResponse(
            chain=chain,
            address=address,
            risk_score=0,
            grade="N/A",
            total_findings=0,
            critical_count=0,
            high_count=0,
            medium_count=0,
            low_count=0,
            last_scanned=None,
            confidence="low",
        )

    findings = list(latest_scan.findings)
    score, grade = calculate_risk_from_findings(findings)

    return RiskScoreResponse(
        chain=chain,
        address=address,
        risk_score=score,
        grade=grade,
        total_findings=len(findings),
        critical_count=sum(
            1 for f in findings if f.severity == FindingSeverity.CRITICAL
        ),
        high_count=sum(1 for f in findings if f.severity == FindingSeverity.HIGH),
        medium_count=sum(1 for f in findings if f.severity == FindingSeverity.MEDIUM),
        low_count=sum(1 for f in findings if f.severity == FindingSeverity.LOW),
        last_scanned=latest_scan.completed_at.isoformat()
        if latest_scan.completed_at
        else None,
        confidence="high" if findings else "low",
    )


@router.get("/{chain}/{address}/history", response_model=list[RiskScoreResponse])
async def get_risk_score_history(
    chain: str = Path(...),
    address: str = Path(...),
    db: Session = Depends(get_db),
):
    """Get historical risk score data for a contract address.

    Returns an array of risk scores over time, useful for
    tracking security posture changes.
    """
    chain = chain.lower()

    scans = (
        db.execute(
            select(ScanJob)
            .where(
                ScanJob.contract_source.contains(address),
                ScanJob.chain == chain,
                ScanJob.status == ScanStatus.COMPLETED,
            )
            .order_by(ScanJob.completed_at.desc())
            .limit(30)
        )
        .scalars()
        .all()
    )

    results = []
    for scan in scans:
        findings = list(scan.findings)
        score, grade = calculate_risk_from_findings(findings)
        results.append(
            RiskScoreResponse(
                chain=chain,
                address=address,
                risk_score=score,
                grade=grade,
                total_findings=len(findings),
                critical_count=sum(
                    1 for f in findings if f.severity == FindingSeverity.CRITICAL
                ),
                high_count=sum(
                    1 for f in findings if f.severity == FindingSeverity.HIGH
                ),
                medium_count=sum(
                    1 for f in findings if f.severity == FindingSeverity.MEDIUM
                ),
                low_count=sum(1 for f in findings if f.severity == FindingSeverity.LOW),
                last_scanned=scan.completed_at.isoformat()
                if scan.completed_at
                else None,
                confidence="high" if findings else "low",
            )
        )

    return results
