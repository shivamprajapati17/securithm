import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional
from datetime import datetime

from ...core.database import get_db
from ...models.scan import Finding, FindingStatus, FindingSeverity
from ...models.user import User
from ...models.api_key import APIKey
from ...schemas.scan import FindingResponse
from .api_keys import get_api_key_from_header
from pydantic import BaseModel


router = APIRouter(prefix="/findings/public", tags=["findings-public"])


class FindingAssigneeInfo(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    role: Optional[str] = None


class PublicFindingResponse(FindingResponse):
    assignee: Optional[FindingAssigneeInfo] = None


class PublicFindingsListResponse(BaseModel):
    items: list[PublicFindingResponse]
    total: int
    page: int
    page_size: int


def verify_api_key(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> None:
    """Extract and validate API key from request headers.

    Accepts key via Authorization: Bearer sk_... or X-API-Key header.
    Validates against the database and updates last_used_at.
    """
    key = get_api_key_from_header(authorization)
    if not key and x_api_key:
        key = x_api_key

    if not key:
        raise HTTPException(status_code=401, detail="API key required. Provide via Authorization: Bearer <key> or X-API-Key header.")

    key_hash = hashlib.sha256(key.encode()).hexdigest()
    record = db.execute(
        select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")

    record.last_used_at = datetime.utcnow()
    db.commit()


def _build_finding_filters(
    query,
    severity: Optional[FindingSeverity] = None,
    status: Optional[FindingStatus] = None,
    assigned_to: Optional[UUID] = None,
):
    """Apply common finding filters to a query."""
    if severity:
        query = query.where(Finding.severity == severity)
    if status:
        query = query.where(Finding.status == status)
    if assigned_to:
        query = query.where(Finding.assigned_to == assigned_to)
    return query


@router.get("", response_model=PublicFindingsListResponse)
async def list_findings_public(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[FindingSeverity] = None,
    status: Optional[FindingStatus] = None,
    assigned_to: Optional[UUID] = None,
    _: None = Depends(verify_api_key),
    db: Session = Depends(get_db),
):
    """Public endpoint to list findings with team assignment info.

    Requires an API key for authentication.
    Returns findings enriched with assignee display name, email, and role.

    Query parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    - severity: Filter by severity (critical, high, medium, low, informational)
    - status: Filter by status (open, in_progress, resolved, wont_fix)
    - assigned_to: Filter by assignee user ID
    """
    # Base query
    base_query = select(Finding).order_by(Finding.severity_order, Finding.created_at.desc())
    base_query = _build_finding_filters(base_query, severity, status, assigned_to)

    # Count total efficiently
    count_query = select(func.count()).select_from(Finding)
    count_query = _build_finding_filters(count_query, severity, status, assigned_to)
    total = db.scalar(count_query) or 0

    # Fetch paginated results
    offset = (page - 1) * page_size
    findings = db.execute(base_query.offset(offset).limit(page_size)).scalars().all()

    # Build response with assignee info
    items = []
    for finding in findings:
        finding_data = FindingResponse.model_validate(finding)
        assignee_info = None
        if finding.assigned_to:
            user = db.get(User, finding.assigned_to)
            if user:
                assignee_info = FindingAssigneeInfo(
                    id=str(user.id),
                    email=user.email,
                    display_name=user.display_name,
                    role=user.role,
                )
        items.append(PublicFindingResponse(
            **finding_data.model_dump(),
            assignee=assignee_info,
        ))

    return PublicFindingsListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=dict)
async def get_findings_stats_public(
    _: None = Depends(verify_api_key),
    db: Session = Depends(get_db),
):
    """Public endpoint to get aggregate findings statistics.

    Requires an API key for authentication.
    Returns counts by severity, status, and overall totals.
    """
    findings = db.execute(select(Finding)).scalars().all()

    severity_counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}
    for f in findings:
        sev = f.severity.value
        stat = f.status.value
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        status_counts[stat] = status_counts.get(stat, 0) + 1

    assigned_count = sum(1 for f in findings if f.assigned_to)
    resolved_count = status_counts.get("resolved", 0)
    total = len(findings)

    return {
        "total_findings": total,
        "severity_breakdown": severity_counts,
        "status_breakdown": status_counts,
        "assigned_count": assigned_count,
        "resolved_count": resolved_count,
        "resolution_rate": round((resolved_count / total * 100), 1) if total else 0,
    }
