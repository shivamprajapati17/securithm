"""Securithm Development Setup — creates tables and starts the server.

Usage:
    python -m backend.dev_setup

This script:
  1. Creates all database tables (supports SQLite for dev, PostgreSQL for prod)
  2. Seeds demo data (sample scans, findings, monitored contracts)
  3. Starts the Uvicorn dev server

Supports both SQLite (no Docker needed) and PostgreSQL.
"""

import os
import sys
import uuid
import argparse
from datetime import datetime, timezone, timedelta

from backend.core.database import engine, Base
from backend.models import *  # noqa: F401, F403
from backend.services.scan_analysis import SEVERITY_ORDER


def setup_database(db_url: str | None = None) -> str:
    """Initialize the database and create all tables.

    Returns the database URL being used.
    """
    if db_url:
        os.environ["DATABASE_URL"] = db_url

    # Default to SQLite for easy local dev
    if "DATABASE_URL" not in os.environ:
        os.environ["DATABASE_URL"] = "sqlite:///./securithm_dev.db"

    Base.metadata.create_all(bind=engine)
    print(f"OK Tables created ({os.environ['DATABASE_URL']})")
    return os.environ["DATABASE_URL"]


def seed_data():
    """Seed the database with demo data for development."""
    from backend.core.database import SessionLocal
    from backend.models import (
        Organization, Plan, User, ScanJob, Finding,
        ScanStatus, FindingSeverity, FindingStatus,
        MonitoredContract, MonitoringEvent, ContractStatus, EventType,
    )
    from backend.core.security import get_password_hash

    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(Plan).first()
        if existing:
            print("OK Database already seeded, skipping")
            return

        # Create plans
        free_plan = Plan(
            id=uuid.uuid4(),
            name="Free",
            max_scans_per_month=50,
            max_monitored_contracts=1,
            price_usd=0.0,
        )
        pro_plan = Plan(
            id=uuid.uuid4(),
            name="Pro",
            max_scans_per_month=500,
            max_monitored_contracts=10,
            price_usd=29.0,
        )
        db.add_all([free_plan, pro_plan])
        db.flush()

        # Create organization
        org = Organization(
            id=uuid.uuid4(),
            name="Solidity Labs",
            plan_id=free_plan.id,
        )
        db.add(org)
        db.flush()

        # Create user
        user = User(
            id=uuid.uuid4(),
            email="dev@example.com",
            display_name="Solidity Dev",
            password_hash=get_password_hash("password123"),
            org_id=org.id,
        )
        db.add(user)
        db.flush()

        # Create scan jobs
        sample_contract = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableVault {
    mapping(address => uint256) public balances;
    address public owner;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount);
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success);
        balances[msg.sender] -= _amount;
    }
}"""

        scan1 = ScanJob(
            id=uuid.uuid4(),
            org_id=org.id,
            user_id=user.id,
            contract_source=sample_contract,
            chain="ethereum",
            contract_name="VulnerableVault",
            status=ScanStatus.COMPLETED,
            risk_score_overall="F",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=2),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(scan1)
        db.flush()

        scan2 = ScanJob(
            id=uuid.uuid4(),
            org_id=org.id,
            user_id=user.id,
            contract_source="// Uniswap V3 Router interface",
            chain="ethereum",
            contract_name="UniswapV3Router",
            status=ScanStatus.COMPLETED,
            risk_score_overall="B",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=15),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(scan2)
        db.flush()

        scan3 = ScanJob(
            id=uuid.uuid4(),
            org_id=org.id,
            user_id=user.id,
            contract_source="// Lending pool contract",
            chain="ethereum",
            contract_name="LendingPool",
            status=ScanStatus.COMPLETED,
            risk_score_overall="D",
            created_at=datetime.now(timezone.utc) - timedelta(hours=1),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(scan3)
        db.flush()

        scan4 = ScanJob(
            id=uuid.uuid4(),
            org_id=org.id,
            user_id=user.id,
            contract_source="// Token staking contract",
            chain="arbitrum",
            contract_name="TokenStaking",
            status=ScanStatus.RUNNING,
            risk_score_overall=None,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        )
        db.add(scan4)
        db.flush()

        # Findings for scan1 (VulnerableVault - F grade)
        findings_data = [
            {
                "category": "Reentrancy",
                "severity": FindingSeverity.CRITICAL,
                "line": 45,
                "description": "Unchecked external call in withdraw() allows reentrancy attack. The contract updates balance after the call, enabling an attacker to recursively call withdraw() before balance is deducted.",
                "snippet": "function withdraw(uint256 _amount) public {\n    require(balances[msg.sender] >= _amount);\n    (bool success, ) = msg.sender.call{value: _amount}(\"\");\n    require(success);\n    balances[msg.sender] -= _amount; // ❌ Updated AFTER call\n}",
                "fix": "function withdraw(uint256 _amount) public {\n    require(balances[msg.sender] >= _amount);\n    balances[msg.sender] -= _amount; // ✅ Updated BEFORE call\n    (bool success, ) = msg.sender.call{value: _amount}(\"\");\n    require(success);\n}",
                "status": FindingStatus.OPEN,
                "sla_days": 3,
            },
            {
                "category": "Access Control",
                "severity": FindingSeverity.HIGH,
                "line": 12,
                "description": "Owner variable is publicly readable but not restricted. Critical admin functions lack modifier protection.",
                "snippet": "address public owner;\n// Missing: modifier onlyOwner() {\n//     require(msg.sender == owner, \"Not owner\");\n//     _;\n// }",
                "fix": "address public owner;\nmodifier onlyOwner() {\n    require(msg.sender == owner, \"Not owner\");\n    _;\n}",
                "status": FindingStatus.OPEN,
                "sla_days": 5,
            },
            {
                "category": "Integer Overflow/Underflow",
                "severity": FindingSeverity.MEDIUM,
                "line": 78,
                "description": "Potential underflow in transfer() function. Balance subtraction occurs before addition, which could cause underflow if balance is insufficient.",
                "snippet": "function transfer(address _to, uint256 _amount) public {\n    balances[msg.sender] -= _amount; // ⚠️ Potential underflow\n    balances[_to] += _amount;\n}",
                "fix": "function transfer(address _to, uint256 _amount) public {\n    require(balances[msg.sender] >= _amount, \"Insufficient balance\");\n    balances[msg.sender] -= _amount;\n    balances[_to] += _amount;\n}",
                "status": FindingStatus.IN_PROGRESS,
                "assigned_to": user.id,
                "sla_days": 7,
            },
            {
                "category": "Unchecked Return Value",
                "severity": FindingSeverity.LOW,
                "line": 33,
                "description": "Return value of external call is not checked. If the call fails, the contract continues execution as if it succeeded.",
                "snippet": "token.transfer(to, amount); // ❌ Return value not checked",
                "fix": "bool success = token.transfer(to, amount);\nrequire(success, \"Transfer failed\");",
                "status": FindingStatus.RESOLVED,
                "sla_days": None,
            },
        ]

        for f_data in findings_data:
            finding = Finding(
                id=uuid.uuid4(),
                scan_id=scan1.id,
                category=f_data["category"],
                severity=f_data["severity"],
                severity_order=SEVERITY_ORDER[f_data["severity"]],
                line_number=f_data["line"],
                code_snippet=f_data["snippet"],
                description=f_data["description"],
                suggested_fix=f_data["fix"],
                status=f_data["status"],
                assigned_to=f_data.get("assigned_to"),
                remediation_sla=(
                    datetime.now(timezone.utc) + timedelta(days=f_data["sla_days"])
                    if f_data.get("sla_days")
                    else None
                ),
                resolved_at=(
                    datetime.now(timezone.utc) - timedelta(hours=2)
                    if f_data["status"] == FindingStatus.RESOLVED
                    else None
                ),
            )
            db.add(finding)

        # Monitored contracts
        contract1 = MonitoredContract(
            id=uuid.uuid4(),
            org_id=org.id,
            contract_address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            chain="ethereum",
            label="USDC Vault",
            status=ContractStatus.HEALTHY,
        )
        db.add(contract1)
        db.flush()

        contract2 = MonitoredContract(
            id=uuid.uuid4(),
            org_id=org.id,
            contract_address="0x1234d35Cc6634C0532925a3b844Bc9e7595f2bXX",
            chain="base",
            label="Lending Pool",
            status=ContractStatus.WARNING,
        )
        db.add(contract2)
        db.flush()

        # Monitoring events
        events = [
            MonitoringEvent(
                id=uuid.uuid4(),
                monitored_contract_id=contract2.id,
                event_type=EventType.UNKNOWN_CALLER,
                severity="high",
                message="Unknown address called withdraw() with no prior interaction",
                timestamp=datetime.now(timezone.utc) - timedelta(minutes=15),
            ),
            MonitoringEvent(
                id=uuid.uuid4(),
                monitored_contract_id=contract1.id,
                event_type=EventType.LARGE_OUTFLOW,
                severity="low",
                message="Routine large withdrawal: 100,000 USDC to known address",
                timestamp=datetime.now(timezone.utc) - timedelta(hours=4),
            ),
        ]
        db.add_all(events)

        # Usage meter
        from backend.models.billing import UsageMeter
        current_period = datetime.now(timezone.utc).strftime("%Y-%m")
        meter = UsageMeter(
            id=uuid.uuid4(),
            org_id=org.id,
            period=current_period,
            scans_used=42,
            api_calls_used=1234,
        )
        db.add(meter)

        db.commit()
        print("OK Demo data seeded")
        print(f"  Org: {org.name}")
        print(f"  User: dev@example.com / password123")
        print(f"  Scans: VulnerableVault (F), UniswapV3Router (B), LendingPool (D), TokenStaking (running)")
        print(f"  Findings: 4 (1 critical, 1 high, 1 medium, 1 low)")
        print(f"  Monitored Contracts: USDC Vault, Lending Pool")

    except Exception as e:
        db.rollback()
        print(f"FAIL Seed failed: {e}")
        raise
    finally:
        db.close()


def start_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = True):
    """Start the Uvicorn dev server."""
    import uvicorn
    print(f"\n=> Securithm API running at http://{host}:{port}")
    print(f"=> API docs at http://{host}:{port}/docs")
    print(f"=> Redoc at http://{host}:{port}/redoc")
    print()
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=reload,
    )


def main():
    parser = argparse.ArgumentParser(description="Securithm Dev Setup")
    parser.add_argument("--db", help="Database URL (default: sqlite:///./securithm_dev.db)")
    parser.add_argument("--host", default="0.0.0.0", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--no-seed", action="store_true", help="Skip seeding demo data")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")

    args = parser.parse_args()

    print("=" * 50)
    print("  Securithm - Development Setup")
    print("=" * 50)

    db_url = setup_database(args.db)

    if not args.no_seed:
        seed_data()

    start_server(
        host=args.host,
        port=args.port,
        reload=not args.no_reload,
    )


if __name__ == "__main__":
    main()
