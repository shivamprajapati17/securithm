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

# ── Create database tables on cold start ──
try:
    from backend.core.database import engine, Base, sync_database_schema
    from backend.models import *  # noqa: F401, F403
    sync_database_schema(engine, Base)
    print("[INFO] Database schema synced successfully")
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

# ── Export app and handler for Vercel ──
try:
    from mangum import Mangum
except ImportError:
    Mangum = None

if _app is not None and _import_error is None:
    app = _app
    handler = Mangum(_app, lifespan="off") if Mangum else _app
else:
    error_detail = {
        "error": str(_import_error) if _import_error else "App import returned None",
        "traceback": _error_traceback or "No traceback",
        "sys_path": sys.path,
    }

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    error_app = FastAPI()

    @error_app.api_route(
        "/{path:path}",
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    )
    async def catch_all(path: str):
        return JSONResponse(status_code=500, content=error_detail)

    app = error_app
    handler = Mangum(error_app, lifespan="off") if Mangum else error_app
    print(f"[ERROR] Using error stub handler due to: {_import_error}")

