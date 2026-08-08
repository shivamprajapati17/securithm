from pydantic import BaseModel, Field
from typing import Optional


class DemoRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Visitor's name")
    email: str = Field(..., max_length=255, description="Visitor's email address")
    message: Optional[str] = Field(
        None, max_length=2000, description="Optional message from the visitor"
    )


class DemoResponse(BaseModel):
    status: str = "received"
    notified: bool = Field(..., description="Whether an email notification was sent")
    detail: str = Field(..., description="Human-readable confirmation message")
