from fastapi import APIRouter

from .scans import router as scans_router
from .findings import router as findings_router
from .monitoring import router as monitoring_router
from .risk_score import router as risk_score_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(scans_router)
v1_router.include_router(findings_router)
v1_router.include_router(monitoring_router)
v1_router.include_router(risk_score_router)

__all__ = ["v1_router"]
