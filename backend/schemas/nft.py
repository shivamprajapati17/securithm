from pydantic import BaseModel, Field
from typing import Optional


class NFTCollectionAnalysisRequest(BaseModel):
    contract_address: str = Field(..., description="NFT contract address to analyze")
    chain: str = Field(default="ethereum", description="Blockchain network")


class NFTSecurityFinding(BaseModel):
    category: str
    severity: str  # critical, high, medium, low, informational
    description: str
    recommendation: Optional[str] = None


class NFTCollectionAnalysisResponse(BaseModel):
    contract_address: str
    chain: str
    collection_name: Optional[str] = None
    total_supply: Optional[int] = None
    security_score: int  # 0-100
    risk_level: str  # low, medium, high, critical
    findings: list[NFTSecurityFinding] = []
    is_verified: bool = False
    has_royalty_enforcement: bool = False
    has_allowlist: bool = False
    has_mint_authority_risk: bool = False
    analyzed_at: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "contract_address": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                "chain": "ethereum",
                "collection_name": "BoredApeYachtClub",
                "total_supply": 10000,
                "security_score": 85,
                "risk_level": "low",
                "findings": [
                    {
                        "category": "Royalty Enforcement",
                        "severity": "medium",
                        "description": "Royalties are enforced off-chain via marketplace filter, not in contract",
                        "recommendation": "Consider using on-chain royalty enforcement (ERC-2981 with registry)",
                    }
                ],
                "is_verified": True,
                "has_royalty_enforcement": True,
                "has_allowlist": True,
                "has_mint_authority_risk": False,
                "analyzed_at": "2026-07-06T12:00:00Z",
            }
        }
    }


class NFTCollectionListResponse(BaseModel):
    items: list[NFTCollectionAnalysisResponse]
    total: int
    page: int
    page_size: int
