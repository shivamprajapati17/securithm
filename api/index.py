"""Vercel serverless entry point for the Securithm FastAPI backend.

Wraps the FastAPI application using Mangum for Vercel's Python serverless runtime.
The backend is accessible at /api/v1/* via vercel.json rewrites.

On Vercel:
  - DATABASE_URL must be set to a managed PostgreSQL connection string
  - OAUTH_REDIRECT_URL should be set to https://<project>.vercel.app/api/index.py
  - DEBUG=true enables auto table creation on cold start
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# ── Environment defaults ──
# These can be overridden by Vercel Environment Variables
os.environ.setdefault("DEBUG", "true")

# ── Create database tables on cold start if DEBUG ──
# (Vercel serverless functions are stateless, so we need to ensure
#  tables exist on each cold start. In production, use Alembic migrations.)
if os.environ.get("DEBUG", "").lower() in ("true", "1", "yes"):
    from backend.core.database import engine, Base
    from backend.models import *  # noqa: F401, F403 — register all models

    Base.metadata.create_all(bind=engine)

# ── Import the FastAPI app ──
from backend.main import app  # noqa: E402
from mangum import Mangum  # noqa: E402

# Create the Vercel ASGI handler
# lifespan="off" because we handle table creation above
handler = Mangum(app, lifespan="off")
