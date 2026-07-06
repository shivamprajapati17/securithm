from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.payments import (
    BillingPlanResponse,
    UsageMeterResponse,
    InvoiceResponse,
    PaymentsListResponse,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/plans", response_model=list[BillingPlanResponse])
async def list_plans(db: Session = Depends(get_db)):
    """List all available billing plans and pricing."""
    from ...models.user import Plan

    plans = db.query(Plan).all()
    features_map = {
        "Free": [
            "AI-powered analysis (50 scans/mo)",
            "Basic monitoring (1 contract)",
            "Community support",
        ],
        "Pro": [
            "AI-powered analysis (500 scans/mo)",
            "CI/CD integration",
            "Continuous monitoring (10 contracts)",
            "Team seats (5)",
            "API access",
            "Email support",
        ],
    }

    result = []
    for plan in plans:
        result.append(BillingPlanResponse(
            id=plan.id,
            name=plan.name,
            max_scans_per_month=plan.max_scans_per_month,
            max_monitored_contracts=plan.max_monitored_contracts,
            price_usd=plan.price_usd,
            features=features_map.get(plan.name, []),
        ))

    return result


@router.get("/usage", response_model=UsageMeterResponse)
async def get_usage(db: Session = Depends(get_db)):
    """Get current billing period usage statistics."""
    from ...models.billing import UsageMeter
    from datetime import datetime, timezone

    current_period = datetime.now(timezone.utc).strftime("%Y-%m")
    meter = db.query(UsageMeter).filter(
        UsageMeter.period == current_period
    ).first()

    if not meter:
        return UsageMeterResponse(
            period=current_period,
            scans_used=0,
            scans_limit=50,
            api_calls_used=0,
            api_calls_limit=1000,
        )

    # Find the plan for limits
    from ...models.user import Organization, Plan
    org = meter.organization
    limit = 50
    if org and org.plan:
        limit = org.plan.max_scans_per_month

    return UsageMeterResponse(
        period=meter.period,
        scans_used=meter.scans_used,
        scans_limit=limit,
        api_calls_used=meter.api_calls_used,
        api_calls_limit=limit * 20,
    )


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(db: Session = Depends(get_db)):
    """List billing invoices and payment history."""
    # Stub — returns empty list for now
    return []


@router.get("/dashboard", response_model=PaymentsListResponse)
async def get_payment_dashboard(db: Session = Depends(get_db)):
    """Get full payment dashboard: current plan, usage, invoices, and payment methods."""
    from ...models.user import Plan, Organization
    from ...models.billing import UsageMeter
    from datetime import datetime, timezone

    plans = db.query(Plan).all()
    features_map = {
        "Free": [
            "AI-powered analysis (50 scans/mo)",
            "Basic monitoring (1 contract)",
            "Community support",
        ],
        "Pro": [
            "AI-powered analysis (500 scans/mo)",
            "CI/CD integration",
            "Continuous monitoring (10 contracts)",
            "Team seats (5)",
            "API access",
            "Email support",
        ],
    }

    plan_responses = []
    for plan in plans:
        plan_responses.append(BillingPlanResponse(
            id=plan.id,
            name=plan.name,
            max_scans_per_month=plan.max_scans_per_month,
            max_monitored_contracts=plan.max_monitored_contracts,
            price_usd=plan.price_usd,
            features=features_map.get(plan.name, []),
        ))

    current_plan = plan_responses[0] if plan_responses else None

    current_period = datetime.now(timezone.utc).strftime("%Y-%m")
    meter = db.query(UsageMeter).filter(
        UsageMeter.period == current_period
    ).first()

    usage = None
    if meter:
        usage = UsageMeterResponse(
            period=meter.period,
            scans_used=meter.scans_used,
            scans_limit=current_plan.max_scans_per_month if current_plan else 50,
            api_calls_used=meter.api_calls_used,
            api_calls_limit=(current_plan.max_scans_per_month if current_plan else 50) * 20,
        )
    else:
        usage = UsageMeterResponse(
            period=current_period,
            scans_used=0,
            scans_limit=current_plan.max_scans_per_month if current_plan else 50,
            api_calls_used=0,
            api_calls_limit=1000,
        )

    return PaymentsListResponse(
        plans=plan_responses,
        current_plan=current_plan,
        usage=usage,
        payment_methods=[],
        invoices=[],
    )
