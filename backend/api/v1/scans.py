from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional

from ...core.database import get_db
from ...models.scan import ScanJob, ScanStatus, Finding
from ...models.user import User
from ...schemas.scan import ScanCreate, ScanResponse, ScanListResponse
from ...services.scan_analysis import ScanAnalysisService
from ...services import agent_engine
from ..v1.auth import get_optional_user

router = APIRouter(prefix="/scans", tags=["scans"])


def _user_scope(user: User | None) -> tuple[Optional[UUID], Optional[UUID]]:
    """(user_id, org_id) used to tag and filter scan jobs per login."""
    if user is None:
        return None, None
    return user.id, user.org_id


@router.post("", response_model=ScanResponse, status_code=201)
async def create_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Submit a contract for security analysis.

    Accepts Solidity/Rust code, a deployed contract address, or a GitHub URL.
    The scan is tagged to the logged-in account (or anonymous if no token).
    Analysis runs asynchronously through the agent engine.
    """
    service = ScanAnalysisService(db)
    user_id, org_id = _user_scope(current_user)
    scan = service.create_scan_job(
        contract_source=scan_in.contract_source,
        chain=scan_in.chain,
        contract_name=scan_in.contract_name,
        user_id=user_id,
        org_id=org_id,
    )

    # Run analysis inline: the agent engine is a fast CPU pass (<100ms), and
    # serverless runtimes (Vercel) freeze the function after the response,
    # which would kill BackgroundTasks mid-analysis.
    scan = service.run_analysis(scan.id)

    return ScanResponse.model_validate(scan)


@router.get("", response_model=ScanListResponse)
async def list_scans(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[ScanStatus] = None,
    chain: Optional[str] = None,
    category: Optional[str] = Query(
        None, description="Filter scans that contain a finding in this category"
    ),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """List scan jobs with pagination and optional filtering.

    Logged-in users see only their own scans (user/org scoped).
    Anonymous callers see only scans created without an account.
    """
    query = select(ScanJob).order_by(ScanJob.created_at.desc())

    user_id, org_id = _user_scope(current_user)
    if user_id:
        query = query.where(ScanJob.user_id == user_id)
    else:
        query = query.where(ScanJob.user_id.is_(None))

    if status:
        query = query.where(ScanJob.status == status)
    if chain:
        query = query.where(ScanJob.chain == chain)
    if category:
        query = query.where(ScanJob.findings.any(Finding.category.ilike(f"%{category}%")))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    scans = db.execute(query).scalars().all()

    return ScanListResponse(
        items=[ScanResponse.model_validate(s) for s in scans],
        total=private_total(db, user_id),
        page=page,
        page_size=page_size,
    )


def private_total(db: Session, user_id: Optional[UUID]) -> int:
    """Total scan count for this scope (kept separate for reuse)."""
    q = select(func.count()).select_from(ScanJob)
    if user_id:
        q = q.where(ScanJob.user_id == user_id)
    else:
        q = q.where(ScanJob.user_id.is_(None))
    return db.execute(q).scalar() or 0


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Get a scan job's status and results by ID.

    Poll this endpoint to check when analysis completes.
    Findings are included once the agent pipeline completes.
    """
    scan = _get_scoped_scan(db, scan_id, current_user)
    return ScanResponse.model_validate(scan)


