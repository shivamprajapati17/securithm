from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from httpx import AsyncClient

from ...core.database import get_db
from ...core.config import get_settings
from ...core.security import get_password_hash, verify_password, create_access_token, verify_token
from ...models.user import User, Organization, Plan
from ...schemas.auth import LoginRequest, TokenResponse
from ...schemas.user import UserCreate, UserResponse

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
    """Register a new user account with email/password."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

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
    redirect_uri = settings.oauth_redirect_url  # No query params — exact match for provider console

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
                raise HTTPException(status_code=400, detail="Failed to exchange Google auth code")

            tokens = token_resp.json()
            # Fetch user info
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

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
                raise HTTPException(status_code=400, detail="Failed to exchange GitHub auth code")

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
                raise HTTPException(status_code=400, detail="Failed to fetch GitHub user info")

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
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from provider")

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

    The `state` parameter (per OAuth 2.0 spec) carries the provider name
    so the redirect_uri stays clean for registration in the provider console.

    Redirects the browser back to the frontend with the JWT token.
    """
    if not code:
        return RedirectResponse(url="/auth/login?error=missing_code")

    try:
        result = await oauth_callback(state, code, db)
        # Redirect to frontend with token
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
        redirect = f"{frontend_url}/auth/callback?token={result.access_token}"
        return RedirectResponse(url=redirect)
    except HTTPException as e:
        # Use the first CORS origin as the frontend URL, fallback to localhost
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
        return RedirectResponse(url=f"{frontend_url}/auth/login?error={e.detail}")


# ─── GitHub Repo Connection OAuth ──────────────────────


@router.get("/github/repos")
async def list_github_repos(current_user: User = Depends(get_current_user)):
    """List the user's connected GitHub repos (stub for now)."""
    if not current_user.github_id:
        return {"repos": [], "message": "No GitHub account connected. Use GitHub OAuth to connect."}
    return {"repos": [], "message": "GitHub integration pending - connect via GitHub OAuth first"}
