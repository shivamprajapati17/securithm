from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Securithm"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/securithm"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    secret_key: str = "change-me-in-production-securithm-secret-key-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
        "https://securithm.dev",
        "https://securithm.vercel.app",
    ]

    # External APIs
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    oauth_redirect_url: str = "http://localhost:8000/api/v1/auth/callback"

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Email (Resend)
    resend_api_key: str = ""
    resend_from_email: str = "Securithm <onboarding@resend.dev>"
    demo_notify_email: str = ""

    # Sentry
    sentry_dsn: str = ""

    # Solvency (Proof of Reserves & Solvency)
    solvency_eth_rpc_urls: list[str] = [
        "https://ethereum-rpc.publicnode.com",
        "https://1rpc.io/eth",
    ]
    # Reference price fallbacks used when CoinGecko is unreachable.
    # Keys are asset symbols, values are USD prices.
    solvency_reference_prices: dict[str, float] = {
        "ETH": 1850.00,
        "WETH": 1850.00,
        "USDC": 1.00,
        "USDT": 1.00,
        "DAI": 1.00,
        "WBTC": 63000.00,
    }
    # Secret used to sign attestation payloads (HMAC-SHA256).
    solvency_signing_secret: str = (
        "change-me-in-production-securithm-solvency-signing-key"
    )
    # On-chain attestation publishing (blueprint section 16). Optional — the
    # publish endpoint returns 400 until these are configured.
    solvency_chain_rpc_url: str = ""
    solvency_chain_signer_key: str = ""
    solvency_chain_contract_address: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "allow"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
