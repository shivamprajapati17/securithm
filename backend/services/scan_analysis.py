import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from ..models.scan import (
    ScanJob,
    Finding,
    ScanStatus,
    FindingStatus,
)
from sqlalchemy.orm import Session
from .agent_engine import (
    run_agents,
    calculate_risk_score,
    SEVERITY_ORDER,
)


class ScanAnalysisService:
    """Core scan analysis service.

    Dispatches the contract source through the AuditAI agent engine: a family
    of trained rule agents (reentrancy, auth, lifecycle, context, arithmetic,
    gas, entropy, governance…) that report REAL line numbers from the
    submitted source and attach deterministic, auto-appliable fixes.

    Production hardening path: agents run locally today and can be augmented
    with Slither / MythX / LLM cross-checks without changing this interface.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_scan_job(
        self,
        contract_source: str,
        chain: str = "ethereum",
        contract_name: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        org_id: Optional[uuid.UUID] = None,
    ) -> ScanJob:
        """Create a new scan job and queue it for analysis."""
        scan = ScanJob(
            org_id=org_id,
            user_id=user_id,
            contract_source=contract_source,
            chain=chain,
            contract_name=contract_name or self._infer_contract_name(contract_source),
            status=ScanStatus.PENDING,
        )
        self.db.add(scan)
        self.db.commit()
        self.db.refresh(scan)
        return scan

    def run_analysis(self, scan_id: uuid.UUID) -> ScanJob:
        """Execute the agent pipeline on a scan job."""
        scan = self.db.get(ScanJob, scan_id)
        if not scan:
            raise ValueError(f"Scan job {scan_id} not found")

        # Mark as running
        scan.status = ScanStatus.RUNNING
        self.db.commit()

        try:
            findings = self._generate_findings(scan)

            # Calculate overall risk score (A-F) based on findings
            scan.risk_score_overall = calculate_risk_score(findings)

            # Mark as completed
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(scan)

        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
            self.db.commit()

        return scan

    def _generate_findings(self, scan: ScanJob) -> list[Finding]:
        """Run the trained agent rule library over the contract source.

        Every finding carries the reporting agent's identity, the REAL line
        number from the submitted source, and a deterministic suggested fix.
        """
        agent_findings = run_agents(scan.contract_source or "")
        findings: list[Finding] = []

        for af in agent_findings:
            finding = Finding(
                scan_id=scan.id,
                category=f"{af.category} · {af.agent}",
                severity=af.severity,
                severity_order=SEVERITY_ORDER[af.severity],
                line_number=af.line_number,
                code_snippet=af.code_snippet,
                description=af.description,
                suggested_fix=af.suggested_fix,
                status=FindingStatus.OPEN,
                remediation_sla=datetime.now(timezone.utc) + timedelta(days=7),
            )
            self.db.add(finding)
            findings.append(finding)

        self.db.commit()
        return findings

    def _infer_contract_name(self, source: str) -> str:
        """Try to extract contract name from source code."""
        match = re.search(r"contract\s+(\w+)", source)
        if match:
            return match.group(1)
        return "UnknownContract"
