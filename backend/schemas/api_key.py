from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class ApiKeyCreate(BaseModel):
    name: str
    rate_limit_per_hour: int = 100


class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    rate_limit_per_hour: Optional[int] = None
    is_active: Optional[bool] = None


class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    rate_limit_per_hour: int

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    full_key: str  # Only returned once on creation

    model_config = {"from_attributes": True}
