import uuid
import secrets
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from typing import Optional

from ...core.database import get_db
from ...models.api_key import ApiKey
from ...models.user import User
from ...schemas.api_key import (
    ApiKeyCreate,
    ApiKeyUpdate,
    ApiKeyResponse,
    ApiKeyCreatedResponse,
)
from ..v1.auth import get_current_user

router = APIRouter(prefix="/auth/api-keys", tags=["api-keys"])

# ─── In-memory rate limiter ───────────────────────────────
# Tracks requests per API key per hour window.
# Structure: { key_hash: { window_start_timestamp: count } }
_rate_limit_store: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))


def _get_hour_window() -> int:
    """Get the current hour window timestamp (seconds since epoch, floored to hour)."""
    now = datetime.now(timezone.utc)
    return int(now.timestamp() // 3600)


def check_api_key_rate_limit(key_hash: str, max_per_hour: int) -> bool:
    """Check if the API key has exceeded its rate limit.
    Returns True if allowed, False if rate limited."""
    window = _get_hour_window()
    count = _rate_limit_store[key_hash].get(window, 0)
    return count < max_per_hour


def record_api_key_usage(key_hash: str):
    """Record an API request for rate limiting."""
    window = _get_hour_window()
    _rate_limit_store[key_hash][window] += 1

    # Clean up old windows (older than 2 hours)
    old_windows = [w for w in _rate_limit_store[key_hash] if w < window - 2]
    for w in old_windows:
        del _rate_limit_store[key_hash][w]


def get_api_key_from_header(authorization: Optional[str] = None) -> Optional[str]:
    """Extract API key from Authorization header (Bearer sk_...)."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() == "bearer" and token.startswith("sk_"):
        return token
    return None


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key.
    Returns (full_key, key_prefix, key_hash).
    Format: sk_live_<64 chars of hex>
    """
    raw = secrets.token_hex(32)  # 64 hex chars
    full_key = f"sk_live_{raw}"
    prefix = full_key[:15] + "..."  # e.g. "sk_live_a1b2c3..."
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, prefix, key_hash


@router.post("", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new API key for the authenticated user."""
    # Enforce max keys per user
    existing_count = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.is_active,
        )
        .count()
    )
    if existing_count >= 10:
        raise HTTPException(
            status_code=400, detail="Maximum of 10 active API keys allowed"
        )

    # Validate rate limit input
    if data.rate_limit_per_hour < 1:
        raise HTTPException(
            status_code=400, detail="Rate limit must be at least 1 request per hour"
        )
    if data.rate_limit_per_hour > 10000:
        raise HTTPException(
            status_code=400, detail="Rate limit cannot exceed 10,000 requests per hour"
        )

    full_key, prefix, key_hash = generate_api_key()

    api_key = ApiKey(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=data.name,
        key_prefix=prefix,
        key_hash=key_hash,
        rate_limit_per_hour=data.rate_limit_per_hour,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        full_key=full_key,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        expires_at=api_key.expires_at,
        is_active=api_key.is_active,
        rate_limit_per_hour=api_key.rate_limit_per_hour,
    )


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all API keys for the authenticated user."""
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )

    return [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
            expires_at=k.expires_at,
            is_active=k.is_active,
            rate_limit_per_hour=k.rate_limit_per_hour,
        )
        for k in keys
    ]


@router.patch("/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: uuid.UUID,
    data: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an API key's name, rate limit, or active status."""
    api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.id == key_id,
            ApiKey.user_id == current_user.id,
        )
        .first()
    )

    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    if data.name is not None:
        api_key.name = data.name
    if data.rate_limit_per_hour is not None:
        if data.rate_limit_per_hour < 1 or data.rate_limit_per_hour > 10000:
            raise HTTPException(
                status_code=400, detail="Rate limit must be between 1 and 10,000"
            )
        api_key.rate_limit_per_hour = data.rate_limit_per_hour
    if data.is_active is not None:
        api_key.is_active = data.is_active

    db.commit()
    db.refresh(api_key)

    return ApiKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        expires_at=api_key.expires_at,
        is_active=api_key.is_active,
        rate_limit_per_hour=api_key.rate_limit_per_hour,
    )


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke (delete) an API key."""
    api_key = (
        db.query(ApiKey)
        .filter(
            ApiKey.id == key_id,
            ApiKey.user_id == current_user.id,
        )
        .first()
    )

    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    db.delete(api_key)
    db.commit()


def get_api_key_usage_stats(key_hash: str) -> int:
    """Get the current usage count for an API key in the current hour window."""
    window = _get_hour_window()
    return _rate_limit_store[key_hash].get(window, 0)


@router.get("/usage", response_model=dict[str, int])
async def list_api_key_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current rate limit usage count per API key for the authenticated user.
    Returns a map of { key_id: current_usage_count }."""
    keys = (
        db.query(ApiKey)
        .filter(
            ApiKey.user_id == current_user.id,
            ApiKey.is_active,
        )
        .all()
    )

    result: dict[str, int] = {}
    for key in keys:
        result[str(key.id)] = get_api_key_usage_stats(key.key_hash)

    return result
