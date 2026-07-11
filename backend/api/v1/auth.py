from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from uuid import UUID
from httpx import AsyncClient
import secrets

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


async def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to get the current authenticated user from a JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.get(User, UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


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
        invite = db.query(TeamInvite).filter(
            TeamInvite.id == user_in.invite_id,
            TeamInvite.email == user_in.email,
            TeamInvite.status == "pending",
        ).first()

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
        return TokenResponse(access_token=token, token_type="bearer", user_id=str(user.id))

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
        role="admin",
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
        current_user.wallet_address = data.wallet_address if data.wallet_address else None

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ─── OAuth Endpoints ─────────────────────────────────────


async def oauth_login(provider: str, db: Session) -> str:
    """
    Redirect user to the OAuth provider's consent page.
    Returns the provider's authorization URL.
    Uses the `state` parameter (per OAuth 2.0 spec) to pass provider info
    so the redirect_uri stays clean and matches exactly what's registered
    in the provider's console.
    """
    redirect_uri = (
        settings.oauth_redirect_url
    )  # No query params — exact match for provider console

    if provider == "google":
        if not settings.google_client_id:
            raise HTTPException(status_code=501, detail="Google OAuth not configured")
        return (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.google_client_id}"
            f"&redirect_uri={redirect_uri}"
            "&response_type=code"
            "&scope=openid%20email%20profile"
            f"&state={provider}"
        )

    elif provider == "github":
        if not settings.github_client_id:
            raise HTTPException(status_code=501, detail="GitHub OAuth not configured")
        return (
            "https://github.com/login/oauth/authorize"
            f"?client_id={settings.github_client_id}"
            f"&redirect_uri={redirect_uri}"
            "&scope=read:user%20user:email"
            f"&state={provider}"
        )

    raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


async def oauth_callback(state: str, code: str, db: Session) -> TokenResponse:
    """
    Handle OAuth callback from the provider.
    The `state` parameter (per OAuth 2.0 spec) carries the provider name,
    allowing the redirect_uri to stay clean and match exactly what's
    registered in the provider's console.

    Exchanges the authorization code for an access token,
    fetches the user's profile, and creates/updates the local user.
    """
    provider = state  # state carries the provider name

    async with AsyncClient() as client:
        if provider == "google":
            # Exchange code for tokens
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "redirect_uri": settings.oauth_redirect_url,
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                raise HTTPException(
                    status_code=400, detail="Failed to exchange Google auth code"
                )

            tokens = token_resp.json()
            # Fetch user info
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=400, detail="Failed to fetch Google user info"
                )

            userinfo = userinfo_resp.json()
            email = userinfo.get("email", "")
            display_name = userinfo.get("name", "")
            avatar_url = userinfo.get("picture", "")

        elif provider == "github":
            # Exchange code for access token
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
                raise HTTPException(
                    status_code=400, detail="Failed to exchange GitHub auth code"
                )

            tokens = token_resp.json()
            # Fetch user info
            userinfo_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {tokens['access_token']}",
                    "Accept": "application/json",
                },
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=400, detail="Failed to fetch GitHub user info"
                )

            userinfo = userinfo_resp.json()
            email = userinfo.get("email", "") or ""
            display_name = userinfo.get("login", "")
            avatar_url = userinfo.get("avatar_url", "")

            # If email not in public profile, fetch emails separately
            if not email:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {tokens['access_token']}",
                        "Accept": "application/json",
                    },
                )
                if emails_resp.status_code == 200:
                    emails = emails_resp.json()
                    primary = [e for e in emails if e.get("primary")]
                    if primary:
                        email = primary[0]["email"]
                    elif emails:
                        email = emails[0]["email"]
        else:
            raise HTTPException(
                status_code=400, detail=f"Unsupported provider: {provider}"
            )

    if not email:
        raise HTTPException(
            status_code=400, detail="Could not retrieve email from provider"
        )

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create new user with organization
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
        # Update avatar and display name on re-login
        user.display_name = user.display_name or display_name
        if avatar_url:
            user.avatar_url = avatar_url

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, token_type="bearer", user_id=str(user.id))


@router.get("/login/{provider}")
async def login_oauth(provider: str, db: Session = Depends(get_db)):
    """Initiate OAuth login with a provider (google or github)."""
    url = await oauth_login(provider, db)
    return {"authorization_url": url}


