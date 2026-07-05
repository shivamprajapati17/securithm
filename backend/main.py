"""AuditAI — Smart Contract Security Analysis API.

FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.database import engine, Base
from .api.v1 import v1_router

settings = get_settings()


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
        "name": "AuditAI Team",
        "url": "https://auditai.dev",
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
