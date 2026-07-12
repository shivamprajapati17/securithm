"""Vercel serverless entry point for the Securithm FastAPI backend.

Wraps the FastAPI application using Mangum for Vercel's Python serverless runtime.
The backend is accessible at /api/v1/* via vercel.json rewrites.
"""

import json
import os
import sys
import traceback
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
    print(f"[WARN] DB table creation skipped: {e}")

# ── Import the FastAPI app ──
_app = None
_import_error = None
_error_traceback = None
try:
    from backend.main import app as _app
    print("[INFO] Backend app imported successfully")
except Exception as e:
    _import_error = e
    _error_traceback = traceback.format_exc()  # Capture inside except block
    print(f"[ERROR] Failed to import backend.main: {e}")
    traceback.print_exc()

from mangum import Mangum

# Create handler — either the real app or an error-returning stub
if _app is not None and _import_error is None:
    handler = Mangum(_app, lifespan="off")
else:
    error_detail = {
        "error": str(_import_error) if _import_error else "App import returned None",
        "traceback": _error_traceback or "No traceback",
        "sys_path": sys.path,
    }

    async def error_app(scope, receive, send):
        body = json.dumps(error_detail).encode()
        await send(
            {
                "type": "http.response.start",
                "status": 500,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": body})

    handler = Mangum(error_app, lifespan="off")
    print(f"[ERROR] Using error stub handler due to: {_import_error}")
