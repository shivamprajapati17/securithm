"""Securithm — Smart Contract Security Analysis API.

FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from .core.config import get_settings
from .core.database import engine, Base, SessionLocal
from .api.v1 import v1_router
from .api.v1.api_keys import get_api_key_from_header, check_api_key_rate_limit, record_api_key_usage
from .models.api_key import ApiKey

import hashlib
from datetime import datetime, timezone

settings = get_settings()


class ApiKeyRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces rate limits for API key-authenticated requests.
    
    Requests using a JWT (regular user sessions) are not rate limited.
    Requests using an API key (sk_...) are checked against the key's
    configured rate_limit_per_hour.
    """

    async def dispatch(self, request: Request, call_next):
        # Only apply to /api/v1/ routes
        if not request.url.path.startswith("/api/v1/"):
            return await call_next(request)

        auth = request.headers.get("authorization")
        key_token = get_api_key_from_header(auth)

        if key_token:
            key_hash = hashlib.sha256(key_token.encode()).hexdigest()
            db = SessionLocal()
            try:
                api_key = db.query(ApiKey).filter(
                    ApiKey.key_hash == key_hash,
                    ApiKey.is_active == True,
                ).first()

                if not api_key:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Invalid API key"},
                    )

                if not check_api_key_rate_limit(key_hash, api_key.rate_limit_per_hour):
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": f"Rate limit exceeded. Maximum {api_key.rate_limit_per_hour} requests per hour."
                        },
                    )

                record_api_key_usage(key_hash)
                api_key.last_used_at = datetime.now(timezone.utc)
                db.commit()
            finally:
                db.close()

        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle handler.

    On startup: create database tables (dev only — use Alembic in production).
    On shutdown: clean up resources.
    """
    # Create tables in dev mode
    if settings.debug:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Instant AI-powered smart contract security analysis API. "
    "Submit Solidity/Rust code, deployed contract addresses, or GitHub URLs "
    "for instant vulnerability scanning with severity-tagged findings, "
    "fix suggestions, and risk scoring.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Securithm Team",
        "url": "https://securithm.dev",
    },
    license_info={
        "name": "Proprietary",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key rate limiting middleware
app.add_middleware(ApiKeyRateLimitMiddleware)


# Health check endpoint
@app.get("/health", tags=["system"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


# Register API routes
app.include_router(v1_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "type": exc.__class__.__name__,
        },
    )
