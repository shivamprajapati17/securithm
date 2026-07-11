from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    invite_id: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    wallet_address: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    wallet_address: Optional[str] = None
    github_id: Optional[str] = None
    role: Optional[str] = "member"
    org_id: Optional[UUID] = None
    org_name: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}