@router.get("/callback")
async def callback_oauth(
    state: str = "google",
    code: str = "",
    db: Session = Depends(get_db),
):
    """Handle OAuth callback from provider.

    The `state` parameter (per OAuth 2.0 spec) carries the flow type:
    - "google"         → Google identity login
    - "github"          → GitHub identity login
    - "github_repo"     → GitHub repo token connection (no JWT created)

    This keeps the redirect_uri clean for registration in provider consoles.
    """
    if not code:
        return RedirectResponse(url="/auth/login?error=missing_code")

    frontend_url = (
        settings.cors_origins[0]
        if settings.cors_origins
        else "http://localhost:3000"
    )

    # ── Handle GitHub repo connection callback ──
    if state.startswith("github_repo"):
        # Extract the connection_id from state: "github_repo_{connection_id}"
        parts = state.split("_", 2)
        connection_id = parts[2] if len(parts) >= 3 else ""
        redirect_url = await _handle_github_repo_callback(code, connection_id, db) if connection_id else None
        if redirect_url:
            return RedirectResponse(url=redirect_url)
        return RedirectResponse(url=f"{frontend_url}/dashboard/repos?error=github_connection_failed")

    # ── Handle identity login callbacks ──
    try:
        result = await oauth_callback(state, code, db)
        redirect = f"{frontend_url}/auth/callback?token={result.access_token}"
        return RedirectResponse(url=redirect)
    except HTTPException as e:
        return RedirectResponse(url=f"{frontend_url}/auth/login?error={e.detail}")


# ─── GitHub Repo Connection OAuth ──────────────────────
# Uses the same redirect_uri as the login OAuth, differentiated via `state`:
#   state="github"              → identity login (existing)
#   state="github_repo_{cid}"   → repo token connection (cid = connection_id)
#
# The connection_id is a random UUID stored in memory, mapped to the authenticated
# user's ID. This allows the callback to identify the user without requiring them
# to have logged in via GitHub OAuth (works for email/password users too).

# In-memory store for pending GitHub repo connections.
# Maps {connection_id: (user_id_str, created_at)} — entries expire after 10 minutes.
_pending_github_connections: dict[str, tuple[str, datetime]] = {}
_PENDING_CONNECTION_TTL = timedelta(minutes=10)


def _cleanup_stale_connections():
    """Remove pending connections that have expired (older than 10 minutes)."""
    now = datetime.now(timezone.utc)
    stale = [
        cid for cid, (_, created_at) in _pending_github_connections.items()
        if now - created_at > _PENDING_CONNECTION_TTL
    ]
    for cid in stale:
        del _pending_github_connections[cid]


async def _handle_github_repo_callback(code: str, connection_id: str, db: Session) -> str | None:
    """Exchange the OAuth code for a GitHub access token, then look up the
    local user via the connection_id stored in memory, and save the token.
    Returns the frontend redirect URL or None on failure."""
    # Clean up any stale entries before processing
    _cleanup_stale_connections()

    # Look up the user from our in-memory store
    entry = _pending_github_connections.pop(connection_id, None)
    if not entry:
        return None  # Connection expired or invalid

    user_id_str = entry[0]  # tuple: (user_id, created_at)

    async with AsyncClient() as client:
        # Exchange code for token
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

        # Fetch GitHub user info to get the login name
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

    # Find the local user by the connection_id's user_id
    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, AttributeError):
        return None

    user = db.get(User, user_uuid)
    if not user:
        return None

    # Save the repo-scoped token and GitHub ID
    user.github_repo_token = gh_token
    if github_id:
        user.github_id = github_id
    db.commit()

    frontend_url = (
        settings.cors_origins[0]
        if settings.cors_origins
        else "http://localhost:3000"
    )
    return f"{frontend_url}/dashboard/repos?github_connected={github_login}"


@router.get("/github/connect")
async def github_connect(
    current_user: User = Depends(get_current_user),
):
    """Initiate GitHub repo connection OAuth flow.
    Returns the GitHub authorization URL. The frontend should redirect the user there.
    Generates a random connection_id mapped to the authenticated user, so the
    callback can identify the user regardless of how they logged in.
    """
    if not settings.github_client_id:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured")

    # Clean up stale entries before adding a new one
    _cleanup_stale_connections()

    # Generate a random connection ID and store the user mapping with timestamp
    connection_id = secrets.token_hex(16)
    _pending_github_connections[connection_id] = (str(current_user.id), datetime.now(timezone.utc))

    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.oauth_redirect_url}"
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
            params={"per_page": 50, "sort": "updated", "affiliation": "owner,collaborator"},
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
            result.append({
                "id": r["id"],
                "name": r["name"],
                "full_name": r["full_name"],
                "description": r.get("description") or "",
                "private": r["private"],
                "html_url": r["html_url"],
                "language": r.get("language") or "",
                "updated_at": r.get("updated_at", ""),
                "default_branch": r.get("default_branch", "main"),
            })

        return {"repos": result, "connected": True, "message": ""}