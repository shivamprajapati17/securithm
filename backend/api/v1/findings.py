from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from ...core.database import get_db
from ...models.scan import Finding, FindingStatus, FindingSeverity
from ...schemas.scan import FindingResponse, FindingUpdate

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("", response_model=list[FindingResponse])
async def list_findings(
    scan_id: Optional[UUID] = Query(None),
    severity: Optional[FindingSeverity] = None,
    status: Optional[FindingStatus] = None,
    assigned_to: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """List findings with optional filters.

    Filter by scan_id, severity, status, or assignee.
    Results are ordered by severity (critical first) then creation date.
    """
    query = select(Finding).order_by(
        Finding.severity_order,
        Finding.created_at.desc(),
    )

    if scan_id:
        query = query.where(Finding.scan_id == scan_id)
    if severity:
        query = query.where(Finding.severity == severity)
    if status:
        query = query.where(Finding.status == status)
    if assigned_to:
        query = query.where(Finding.assigned_to == assigned_to)

    findings = db.execute(query).scalars().all()
    return [FindingResponse.model_validate(f) for f in findings]


@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding(
    finding_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a single finding by ID."""
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return FindingResponse.model_validate(finding)


@router.patch("/{finding_id}", response_model=FindingResponse)
async def update_finding(
    finding_id: UUID,
    finding_in: FindingUpdate,
    db: Session = Depends(get_db),
):
    """Update finding status, assignee, or SLA.

    Used for remediation workflow:
    - Assign findings to team members
    - Update status (open → in_progress → resolved)
    - Set remediation SLA deadlines
    """
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if finding_in.status is not None:
        finding.status = finding_in.status
        if finding_in.status == FindingStatus.RESOLVED:
            from datetime import datetime, timezone
            finding.resolved_at = datetime.now(timezone.utc)

    if finding_in.assigned_to is not None:
        finding.assigned_to = finding_in.assigned_to

    if finding_in.remediation_sla is not None:
        finding.remediation_sla = finding_in.remediation_sla

    db.commit()
    db.refresh(finding)
    return FindingResponse.model_validate(finding)
