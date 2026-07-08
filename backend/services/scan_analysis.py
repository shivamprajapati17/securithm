import uuid
import random
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from ..models.scan import (
    ScanJob,
    Finding,
    ScanStatus,
    FindingSeverity,
    FindingStatus,
)
from sqlalchemy.orm import Session


SEVERITY_ORDER = {
    FindingSeverity.CRITICAL: 0,
    FindingSeverity.HIGH: 1,
    FindingSeverity.MEDIUM: 2,
    FindingSeverity.LOW: 3,
    FindingSeverity.INFORMATIONAL: 4,
}


class ScanAnalysisService:
    """Core scan analysis service.

    In production, this dispatches to the analysis pipeline:
      Slither (static) → MythX (symbolic) → GPT-4o (AI reasoning) → Claude (cross-check)

    For the MVP, this simulates realistic findings based on common vulnerability patterns.
    """

    VULNERABILITY_PATTERNS = [
        {
            "category": "Reentrancy",
            "severity": FindingSeverity.CRITICAL,
            "description": (
                "Unchecked external call allows reentrancy attack. The contract state is "
                "updated after the external call, enabling an attacker to recursively call "
                "the function before the state change is committed."
            ),
            "snippet": 'function withdraw(uint256 _amount) public {\n    require(balances[msg.sender] >= _amount);\n    (bool success, ) = msg.sender.call{value: _amount}("");\n    require(success);\n    balances[msg.sender] -= _amount; // ❌ Updated AFTER call\n}',
            "fix": 'function withdraw(uint256 _amount) public {\n    require(balances[msg.sender] >= _amount);\n    balances[msg.sender] -= _amount; // ✅ Updated BEFORE call\n    (bool success, ) = msg.sender.call{value: _amount}("");\n    require(success);\n}',
        },
        {
            "category": "Access Control",
            "severity": FindingSeverity.HIGH,
            "description": (
                "Owner variable is publicly readable but not restricted. Critical admin "
                "functions lack modifier protection, allowing unauthorized access to "
                "privileged operations."
            ),
            "snippet": 'address public owner;\n// Missing: modifier onlyOwner() {\n//     require(msg.sender == owner, "Not owner");\n//     _;\n// }',
            "fix": 'address public owner;\nmodifier onlyOwner() {\n    require(msg.sender == owner, "Not owner");\n    _;\n}',
        },
        {
            "category": "Integer Overflow/Underflow",
            "severity": FindingSeverity.MEDIUM,
            "description": (
                "Unchecked arithmetic operation could result in integer overflow or underflow. "
                "Using SafeMath or Solidity 0.8+ built-in checking prevents this, but the "
                "current implementation does not validate inputs."
            ),
            "snippet": "function transfer(address _to, uint256 _amount) public {\n    balances[msg.sender] -= _amount; // ⚠️ Potential underflow\n    balances[_to] += _amount;\n}",
            "fix": 'function transfer(address _to, uint256 _amount) public {\n    require(balances[msg.sender] >= _amount, "Insufficient balance");\n    balances[msg.sender] -= _amount;\n    balances[_to] += _amount;\n}',
        },
        {
            "category": "Oracle Manipulation",
            "severity": FindingSeverity.HIGH,
            "description": (
                "Contract uses a single price oracle source without fallback or validation. "
                "A manipulated oracle can lead to incorrect asset pricing and financial loss."
            ),
            "snippet": "uint256 price = oracle.getPrice(token); // ❌ Single oracle source\nuint256 value = amount * price / 1e18;",
            "fix": 'uint256 priceA = oracleA.getPrice(token);\nuint256 priceB = oracleB.getPrice(token);\nrequire(abs(priceA - priceB) / priceA < 0.05e18, "Oracle deviation");\nuint256 price = (priceA + priceB) / 2;',
        },
        {
            "category": "Unchecked Return Value",
            "severity": FindingSeverity.LOW,
            "description": (
                "Return value of external call is not checked. If the call fails, the "
                "contract continues execution as if it succeeded, potentially leading to "
                "inconsistent state."
            ),
            "snippet": "token.transfer(to, amount); // ❌ Return value not checked",
            "fix": 'bool success = token.transfer(to, amount);\nrequire(success, "Transfer failed");',
        },
        {
            "category": "Timestamp Dependence",
            "severity": FindingSeverity.MEDIUM,
            "description": (
                "Contract uses block.timestamp for critical logic. Miners can manipulate "
                "timestamps within a 15-second window to influence outcomes."
            ),
            "snippet": "require(block.timestamp > deadline); // ❌ Timestamp can be manipulated",
            "fix": "require(block.number > deadlineBlock); // ✅ Use block number instead",
        },
        {
            "category": "Gas Griefing",
            "severity": FindingSeverity.LOW,
            "description": (
                "Loop iterates over an unbounded dynamic array. If the array grows too large, "
                "the transaction may run out of gas, effectively griefing users."
            ),
            "snippet": "function processAll() public {\n    for (uint i; i < users.length; i++) { // ❌ Unbounded loop\n        processUser(users[i]);\n    }\n}",
            "fix": "function processBatch(uint256 offset, uint256 limit) public {\n    uint256 end = min(offset + limit, users.length);\n    for (uint i = offset; i < end; i++) {\n        processUser(users[i]);\n    }\n}",
        },
        {
            "category": "Centralization Risk",
            "severity": FindingSeverity.HIGH,
            "description": (
                "Owner can withdraw all contract funds unilaterally. Consider a timelock "
                "or multi-sig to reduce centralization risk."
            ),
            "snippet": "function emergencyWithdraw() public onlyOwner {\n    payable(owner).transfer(address(this).balance); // ❌ Single point of failure\n}",
            "fix": 'function emergencyWithdraw() public onlyOwner {\n    require(timelock.expired(), "Timelock active");\n    payable(owner).transfer(address(this).balance);\n}',
        },
    ]

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
        """Execute the analysis pipeline on a scan job.

        In production, this dispatches to:
          1. Slither for static analysis
          2. MythX for symbolic execution
          3. GPT-4o for AI reasoning
          4. Claude for cross-check and report narrative
        """
        scan = self.db.get(ScanJob, scan_id)
        if not scan:
            raise ValueError(f"Scan job {scan_id} not found")

        # Mark as running
        scan.status = ScanStatus.RUNNING
        self.db.commit()

        try:
            # Simulate analysis pipeline
            findings = self._generate_findings(scan)

            # Calculate overall risk score (A-F) based on findings
            scan.risk_score_overall = self._calculate_risk_score(findings)

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
        """Generate findings for a scan.

        In production, this integrates with Slither, MythX, and GPT-4o.
        For the MVP, selects realistic patterns based on the contract source.
        """
        findings = []

        # Determine how many findings to generate based on input
        # Longer contracts get more findings
        source_length = len(scan.contract_source or "")
        num_findings = min(
            max(2, source_length // 500),
            len(self.VULNERABILITY_PATTERNS),
        )

        # Pick random vulnerability patterns
        selected_patterns = random.sample(
            self.VULNERABILITY_PATTERNS,
            num_findings,
        )

        for i, pattern in enumerate(selected_patterns):
            finding = Finding(
                scan_id=scan.id,
                category=pattern["category"],
                severity=pattern["severity"],
                severity_order=SEVERITY_ORDER[pattern["severity"]],
                line_number=random.randint(5, 120),
                code_snippet=pattern["snippet"],
                description=pattern["description"],
                suggested_fix=pattern["fix"],
                status=FindingStatus.OPEN,
                remediation_sla=datetime.now(timezone.utc)
                + timedelta(days=random.choice([2, 3, 5, 7, 14])),
            )
            self.db.add(finding)
            findings.append(finding)

        self.db.commit()
        return findings

    def _calculate_risk_score(self, findings: list[Finding]) -> str:
        """Calculate A-F risk score based on findings severity."""
        severity_weights = {
            FindingSeverity.CRITICAL: 40,
            FindingSeverity.HIGH: 20,
            FindingSeverity.MEDIUM: 10,
            FindingSeverity.LOW: 5,
            FindingSeverity.INFORMATIONAL: 1,
        }

        total_score = sum(severity_weights.get(f.severity, 0) for f in findings)

        if total_score >= 60:
            return "F"
        elif total_score >= 40:
            return "E"
        elif total_score >= 25:
            return "D"
        elif total_score >= 15:
            return "C"
        elif total_score >= 8:
            return "B"
        else:
            return "A"

    def _infer_contract_name(self, source: str) -> str:
        """Try to extract contract name from source code."""
        match = re.search(r"contract\s+(\w+)", source)
        if match:
            return match.group(1)
        return "UnknownContract"
