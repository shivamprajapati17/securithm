"""Ethereum on-chain attestation publishing (blueprint section 16).

Publishes attestation hash commitments to the ``SecurithmAttestation`` contract
so third parties can independently verify that an attestation existed at a
point in time on-chain. Uses raw JSON-RPC with ``eth-account`` for signing —
no web3 dependency. Stores commitments and metadata only, never customer data.
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any, Optional

import httpx

from ...core.config import get_settings
from ...models.solvency import Attestation

# eth_account/eth_utils are heavy — import lazily inside the functions that
# sign/publish so the package is only required for on-chain publishing.

settings = get_settings()

# publishAttestation(bytes32,bytes32,bytes32,uint256,uint256,uint256)
_PUBLISH_SIG = "publishAttestation(bytes32,bytes32,bytes32,uint256,uint256,uint256)"
# getAttestation(bytes32)
_GET_SIG = "getAttestation(bytes32)"


def _keccak(text: str):
    from eth_utils import keccak

    return keccak(text=text)


def _selectors() -> tuple[str, str]:
    return (
        _keccak(_PUBLISH_SIG)[:4].hex(),
        _keccak(_GET_SIG)[:4].hex(),
    )


_FALLBACK_GAS = 300_000

# chain id -> public explorer base URL (used for tx deep links)
_EXPLORERS = {
    "ethereum": "https://etherscan.io/tx/",
    "sepolia": "https://sepolia.etherscan.io/tx/",
    "base": "https://basescan.org/tx/",
    "base-sepolia": "https://sepolia.basescan.org/tx/",
    "polygon": "https://polygonscan.com/tx/",
    "arbitrum": "https://arbiscan.io/tx/",
}


class OnChainError(Exception):
    """Raised when an on-chain operation fails."""


def tx_explorer_url(chain: str, tx_hash: str) -> str:
    base = _EXPLORERS.get((chain or "ethereum").lower(), _EXPLORERS["ethereum"])
    return f"{base}{tx_hash}"


def attestation_id_to_bytes32(attestation_id: str) -> str:
    """Derive a stable bytes32 id from the attestation id string."""
    return "0x" + _keccak(attestation_id).hex()


def _to_bytes32(value: str) -> str:
    """Left-pad a hex value to 32 bytes (64 hex chars)."""
    raw = (value or "").lower().removeprefix("0x")
    if not raw:
        raise OnChainError("Cannot encode empty value as bytes32")
    if len(raw) > 64:
        raise OnChainError("Value too long for bytes32 encoding")
    return raw.rjust(64, "0")


def _to_uint256(value: str) -> str:
    """Encode a decimal string as uint256 (64 hex chars, left-padded)."""
    try:
        amount = int(value)
    except ValueError as exc:
        raise OnChainError(f"Invalid integer for uint256: {value!r}") from exc
    if amount < 0:
        raise OnChainError("Negative value cannot be encoded as uint256")
    return f"{amount:064x}"


def cents_to_usd(cents: int) -> str:
    """Convert a cents integer back to a USD string."""
    return str((Decimal(cents) / 100).quantize(Decimal("0.01")))


def encode_publish_calldata(
    attestation_id: str,
    reserve_root: str,
    liability_root: str,
    reserve_value_usd: str,
    liability_value_usd: str,
    timestamp: int,
) -> str:
    """ABI-encode ``publishAttestation(bytes32×3, uint256×3)``.

    USD values are stored in cents (integer) to avoid floating-point ambiguity.
    """
    args = (
        _to_bytes32(attestation_id_to_bytes32(attestation_id)),
        _to_bytes32(reserve_root),
        _to_bytes32(liability_root),
        _to_uint256(str(int(Decimal(str(reserve_value_usd)) * 100))),
        _to_uint256(str(int(Decimal(str(liability_value_usd)) * 100))),
        _to_uint256(str(timestamp)),
    )
    publish_selector, _ = _selectors()
    return "0x" + publish_selector + "".join(args)


def encode_get_calldata(attestation_id: str) -> str:
    """ABI-encode ``getAttestation(bytes32)``."""
    _, get_selector = _selectors()
    return "0x" + get_selector + _to_bytes32(attestation_id_to_bytes32(attestation_id))


def _decode_uint256(word: str) -> int:
    return int(word, 16)


async def _rpc_call(rpc_url: str, method: str, params: list) -> Any:
    """Perform a JSON-RPC request against the given node."""
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                rpc_url,
                json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            )
            resp.raise_for_status()
            body = resp.json()
    except httpx.HTTPError as exc:
        raise OnChainError(f"RPC transport error for {method}: {exc}") from exc
    if "error" in body:
        raise OnChainError(f"RPC {method} failed: {body['error']}")
    return body.get("result")


async def publish_attestation(
    attestation: Attestation,
    *,
    rpc_url: str,
    contract_address: str,
    signer_key: str,
    chain_id: Optional[int] = None,
) -> str:
    """Publish the attestation commitment on-chain; returns the tx hash."""
    from eth_account import Account

    payload = attestation.payload or {}
    account = Account.from_key(signer_key)

    nonce = int(
        await _rpc_call(
            rpc_url, "eth_getTransactionCount", [account.address, "pending"]
        ),
        16,
    )
    gas_price = int(await _rpc_call(rpc_url, "eth_gasPrice", []), 16)
    if chain_id is None:
        chain_id = int(await _rpc_call(rpc_url, "eth_chainId", []), 16)

    data = encode_publish_calldata(
        attestation_id=payload.get("attestationId") or f"att_{attestation.id}",
        reserve_root=payload.get("reserveRoot") or attestation.reserve_root or "",
        liability_root=payload.get("liabilityRoot") or attestation.liability_root or "",
        reserve_value_usd=payload.get("reserveValueUsd") or attestation.reserve_value,
        liability_value_usd=payload.get("liabilityValueUsd")
        or attestation.liability_value,
        timestamp=int(time.time()),
    )

    tx: dict[str, Any] = {
        "nonce": nonce,
        "gasPrice": gas_price,
        "gas": _FALLBACK_GAS,
        "to": contract_address,
        "value": 0,
        "data": data,
        "chainId": chain_id,
    }
    try:
        estimated = await _rpc_call(
            rpc_url,
            "eth_estimateGas",
            [{"from": account.address, "to": contract_address, "data": data}],
        )
        tx["gas"] = int(estimated, 16)
    except OnChainError:
        pass  # fall back to the fixed gas limit

    signed = account.sign_transaction(tx)
    return await _rpc_call(
        rpc_url, "eth_sendRawTransaction", [signed.raw_transaction.hex()]
    )


async def fetch_onchain_attestation(
    rpc_url: str,
    contract_address: str,
    attestation_id: str,
) -> dict[str, Any]:
    """Fetch the stored commitment via ``getAttestation(bytes32)`` (eth_call).

    Returns the on-chain values plus an ``exists`` flag (timestamp > 0).
    """
    data = encode_get_calldata(attestation_id)
    result = await _rpc_call(
        rpc_url,
        "eth_call",
        [{"to": contract_address, "data": data}, "latest"],
    )
    raw = (result or "").removeprefix("0x")
    words = [raw[i : i + 64] for i in range(0, len(raw), 64)]
    if len(words) < 5:
        raise OnChainError("Unexpected eth_call result length for getAttestation")

    timestamp = _decode_uint256(words[4])
    return {
        "reserveRoot": "0x" + words[0],
        "liabilityRoot": "0x" + words[1],
        "reserveValueCents": _decode_uint256(words[2]),
        "liabilityValueCents": _decode_uint256(words[3]),
        "timestamp": timestamp,
        "exists": timestamp > 0,
    }
