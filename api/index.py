"""Vercel serverless entry point for the Securithm FastAPI backend.

Wraps the FastAPI application using Mangum for Vercel's Python serverless runtime.
The backend is accessible at /api/v1/* via vercel.json rewrites.
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# ── Environment defaults ──
os.environ.setdefault("DEBUG", "true")

# ── Create database tables on cold start if DEBUG ──
try:
    if os.environ.get("DEBUG", "").lower() in ("true", "1", "yes"):
        from backend.core.database import engine, Base
        from backend.models import *  # noqa: F401, F403
        Base.metadata.create_all(bind=engine)
except Exception as e:
    # Log but don't crash — tables may already exist or DB may not be available
    print(f"[WARN] DB table creation skipped: {e}")

# ── Import the FastAPI app ──
try:
    from backend.main import app
    print("[INFO] Backend app imported successfully")
except Exception as e:
    print(f"[ERROR] Failed to import backend.main: {e}")
    print(f"[ERROR] sys.path: {sys.path}")
    import traceback
    traceback.print_exc()
    raise

from mangum import Mangum

# Create the Vercel ASGI handler
handler = Mangum(app, lifespan="off")
print("[INFO] Mangum handler created")
