from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request

from ...schemas.demo import DemoRequest, DemoResponse
from ...services.email import send_demo_request

router = APIRouter(prefix="/demo", tags=["demo"])

# Simple in-memory rate limiter: max 5 requests per IP per hour.
# In-memory is fine for a serverless warm instance and prevents
# trivial spam from exhausting the Resend quota.
_MAX_REQUESTS_PER_IP = 5
_RATE_WINDOW = timedelta(hours=1)
_requests: dict[str, list[datetime]] = {}


def _check_rate_limit(client_ip: str) -> None:
    """Raise 429 if the client IP has exceeded the demo request limit."""
    now = datetime.now(timezone.utc)
    # Drop timestamps outside the window
    recent = [ts for ts in _requests.get(client_ip, []) if now - ts < _RATE_WINDOW]
    if len(recent) >= _MAX_REQUESTS_PER_IP:
        raise HTTPException(
            status_code=429,
            detail="Too many demo requests. Please try again later.",
        )
    recent.append(now)
    _requests[client_ip] = recent


@router.post("/request", response_model=DemoResponse, status_code=201)
async def submit_demo_request(data: DemoRequest, request: Request):
    """Submit a demo booking request.

    Public endpoint used by the book-demo form on the marketing site.
    Sends an email notification to the Securithm team when a visitor
    requests a demo. If no Resend API key is configured, the request
    is still accepted (the form saves locally) but no email is sent.
    """
    # Lightweight spam protection
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    name = data.name.strip()
    email = data.email.strip()
    message = data.message.strip() if data.message else None

    # Basic validation
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")

    sent = send_demo_request(name=name, email=email, message=message)

    if sent:
        return DemoResponse(
            status="received",
            notified=True,
            detail=f"Demo request received. We'll reach out to {data.email.strip()}.",
        )

    return DemoResponse(
        status="received",
        notified=False,
        detail="Demo request received and saved locally.",
    )
