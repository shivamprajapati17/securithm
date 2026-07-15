from fastapi import APIRouter

from .scans import router as scans_router
from .findings import router as findings_router
from .monitoring import router as monitoring_router
from .risk_score import router as risk_score_router
from .auth import router as auth_router
from .nft import router as nft_router
from .token import router as token_router
from .payments import router as payments_router
from .api_keys import router as api_keys_router
from .team import router as team_router
from .public_findings import router as public_findings_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(scans_router)
v1_router.include_router(findings_router)
v1_router.include_router(public_findings_router)
v1_router.include_router(monitoring_router)
v1_router.include_router(risk_score_router)
v1_router.include_router(auth_router)
v1_router.include_router(nft_router)
v1_router.include_router(token_router)
v1_router.include_router(payments_router)
v1_router.include_router(api_keys_router)
v1_router.include_router(team_router)

__all__ = ["v1_router"]
