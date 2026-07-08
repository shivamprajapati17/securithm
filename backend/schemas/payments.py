from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class PaymentMethod(BaseModel):
    id: UUID
    type: str  # card, crypto, invoice
    label: str
    is_default: bool
    last_four: Optional[str] = None
    expiry_date: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BillingPlanResponse(BaseModel):
    id: UUID
    name: str
    max_scans_per_month: int
    max_monitored_contracts: int
    price_usd: float
    features: list[str] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Pro",
                "max_scans_per_month": 500,
                "max_monitored_contracts": 10,
                "price_usd": 29.0,
                "features": [
                    "AI-powered analysis",
                    "CI/CD integration",
                    "Continuous monitoring",
                    "Team seats (5)",
                    "API access",
                    "Email support",
                ],
            }
        }
    }


class UsageMeterResponse(BaseModel):
    period: str
    scans_used: int
    scans_limit: int
    api_calls_used: int
    api_calls_limit: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "period": "2026-07",
                "scans_used": 42,
                "scans_limit": 500,
                "api_calls_used": 1234,
                "api_calls_limit": 10000,
            }
        }
    }


class InvoiceResponse(BaseModel):
    id: UUID
    amount_usd: float
    status: str  # paid, pending, overdue, cancelled
    issued_at: datetime
    paid_at: Optional[datetime] = None
    description: str
    pdf_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "amount_usd": 29.0,
                "status": "paid",
                "issued_at": "2026-07-01T00:00:00Z",
                "paid_at": "2026-07-01T01:30:00Z",
                "description": "Pro Plan - July 2026",
                "pdf_url": "https://api.securithm.dev/billing/invoices/550e8400-...pdf",
            }
        }
    }


class PaymentsListResponse(BaseModel):
    plans: list[BillingPlanResponse]
    current_plan: Optional[BillingPlanResponse] = None
    usage: Optional[UsageMeterResponse] = None
    payment_methods: list[PaymentMethod] = []
    invoices: list[InvoiceResponse] = []
