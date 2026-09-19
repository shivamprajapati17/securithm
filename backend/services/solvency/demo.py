"""Demo data seeder for the Securithm Solvency module.

Creates a realistic demo organization with reserve wallets, declared balances,
and a liability dataset, then runs the full pipeline so the public dashboard
has an attestation to display immediately.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ...models.solvency import (
    ReserveWallet,
    SolvencyOrg,
    VerificationMethod,
    VerificationStatus,
)
from ...models.user import Organization, Plan, User
from .engine import SolvencyEngine


async def seed_demo_organization(db: Session) -> dict:
    """Seed a demo org and return the pipeline result."""
    # ── Create the demo org + user (idempotent by slug) ──
    existing = (
        db.query(SolvencyOrg).filter(SolvencyOrg.slug == "securithm-demo").first()
    )
    if existing:
        return {"reused": True, "org": existing}

    plan = db.query(Plan).filter(Plan.name == "Free").first()
    if not plan:
        plan = Plan(
            name="Free",
            max_scans_per_month=50,
            max_monitored_contracts=1,
            price_usd=0.0,
        )
        db.add(plan)
        db.flush()

    org = Organization(
        name="Securithm Demo Custody",
        plan_id=plan.id,
    )
    db.add(org)
    db.flush()

    demo_user = User(
        email="demo@securithm.dev",
        display_name="Demo",
        password_hash="!",  # cannot log in — demo only
        org_id=org.id,
        role="admin",
    )
    db.add(demo_user)
    db.flush()

    solvency_org = SolvencyOrg(
        org_id=org.id,
        slug="securithm-demo",
        display_name="Securithm Demo Custody",
        website="https://securithm.dev",
        description=(
            "Demo organization used to showcase Securithm's Proof of Reserves, "
            "Proof of Liabilities and Proof of Solvency attestation system. "
            "Balances are simulated and labeled accordingly."
        ),
        is_public=True,
        required_coverage="1.00",
        target_coverage="1.10",
        strong_coverage="1.20",
    )
    db.add(solvency_org)
    db.flush()

    # ── Reserve wallets with declared balances ──
    # Declared balances are simulated, so the honest evidence label is ATTESTED
    # (demo mode), never DIRECTLY_VERIFIED — wallet ownership and balance
    # provenance are distinct claims (blueprint section 8).
    wallets = [
        (
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            "Primary Treasury",
            "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "UNI",
            18,
            "112500",
        ),
        (
            "0xdfd5293d8e347dfe59e90efd55b2956a1343963d",
            "Stablecoin Reserve",
            "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "USDC",
            6,
            "84200000",
        ),
        (
            "0x28c6c06298d514db089934071355e5743bf21d60",
            "ETH Operations",
            None,
            "ETH",
            18,
            "18500",
        ),
    ]

    for addr, label, token_addr, symbol, decimals, balance in wallets:
        db.add(
            ReserveWallet(
                org_id=org.id,
                chain="ethereum",
                address=addr,
                label=label,
                verification_method=VerificationMethod.SIGNATURE,
                verification_status=VerificationStatus.ATTESTED,
                verification_evidence={
                    "declared_assets": [
                        {
                            "asset_address": token_addr,
                            "symbol": symbol,
                            "decimals": decimals,
                            "balance": balance,
                        }
                    ],
                    "note": "Simulated balance for demo purposes — labeled ATTESTED, not directly verified.",
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                },
            )
        )
    db.flush()

    # ── Liability dataset (user_ref, balance_usd) ──
    liabilities = [
        ("user_001", "1200000"),
        ("user_002", "4500000"),
        ("user_003", "850000"),
        ("user_004", "2300000"),
        ("user_005", "15000000"),
        ("user_006", "300000"),
        ("user_007", "5000000"),
        ("user_008", "750000"),
        ("user_009", "1800000"),
        ("user_010", "2200000"),
        ("user_011", "4600000"),
        ("user_012", "900000"),
        ("user_013", "3300000"),
        ("user_014", "640000"),
        ("user_015", "12500000"),
        ("user_016", "2100000"),
        ("user_017", "580000"),
        ("user_018", "3000000"),
        ("user_019", "1500000"),
        ("user_020", "4300000"),
    ]
    # total liabilities ≈ $75.36M

    engine = SolvencyEngine(db)
    result = await engine.run_full_snapshot(solvency_org, liability_entries=liabilities)
    return {"reused": False, "org": solvency_org, "result": result}
