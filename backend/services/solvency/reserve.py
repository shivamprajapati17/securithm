"""Reserve Engine — on-chain balance fetching and wallet ownership verification.

Phase 1 supports Ethereum: native ETH + ERC-20 tokens (blueprint section 7).
Balances are fetched via public JSON-RPC (eth_getBalance / eth_call balanceOf).
Wallet ownership uses EIP-191 personal_sign style signatures verified with
eth_account (Method A in blueprint section 8).
"""

from __future__ import annotations

import secrets
import time
from decimal import Decimal
from typing import Optional

import httpx

from ...core.config import get_settings

# ERC-20 balanceOf(address) selector
_BALANCE_OF_SELECTOR = "0x70a08231"

# Well-known token address -> (symbol, decimals) on Ethereum mainnet.
# Used to label assets discovered by address. Custom addresses can pass their own.
KNOWN_ETHEREUM_TOKENS: dict[str, tuple[str, int]] = {
    "0x6b175474e89094c44da98b954eedeac495271d0f": ("DAI", 18),
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": ("USDC", 6),
    "0xdac17f958d2ee523a2206206994597c13d831ec7": ("USDT", 6),
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": ("WBTC", 8),
    "0x514910771af9ca656af840dff83e8264ecf986ca": ("LINK", 18),
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": ("AAVE", 18),
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": ("UNI", 18),
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": ("WETH", 18),
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": ("stETH", 18),
    "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": ("MKR", 18),
    "0x5a98fcbea516cf06857215779fd812ca3bef1b32": ("LDO", 18),
    "0x853d955acef822db058eb8505911ed77f175b99e": ("FRAX", 18),
}


class ReserveEngine:
    """Fetches reserve balances and verifies wallet ownership."""

    def __init__(self):
        self.settings = get_settings()
        self._rpc_urls = self.settings.solvency_eth_rpc_urls or [
            "https://ethereum-rpc.publicnode.com",
            "https://1rpc.io/eth",
        ]

    # ─── Low-level JSON-RPC ─────────────────────────────────

    async def _rpc_call(
        self, method: str, params: list, rpc_url: Optional[str] = None
    ) -> Optional[dict]:
        """Call a JSON-RPC method, trying multiple public endpoints."""
        urls = [rpc_url] if rpc_url else self._rpc_urls
        last_error: Optional[str] = None
        async with httpx.AsyncClient(timeout=8) as client:
            for url in urls:
                try:
                    resp = await client.post(
                        url,
                        json={
                            "jsonrpc": "2.0",
                            "method": method,
                            "params": params,
                            "id": int(time.time() * 1000) % 1000000,
                        },
                    )
                    if resp.status_code != 200:
                        last_error = f"HTTP {resp.status_code}"
                        continue
                    data = resp.json()
                    if "error" in data:
                        last_error = str(data["error"])
                        continue
                    return data
                except Exception as e:  # network/timeout
                    last_error = str(e)
                    continue
        raise RuntimeError(f"RPC failed: {last_error or 'no endpoints reachable'}")

    async def get_block_number(self) -> Optional[int]:
        """Current block height of the Ethereum chain."""
        try:
            data = await self._rpc_call("eth_blockNumber", ["latest"])
            return int(data.get("result", "0x0"), 16)
        except Exception:
            return None

    async def get_native_balance(self, address: str) -> Decimal:
        """Native ETH balance (in ETH units) for an address."""
        data = await self._rpc_call("eth_getBalance", [address, "latest"])
        wei = int(data.get("result", "0x0"), 16)  # type: ignore[union-attr]
        return Decimal(wei) / Decimal(10**18)

    async def get_token_balance(
        self, token_address: str, address: str, decimals: int = 18
    ) -> Decimal:
        """ERC-20 balance for a token at an address."""
        # balanceOf(address) with 32-byte left-padded address
        padded = address.lower().replace("0x", "").zfill(64)
        data_hex = _BALANCE_OF_SELECTOR + padded
        data = await self._rpc_call(
            "eth_call", [{"to": token_address, "data": data_hex}, "latest"]
        )
        raw = data.get("result", "0x0")  # type: ignore[union-attr]
        return Decimal(int(raw, 16)) / Decimal(10**decimals)

    async def fetch_asset_balance(
        self,
        wallet_address: str,
        asset_address: Optional[str] = None,
        symbol: Optional[str] = None,
        decimals: int = 18,
    ) -> tuple[Decimal, Optional[int]]:
        """Fetch a wallet balance for a native asset or ERC-20 token.

        Returns (balance, block_height).
        """
        block_height = await self.get_block_number()
        if not asset_address:
            balance = await self.get_native_balance(wallet_address)
        else:
            balance = await self.get_token_balance(
                asset_address, wallet_address, decimals
            )
        return balance, block_height

    # ─── Wallet ownership (Method A — message signature) ────

    def create_challenge(self, wallet_address: str) -> dict:
        """Generate a signed-message challenge for wallet ownership verification."""
        nonce = secrets.token_hex(16)
        expires = int(time.time()) + 60 * 15  # 15 minutes
        message = (
            "Securithm Proof of Reserves\n"
            "Sign this message to prove control of the reserve wallet:\n"
            f"{wallet_address}\n"
            f"Challenge: {nonce}\n"
            f"Expires: {expires}"
        )
        return {
            "message": message,
            "nonce": nonce,
            "expires_at": expires,
            "chain": "ethereum",
        }

    def verify_signature(
        self, wallet_address: str, message: str, signature: str
    ) -> bool:
        """Verify an EIP-191 personal_sign signature against the wallet address."""
        try:
            from eth_account import Account
            from eth_account.messages import encode_defunct

            message_hash = encode_defunct(text=message)
            recovered = Account.recover_message(message_hash, signature=signature)
            return recovered.lower() == wallet_address.lower()
        except Exception:
            return False


def format_balance(balance: Decimal) -> str:
    """Format a Decimal balance to a plain decimal string without exponent."""
    if balance == balance.to_integral_value():
        return f"{balance:.0f}"
    return f"{balance:.18f}".rstrip("0").rstrip(".")
