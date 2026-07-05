from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Any
from ..models.monitoring import EventType, ContractStatus


class MonitoredContractCreate(BaseModel):
    contract_address: str
    chain: str
    label: Optional[str] = None


class MonitoredContractResponse(BaseModel):
    id: UUID
    org_id: UUID
    contract_address: str
    chain: str
    label: Optional[str] = None
    status: ContractStatus
    created_at: datetime
    last_checked: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MonitoringEventResponse(BaseModel):
    id: UUID
    monitored_contract_id: UUID
    event_type: EventType
    severity: str
    message: str
    event_data: Optional[dict[str, Any]] = None
    tx_hash: Optional[str] = None
    timestamp: datetime
    acknowledged: bool

    model_config = {"from_attributes": True}
