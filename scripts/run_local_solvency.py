"""Local dev launcher for browser-testing the solvency dashboard.

Runs the FastAPI backend against a local SQLite file (no Postgres needed),
seeds the demo organization, and serves on http://127.0.0.1:8000.

Usage:
    python scripts/run_local_solvency.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure the project root is importable when run as a script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ["DATABASE_URL"] = "sqlite:///./browser_test.db"
os.environ.setdefault("SOLVENCY_SIGNING_SECRET", "local-browser-test-secret")
os.environ.setdefault("DEBUG", "true")

import sqlalchemy as sa  # noqa: E402

# Patch the database module to use SQLite with cross-thread support (uvicorn
# runs sync endpoints in a threadpool; SQLite needs check_same_thread=False).
from backend.core import database  # noqa: E402

database.engine = sa.create_engine(
    database.settings.database_url,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)
database.SessionLocal = database.sessionmaker(
    autocommit=False, autoflush=False, bind=database.engine
)

from backend.core.database import Base  # noqa: E402
from backend.models import *  # noqa: F401, F403

Base.metadata.create_all(bind=database.engine)

import uvicorn  # noqa: E402

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, log_level="info")
