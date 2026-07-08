from pydantic import BaseModel, Field
from typing import Optional


class TokenAnalysisRequest(BaseModel):
    contract_address: str = Field(..., description="Token contract address to analyze")
    chain: str = Field(default="ethereum", description="Blockchain network")
    token_type: str = Field(
        default="erc20", description="Token standard: erc20, erc721, erc1155, spl"
    )


class TokenRiskFinding(BaseModel):
    category: str
    severity: str
    description: str
    recommendation: Optional[str] = None


class TokenAnalysisResponse(BaseModel):
    contract_address: str
    chain: str
    token_name: Optional[str] = None
    token_symbol: Optional[str] = None
    token_type: str
    total_supply: Optional[str] = None
    holder_count: Optional[int] = None
    security_score: int
    risk_level: str
    findings: list[TokenRiskFinding] = []
    is_renounced: Optional[bool] = None
    has_honeypot_risk: bool = False
    has_blacklist: bool = False
    has_tax: bool = False
    has_mint_function: bool = False
    analyzed_at: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "contract_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                "chain": "ethereum",
                "token_name": "USD Coin",
                "token_symbol": "USDC",
                "token_type": "erc20",
                "total_supply": "25000000000",
                "holder_count": 450000,
                "security_score": 95,
                "risk_level": "low",
                "findings": [
                    {
                        "category": "Ownership",
                        "severity": "informational",
                        "description": "Contract has an owner role that can blacklist addresses",
                        "recommendation": "Verify owner is a multisig or timelock contract",
                    }
                ],
                "is_renounced": False,
                "has_honeypot_risk": False,
                "has_blacklist": True,
                "has_tax": False,
                "has_mint_function": True,
                "analyzed_at": "2026-07-06T12:00:00Z",
            }
        }
    }


class TokenListResponse(BaseModel):
    items: list[TokenAnalysisResponse]
    total: int
    page: int
    page_size: int
