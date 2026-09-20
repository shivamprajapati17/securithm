from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from uuid import UUID
from httpx import AsyncClient
import os
import secrets
import base64
import json

from ...core.database import get_db
from ...core.config import get_settings
from ...core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_token,
)
from ...models.user import User, Organization, Plan
from ...models.team import TeamInvite
from ...schemas.auth import LoginRequest, TokenResponse
from ...schemas.user import UserCreate, UserResponse, UserUpdate

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


# ─── JWT Helpers ─────────────────────────────────────────


def _decode_jwt_payload(token: str) -> dict | None:
    """Decode JWT payload without signature verification (for claim inspection only)."""
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        return json.loads(base64.b64decode(payload_b64))
    except Exception:
        return None


async def _verify_supabase_token(token: str) -> dict | None:
    """Verify a Supabase JWT by calling the Supabase auth API.

    Returns the Supabase user dict on success, None on failure.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    async with AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.supabase_service_role_key,
            },
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return None


def _auto_create_user_from_supabase(supabase_user: dict, db: Session) -> User:
    """Create a local User + Org for a Supabase-authenticated user."""
    email = supabase_user.get("email", "")
    user_metadata = supabase_user.get("user_metadata", {})
    display_name = (
        user_metadata.get("full_name")
        or user_metadata.get("name")
        or user_metadata.get("display_name")
        or email.split("@")[0]
    )
    avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture") or ""

    # Ensure a Free plan exists
    free_plan = db.query(Plan).filter(Plan.name == "Free").first()
    if not free_plan:
        free_plan = Plan(
            name="Free",
            max_scans_per_month=50,
            max_monitored_contracts=1,
            price_usd=0.0,
        )
        db.add(free_plan)
        db.flush()

    org = Organization(
        name=f"{display_name}'s Org",
        plan_id=free_plan.id,
    )
    db.add(org)
    db.flush()

    user = User(
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
        auth_id=supabase_user["id"],
        org_id=org.id,
        role="member",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _is_supabase_token(claims: dict | None) -> bool:
    """Check if decoded claims indicate a Supabase auth token."""
    if not claims or not isinstance(claims, dict):
        return False
    iss = str(claims.get("iss", "")).lower()
    aud = str(claims.get("aud", ""))
    role = str(claims.get("role", ""))
    return (
        "supabase" in iss
        or iss == "supabase"
        or aud == "authenticated"
        or role in ("authenticated", "anon", "service_role")
    )


# ─── Auth Dependencies ───────────────────────────────────


def get_optional_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None instead of raising.

    Used by scan endpoints to tag scan jobs to the logged-in account while
    still allowing anonymous demo scans.
    """
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    # Try legacy JWT first (fast, no network call)
    payload = verify_token(token)
    if payload:
        user_id = payload.get("sub")
        if user_id:
            try:
                user = db.get(User, UUID(user_id))
                if user:
                    return user
            except (ValueError, AttributeError):
                pass
            user = (
                db.query(User)
                .filter((User.email == user_id) | (User.auth_id == user_id))
                .first()
            )
            if user:
                return user

    # Try Supabase JWT
    claims = _decode_jwt_payload(token)
    if _is_supabase_token(claims):
        supabase_user_id = claims.get("sub")
        if supabase_user_id:
            user = db.query(User).filter(User.auth_id == supabase_user_id).first()
            if user:
                return user

    return None


