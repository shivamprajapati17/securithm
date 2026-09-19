"""Valuation Engine — converts token balances to USD.

Primary source: CoinGecko simple price API.
Fallback: reference prices configured in settings (labeled "REFERENCE" so the
price source is never silently ambiguous — blueprint section 12/13).
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from ...core.config import get_settings

# symbol -> CoinGecko id for the simple/price endpoint
COINGECKO_IDS: dict[str, str] = {
    "ETH": "ethereum",
    "WETH": "ethereum",
    "stETH": "staked-ether",
    "DAI": "dai",
    "USDC": "usd-coin",
    "USDT": "tether",
    "WBTC": "wrapped-bitcoin",
    "LINK": "chainlink",
    "AAVE": "aave",
    "UNI": "uniswap",
    "MKR": "maker",
    "LDO": "lido-dao",
    "FRAX": "frax",
    "BTC": "bitcoin",
    "SOL": "solana",
    "MATIC": "matic-network",
    "POL": "polygon-ecosystem-token",
}


class ValuationEngine:
    def __init__(self):
        self.settings = get_settings()
        self._cache: dict[
            str, tuple[float, float]
        ] = {}  # symbol -> (price, fetched_at)

    def _reference_price(self, symbol: str) -> Optional[float]:
        ref = self.settings.solvency_reference_prices
        if not ref:
            return None
        return ref.get(symbol.upper()) or ref.get(symbol)

    async def get_price(
        self, symbol: str
    ) -> tuple[Optional[float], str, Optional[datetime]]:
        """Fetch a USD price for a symbol.

        Returns (price, source, timestamp). source is "coingecko" when live,
        "reference" when a configured reference price is used, or None if neither.
        """
        symbol = symbol.upper()
        now = time.time()

        # Fresh cache hit
        if symbol in self._cache:
            price, fetched_at = self._cache[symbol]
            if now - fetched_at < 120:  # 2 min TTL
                return price, "coingecko", datetime.now(timezone.utc)

        # Live CoinGecko
        coin_id = COINGECKO_IDS.get(symbol)
        if coin_id:
            try:
                async with httpx.AsyncClient(timeout=6) as client:
                    resp = await client.get(
                        "https://api.coingecko.com/api/v3/simple/price",
                        params={"ids": coin_id, "vs_currencies": "usd"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        price = data.get(coin_id, {}).get("usd")
                        if price:
                            price = float(price)
                            self._cache[symbol] = (price, now)
                            return price, "coingecko", datetime.now(timezone.utc)
            except Exception:
                pass

        # Configured reference fallback
        ref = self._reference_price(symbol)
        if ref is not None:
            return float(ref), "reference", datetime.now(timezone.utc)

        return None, "unavailable", None
