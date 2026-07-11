from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class TeamInviteRequest(BaseModel):
    email: str = Field(..., description="Email address of the person to invite")
    message: Optional[str] = Field(
        None, max_length=500, description="Optional personal message"
    )


class TeamInviteResponse(BaseModel):
    id: UUID
    email: str
    status: str
    message: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamInviteActionResponse(BaseModel):
    id: UUID
    email: str
    status: str
    message: Optional[str] = None

    model_config = {"from_attributes": True}


class TeamMemberResponse(BaseModel):
    id: UUID
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "member"
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MemberRoleUpdate(BaseModel):
    role: str = Field(
        ..., pattern=r"^(admin|member|viewer)$", description="New role for the member"
    )
