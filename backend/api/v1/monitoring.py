from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID

from ...core.database import get_db
from ...models.monitoring import MonitoredContract, MonitoringEvent, ContractStatus
from ...schemas.monitoring import (
    MonitoredContractCreate,
    MonitoredContractResponse,
    MonitoringEventResponse,
)

router = APIRouter(prefix="/monitored-contracts", tags=["monitoring"])


@router.post("", response_model=MonitoredContractResponse, status_code=201)
async def create_monitored_contract(
    contract_in: MonitoredContractCreate,
    db: Session = Depends(get_db),
):
    """Add a deployed contract for continuous on-chain monitoring.

    The system will watch for anomalous events such as large outflows,
    unknown caller addresses, and TVL drops.
    """
    # Check for duplicates
    existing = db.execute(
        select(MonitoredContract).where(
            MonitoredContract.contract_address == contract_in.contract_address,
            MonitoredContract.chain == contract_in.chain,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Contract already being monitored",
        )

    contract = MonitoredContract(
        contract_address=contract_in.contract_address,
        chain=contract_in.chain,
        label=contract_in.label,
        status=ContractStatus.HEALTHY,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return MonitoredContractResponse.model_validate(contract)


@router.get("", response_model=list[MonitoredContractResponse])
async def list_monitored_contracts(
    db: Session = Depends(get_db),
):
    """List all monitored contracts."""
    contracts = (
        db.execute(
            select(MonitoredContract).order_by(MonitoredContract.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [MonitoredContractResponse.model_validate(c) for c in contracts]


@router.get("/{contract_id}", response_model=MonitoredContractResponse)
async def get_monitored_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a monitored contract's details."""
    contract = db.get(MonitoredContract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Monitored contract not found")
    return MonitoredContractResponse.model_validate(contract)


@router.get("/{contract_id}/events", response_model=list[MonitoringEventResponse])
async def get_contract_events(
    contract_id: UUID,
    db: Session = Depends(get_db),
):
    """Get all monitoring events for a contract."""
    contract = db.get(MonitoredContract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Monitored contract not found")

    events = (
        db.execute(
            select(MonitoringEvent)
            .where(MonitoringEvent.monitored_contract_id == contract_id)
            .order_by(MonitoringEvent.timestamp.desc())
            .limit(100)
        )
        .scalars()
        .all()
    )

    return [MonitoringEventResponse.model_validate(e) for e in events]


@router.delete("/{contract_id}", status_code=204)
async def delete_monitored_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
):
    """Stop monitoring a contract."""
    contract = db.get(MonitoredContract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Monitored contract not found")
    db.delete(contract)
    db.commit()