async def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get the current authenticated user.

    Supports both legacy JWTs (python-jose) and Supabase JWTs.
    For Supabase users, auto-creates a local User record on first login.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    # ── Try legacy JWT first (fast, no HTTP call) ──
    payload = verify_token(token)
    if payload:
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = None
        try:
            user = db.get(User, UUID(user_id))
        except (ValueError, AttributeError):
            pass
        if not user:
            user = (
                db.query(User)
                .filter((User.email == user_id) | (User.auth_id == user_id))
                .first()
            )
        email = payload.get("email") or (user_id if "@" in str(user_id) else None)
        if not user and email:
            user = db.query(User).filter(User.email == email).first()
        if not user and email:
            # Auto-create user if signed via Next.js auth
            display_name = payload.get("name") or email.split("@")[0]
            free_plan = db.query(Plan).filter(Plan.name == "Free").first()
            if not free_plan:
                free_plan = Plan(
                    name="Free",
                    max_scans_per_month=50,
                    max_monitored_contracts=1,
                    price_usd=0.0,
                )
                db.add(free_plan)
                db.flush()
            org = Organization(name=f"{display_name}'s Org", plan_id=free_plan.id)
            db.add(org)
            db.flush()
            user = User(
                email=email,
                display_name=display_name,
                auth_id=str(user_id),
                org_id=org.id,
                role="member",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        if user:
            return user
        raise HTTPException(status_code=401, detail="User not found")

    # ── Try Supabase JWT ──
    claims = _decode_jwt_payload(token)
    if not _is_supabase_token(claims):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    supabase_user_id = claims.get("sub")
    if not supabase_user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Fast path: look up existing user by auth_id
    user = db.query(User).filter(User.auth_id == supabase_user_id).first()
    if user:
        return user

    # Check by email (user registered via legacy and is now using Supabase)
    email = claims.get("email", "")
    if email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.auth_id = supabase_user_id
            db.commit()
            db.refresh(user)
            return user

    # Verify token with Supabase API and auto-create user
    supabase_user = await _verify_supabase_token(token)
    if not supabase_user:
        raise HTTPException(status_code=401, detail="Invalid Supabase token")

    user = _auto_create_user_from_supabase(supabase_user, db)
    return user


# ─── Auth Endpoints ──────────────────────────────────────


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """Register a new user account with email/password.

    If `invite_id` is provided, the user will be added to the
    inviting organization instead of creating a new one.
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # ── Handle invite-based registration ──
    if user_in.invite_id:
        invite = (
            db.query(TeamInvite)
            .filter(
                TeamInvite.id == user_in.invite_id,
                TeamInvite.email == user_in.email,
                TeamInvite.status == "pending",
            )
            .first()
        )

        if not invite:
            raise HTTPException(
                status_code=404,
                detail="Invitation not found or already processed",
            )

        if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
            invite.status = "expired"
            db.commit()
            raise HTTPException(status_code=410, detail="Invitation has expired")

        user = User(
            email=user_in.email,
            display_name=user_in.display_name or user_in.email.split("@")[0],
            password_hash=get_password_hash(user_in.password),
            org_id=invite.org_id,
            role="member",
        )
        db.add(user)

        invite.status = "accepted"
        invite.accepted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(
            access_token=token, token_type="bearer", user_id=str(user.id)
        )

    # ── Normal registration ──
    free_plan = db.query(Plan).filter(Plan.name == "Free").first()
    if not free_plan:
        free_plan = Plan(
            name="Free",
            max_scans_per_month=50,
            max_monitored_contracts=1,
            price_usd=0.0,
        )
        db.add(free_plan)
        db.flush()

    org = Organization(
        name=f"{user_in.display_name or user_in.email.split('@')[0]}'s Org",
        plan_id=free_plan.id,
    )
    db.add(org)
    db.flush()

    user = User(
        email=user_in.email,
        display_name=user_in.display_name or user_in.email.split("@")[0],
        password_hash=get_password_hash(user_in.password),
        org_id=org.id,
        role="member",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, token_type="bearer", user_id=str(user.id))


@router.post("/login", response_model=TokenResponse)
async def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, token_type="bearer", user_id=str(user.id))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    result = UserResponse.model_validate(current_user)
    # Include org_name
    if current_user.organization:
        result.org_name = current_user.organization.name
    return result


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current authenticated user's profile (display_name, wallet_address, etc)."""
    # Use model_fields_set to distinguish explicit null from "not provided"
    if "display_name" in data.model_fields_set:
        current_user.display_name = data.display_name
    if "email" in data.model_fields_set:
        current_user.email = data.email
    if "wallet_address" in data.model_fields_set:
        current_user.wallet_address = (
            data.wallet_address if data.wallet_address else None
        )

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ─── Dynamic Host & OAuth Helpers ─────────────────────────


def _get_base_url(request: Request | None = None) -> str:
    """Determine frontend base URL dynamically from request or environment."""
    if request:
        proto = (
            request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
        )
        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if host:
            return f"{proto}://{host}".rstrip("/")
    vercel_url = os.environ.get("VERCEL_URL")
    if vercel_url:
        return f"https://{vercel_url}".rstrip("/")
    if settings.frontend_url and not settings.frontend_url.startswith(
        "http://localhost"
    ):
        return settings.frontend_url.rstrip("/")
    return "http://localhost:3000"


def _get_oauth_redirect_url(request: Request | None = None) -> str:
    """Get the OAuth redirect URI matching Google Console registration."""
    if settings.oauth_redirect_url and not settings.oauth_redirect_url.startswith(
        "http://localhost"
    ):
        return settings.oauth_redirect_url
    if request:
        proto = (
            request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
        )
        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if host and ("vercel.app" in host or "securithm" in host):
            return f"{proto}://{host}/api/v1/auth/callback"
    vercel_url = os.environ.get("VERCEL_URL")
    if vercel_url:
        return f"https://{vercel_url}/api/v1/auth/callback"
    return settings.oauth_redirect_url or "http://localhost:8000/api/v1/auth/callback"


# ─── OAuth Endpoints ─────────────────────────────────────


async def oauth_login(
    provider: str, db: Session, request: Request | None = None
) -> str:
    """
    Redirect user to Google OAuth consent page.
    Returns the Google authorization URL.
    """
    if provider != "google":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider '{provider}'. Only Google OAuth is supported for identity login.",
        )

    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    redirect_uri = _get_oauth_redirect_url(request)

    return (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={redirect_uri}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&prompt=select_account"
        "&state=google"
    )


