from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional

from ...core.database import get_db
from ...models.scan import ScanJob, ScanStatus
from ...schemas.scan import ScanCreate, ScanResponse, ScanListResponse
from ...services.scan_analysis import ScanAnalysisService

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Submit a contract for security analysis.

    Accepts Solidity/Rust code, a deployed contract address, or a GitHub URL.
    Returns immediately with a pending scan job. Analysis runs asynchronously.
    """
    service = ScanAnalysisService(db)
    scan = service.create_scan_job(
        contract_source=scan_in.contract_source,
        chain=scan_in.chain,
        contract_name=scan_in.contract_name,
    )

    # Kick off analysis in background
    background_tasks.add_task(service.run_analysis, scan.id)

    return ScanResponse.model_validate(scan)


@router.get("", response_model=ScanListResponse)
async def list_scans(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[ScanStatus] = None,
    chain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all scan jobs with pagination and optional filtering."""
    query = select(ScanJob).order_by(ScanJob.created_at.desc())

    if status:
        query = query.where(ScanJob.status == status)
    if chain:
        query = query.where(ScanJob.chain == chain)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    scans = db.execute(query).scalars().all()

    return ScanListResponse(
        items=[ScanResponse.model_validate(s) for s in scans],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a scan job's status and results by ID.

    Poll this endpoint to check when analysis completes.
    Findings are included in the response once the scan is completed.
    """
    scan = db.get(ScanJob, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return ScanResponse.model_validate(scan)


@router.post("/{scan_id}/rescan", response_model=ScanResponse)
async def rescan_contract(
    scan_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Re-run analysis on a previously scanned contract."""
    scan = db.get(ScanJob, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Delete old findings
    scan.findings.clear()
    scan.status = ScanStatus.PENDING
    scan.risk_score_overall = None
    scan.completed_at = None
    scan.error_message = None
    db.commit()

    service = ScanAnalysisService(db)
    background_tasks.add_task(service.run_analysis, scan.id)

    return ScanResponse.model_validate(scan)