def _get_scoped_scan(db: Session, scan_id: UUID, user: User | None) -> ScanJob:
    scan = db.get(ScanJob, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    user_id, _ = _user_scope(user)
    if (scan.user_id or None) != (user_id or None):
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.post("/{scan_id}/rescan", response_model=ScanResponse)
async def rescan_contract(
    scan_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Re-run analysis on a previously scanned contract."""
    scan = _get_scoped_scan(db, scan_id, current_user)

    # Delete old findings
    scan.findings.clear()
    scan.status = ScanStatus.PENDING
    scan.risk_score_overall = None
    scan.completed_at = None
    scan.error_message = None
    db.commit()

    service = ScanAnalysisService(db)
    scan = service.run_analysis(scan.id)

    return ScanResponse.model_validate(scan)


# ─── Fixed contract & per-finding patches ────────────────────────────────────


def _source_header(scan: ScanJob) -> str:
    return scan.contract_source or ""


def _reconstruct_findings(scan: ScanJob, findings: list[Finding]) -> list[agent_engine.AgentFinding]:
    """Rebuild AgentFinding objects from DB rows so fixer transforms can run.

    The category is stored as 'Base · Agent'; split it back apart.
    """
    rules_by_key = {r.key: r for r in agent_engine.RULES}
    out: list[agent_engine.AgentFinding] = []
    for f in findings:
        base_category = f.category.split(" · ")[0].strip()
        rule = next((r for r in agent_engine.RULES if r.category == base_category), None)
        out.append(
            agent_engine.AgentFinding(
                rule_key=rule.key if rule else "unknown",
                agent=f.category.split(" · ")[-1].strip() if " · " in f.category else "AGENT",
                category=base_category,
                severity=f.severity,
                line_number=f.line_number or 1,
                code_snippet=f.code_snippet or "",
                description=f.description,
                suggested_fix=f.suggested_fix or "",
                fixable=bool(rule and rule.fixer is not None),
            )
        )
    return out


@router.get("/{scan_id}/download/fixed", response_class=PlainTextResponse)
async def download_fixed_contract(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Download the auto-fixed contract with every safe fix applied.

    Returns Solidity source (text/plain) ready to compile. Manual-review
    items are marked with AUDITAI REVIEW comments inside the file.
    """
    scan = _get_scoped_scan(db, scan_id, current_user)
    source = _source_header(scan)
    if not source:
        raise HTTPException(status_code=404, detail="Scan has no stored contract source")

    fixed, _applied, _manual = agent_engine.build_fixed_source(source)
    name = scan.contract_name or "Contract"
    return PlainTextResponse(
        content=fixed,
        headers={
            "Content-Disposition": f'attachment; filename="{agent_engine._sanitize(name)}_fixed.sol"',
            "X-Fixes-Applied": str(len(_applied)),
            "X-Fixes-Manual": str(len(_manual)),
        },
    )


@router.get("/{scan_id}/download/patch", response_class=PlainTextResponse)
async def download_full_patch(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Download a unified diff containing ALL applied fixes."""
    scan = _get_scoped_scan(db, scan_id, current_user)
    source = _source_header(scan)
    if not source:
        raise HTTPException(status_code=404, detail="Scan has no stored contract source")

    fixed, applied, manual = agent_engine.build_fixed_source(source)
    patch = agent_engine.build_unified_patch(
        source, fixed, scan.contract_name or "Contract"
    )
    return PlainTextResponse(
        content=patch or "# No differences — contract already clean\n",
        headers={
            "Content-Disposition": f'attachment; filename="{agent_engine._sanitize(scan.contract_name or "Contract")}_auditai.patch"',
            "X-Fixes-Applied": str(len(applied)),
            "X-Fixes-Manual": str(len(manual)),
        },
    )


@router.get("/{scan_id}/findings/{finding_id}/patch", response_class=PlainTextResponse)
async def download_finding_patch(
    scan_id: UUID,
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Download a unified diff for ONE finding (per-category patch).

    Only findings whose rule has an auto-fixer produce a patch; manual-review
    categories return the suggested-fix annotation instead.
    """
    scan = _get_scoped_scan(db, scan_id, current_user)
    source = _source_header(scan)
    if not source:
        raise HTTPException(status_code=404, detail="Scan has no stored contract source")

    finding = db.get(Finding, finding_id)
    if not finding or finding.scan_id != scan.id:
        raise HTTPException(status_code=404, detail="Finding not found")

    agent_finding = _reconstruct_findings(scan, [finding])[0]
    if agent_finding.rule_key == "unknown" or not agent_finding.fixable:
        return PlainTextResponse(
            content=(
                f"# {agent_finding.category}\n"
                f"# Manual review required — no auto-fix available.\n"
                f"# Line {agent_finding.line_number}: {agent_finding.suggested_fix}\n"
            ),
            headers={
                "Content-Disposition": f'attachment; filename="{agent_engine._sanitize(agent_finding.category)}_manual.patch"',
            },
        )

    patched = agent_engine.fixed_source_for_finding(source, agent_finding)
    patch = agent_engine.build_unified_patch(
        source, patched, scan.contract_name or "Contract"
    )
    return PlainTextResponse(
        content=patch or "# No differences\n",
        headers={
            "Content-Disposition": f'attachment; filename="{agent_engine._sanitize(agent_finding.category)}_fix.patch"',
        },
    )


@router.get("/{scan_id}/diff-preview", response_model=None)
async def get_diff_preview(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Original + fixed source for the in-app before/after preview.

    Returns JSON so the client can render a side-by-side line diff without
    downloading the artifacts. Manual-review counts are included for the badge.
    """
    scan = _get_scoped_scan(db, scan_id, current_user)
    source = _source_header(scan)
    if not source:
        raise HTTPException(status_code=404, detail="Scan has no stored contract source")

    fixed, applied, manual = agent_engine.build_fixed_source(source)
    return {
        "scanId": str(scan.id),
        "contractName": scan.contract_name or "Contract",
        "original": source,
        "fixed": fixed,
        "fixesApplied": len(applied),
        "fixesManual": len(manual),
        "appliedCategories": [f.category for f in applied],
    }


@router.get("/{scan_id}/categories", response_model=list[dict])
async def list_scan_categories(
    scan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Category breakdown for a scan — used by the grouped findings UI."""
    scan = _get_scoped_scan(db, scan_id, current_user)
    groups: dict[str, dict] = {}
    for f in scan.findings:
        base = f.category.split(" · ")[0].strip()
        agent = f.category.split(" · ")[-1].strip() if " · " in f.category else "AGENT"
        g = groups.setdefault(
            base,
            {"category": base, "agent": agent, "count": 0, "severities": {}, "fixable": False},
        )
        g["count"] += 1
        g["severities"][f.severity.value] = g["severities"].get(f.severity.value, 0) + 1
        rule = next((r for r in agent_engine.RULES if r.category == base), None)
        if rule and rule.fixer is not None:
            g["fixable"] = True
    return sorted(
        groups.values(),
        key=lambda g: (-g["count"], g["category"]),
    )
