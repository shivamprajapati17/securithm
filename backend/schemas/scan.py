from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from ..models.scan import ScanStatus, FindingSeverity, FindingStatus


class ScanCreate(BaseModel):
    contract_source: str = Field(..., description="Solidity/Rust code, contract address, or GitHub URL")
    chain: str = Field(default="ethereum", description="Blockchain to analyze against")
    contract_name: Optional[str] = None
    input_mode: str = Field(default="code", description="code, address, or github")


class FindingResponse(BaseModel):
    id: UUID
    scan_id: UUID
    category: str
    severity: FindingSeverity
    severity_order: int
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    description: str
    suggested_fix: Optional[str] = None
    fixed_code: Optional[str] = None
    assigned_to: Optional[UUID] = None
    status: FindingStatus
    remediation_sla: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingUpdate(BaseModel):
    status: Optional[FindingStatus] = None
    assigned_to: Optional[UUID] = None
    remediation_sla: Optional[datetime] = None


class ScanResponse(BaseModel):
    id: UUID
    org_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    contract_source: Optional[str] = None
    chain: Optional[str] = None
    status: ScanStatus
    risk_score_overall: Optional[str] = None
    contract_name: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    findings: list[FindingResponse] = []

    model_config = {"from_attributes": True}


class ScanListResponse(BaseModel):
    items: list[ScanResponse]
    total: int
    page: int
    page_size: int