async def oauth_callback(
    state: str, code: str, db: Session, request: Request | None = None
) -> TokenResponse:
    """
    Handle OAuth callback from Google.
    Exchanges authorization code for access token, fetches profile, and returns app JWT.
    """
    if state != "google":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported login provider '{state}'. Only Google OAuth is supported.",
        )

    redirect_uri = _get_oauth_redirect_url(request)

    async with AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to exchange Google auth code"
            )

        tokens = token_resp.json()
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens.get('access_token', '')}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to fetch Google user info"
            )

        userinfo = userinfo_resp.json()
        email = userinfo.get("email", "")
        display_name = userinfo.get("name", "")
        avatar_url = userinfo.get("picture", "")

    if not email:
        raise HTTPException(
            status_code=400, detail="Could not retrieve email from Google"
        )

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        free_plan = db.query(Plan).filter(Plan.name == "Free").first()
        if not free_plan:
            free_plan = Plan(
                name="Free",
                max_scans_per_month=50,
                max_monitored_contracts=1,
                price_usd=0.0,
            )
            db.add(free_plan)
            db.flush()

        org = Organization(
            name=f"{display_name or email.split('@')[0]}'s Org",
            plan_id=free_plan.id,
        )
        db.add(org)
        db.flush()

        user = User(
            email=email,
            display_name=display_name or email.split("@")[0],
            avatar_url=avatar_url,
            org_id=org.id,
        )
        db.add(user)
    else:
        if display_name and not user.display_name:
            user.display_name = display_name
        if avatar_url:
            user.avatar_url = avatar_url

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, token_type="bearer", user_id=str(user.id))


