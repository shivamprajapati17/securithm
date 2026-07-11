"""Vercel serverless entry point for the Securithm FastAPI backend.

This file wraps the FastAPI application using Mangum to make it compatible
with Vercel's serverless Python runtime.

Usage:
    Deploy via: vercel --prod
    The backend will be available at:
      https://<project>.vercel.app/api/backend/*
"""

import os
import sys
from pathlib import Path

# Add the project root to sys.path so imports from backend/ work
project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# ── Database ──
# On Vercel, DATABASE_URL must be set via environment variables.
# Production: postgresql://user:pass@host:5432/db
# For local dev: sqlite:///./securithm_dev.db
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///./securithm_dev.db"

# ── Debug ──
# Enable debug to auto-create tables on startup
os.environ.setdefault("DEBUG", "true")

from backend.main import app  # noqa: E402
from mangum import Mangum  # noqa: E402

# Create the Mangum ASGI handler for Vercel
handler = Mangum(app, lifespan="off")