@router.get("/login/{provider}")
async def login_oauth(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Initiate OAuth login with Google."""
    url = await oauth_login(provider, db, request)
    return {"authorization_url": url}


@router.get("/callback")
async def callback_oauth(
    request: Request,
    state: str = "google",
    code: str = "",
    db: Session = Depends(get_db),
):
    """Handle OAuth callback from provider.

    The `state` parameter carries the flow type:
    - "google"         → Google identity login
    - "github_repo_*"  → GitHub repo token connection
    """
    frontend_url = _get_base_url(request)

    if not code:
        return RedirectResponse(url=f"{frontend_url}/auth/login?error=missing_code")

    # ── Handle GitHub repo connection callback ──
    if state.startswith("github_repo"):
        parts = state.split("_", 2)
        connection_id = parts[2] if len(parts) >= 3 else ""
        redirect_url = (
            await _handle_github_repo_callback(code, connection_id, db, request)
            if connection_id
            else None
        )
        if redirect_url:
            return RedirectResponse(url=redirect_url)
        return RedirectResponse(
            url=f"{frontend_url}/dashboard/repos?error=github_connection_failed"
        )

    # ── Handle identity login callbacks ──
    try:
        result = await oauth_callback(state, code, db, request)
        redirect = f"{frontend_url}/auth/callback?token={result.access_token}"
        return RedirectResponse(url=redirect)
    except HTTPException as e:
        return RedirectResponse(url=f"{frontend_url}/auth/login?error={e.detail}")


# ─── GitHub Repo Connection OAuth ──────────────────────
# Maps {connection_id: (user_id_str, created_at)} — entries expire after 10 minutes.
_pending_github_connections: dict[str, tuple[str, datetime]] = {}
_PENDING_CONNECTION_TTL = timedelta(minutes=10)


def _cleanup_stale_connections():
    """Remove pending connections that have expired (older than 10 minutes)."""
    now = datetime.now(timezone.utc)
    stale = [
        cid
        for cid, (_, created_at) in _pending_github_connections.items()
        if now - created_at > _PENDING_CONNECTION_TTL
    ]
    for cid in stale:
        del _pending_github_connections[cid]


async def _handle_github_repo_callback(
    code: str, connection_id: str, db: Session, request: Request | None = None
) -> str | None:
    """Exchange OAuth code for GitHub access token and save for repo scans."""
    _cleanup_stale_connections()

    entry = _pending_github_connections.pop(connection_id, None)
    if not entry:
        return None

    user_id_str = entry[0]

    async with AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            return None

        tokens = token_resp.json()
        gh_token = tokens.get("access_token")
        if not gh_token:
            return None

        userinfo_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/json",
            },
        )
        if userinfo_resp.status_code != 200:
            return None

        userinfo = userinfo_resp.json()
        github_id = str(userinfo.get("id", ""))
        github_login = userinfo.get("login", "")

    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, AttributeError):
        return None

    user = db.get(User, user_uuid)
    if not user:
        return None

    user.github_repo_token = gh_token
    if github_id:
        user.github_id = github_id
    db.commit()

    frontend_url = _get_base_url(request)
    return f"{frontend_url}/dashboard/repos?github_connected={github_login}"


@router.get("/github/connect")
async def github_connect(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Initiate GitHub repo connection OAuth flow."""
    if not settings.github_client_id:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured")

    _cleanup_stale_connections()

    connection_id = secrets.token_hex(16)
    _pending_github_connections[connection_id] = (
        str(current_user.id),
        datetime.now(timezone.utc),
    )

    redirect_uri = _get_oauth_redirect_url(request)
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={redirect_uri}"
        "&scope=repo%20read:user%20user:email"
        f"&state=github_repo_{connection_id}"
    )
    return {"authorization_url": url}


@router.get("/github/disconnect")
async def github_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect the GitHub repo token."""
    current_user.github_repo_token = None
    db.commit()
    return {"status": "disconnected"}


@router.get("/github/repos")
async def list_github_repos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch the user's GitHub repos using their stored repo token."""
    if not current_user.github_repo_token:
        return {
            "repos": [],
            "connected": False,
            "message": "No GitHub repo token. Connect via CONNECT_GITHUB above.",
        }

    async with AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization": f"Bearer {current_user.github_repo_token}",
                "Accept": "application/json",
            },
            params={
                "per_page": 50,
                "sort": "updated",
                "affiliation": "owner,collaborator",
            },
        )

        if resp.status_code == 401:
            current_user.github_repo_token = None
            db.commit()
            return {
                "repos": [],
                "connected": False,
                "message": "GitHub token expired. Reconnect below.",
            }

        if resp.status_code != 200:
            return {
                "repos": [],
                "connected": True,
                "message": f"GitHub API error: {resp.status_code}",
            }

        repos = resp.json()
        result = []
        for r in repos:
            result.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "full_name": r["full_name"],
                    "description": r.get("description") or "",
                    "private": r["private"],
                    "html_url": r["html_url"],
                    "language": r.get("language") or "",
                    "updated_at": r.get("updated_at", ""),
                    "default_branch": r.get("default_branch", "main"),
                }
            )

        return {"repos": result, "connected": True, "message": ""}
