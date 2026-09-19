"""Deploy the SecurithmAttestation contract to an EVM network (blueprint section 16).

Usage:
    export RPC_URL="https://eth-sepolia.public.blastapi.io"   # or use SOLVENCY_CHAIN_RPC_URL
    export PRIVATE_KEY="0x..."                                # or use SOLVENCY_CHAIN_SIGNER_KEY
    export CHAIN_ID=11155111                                  # optional; auto-detected via eth_chainId
    python scripts/deploy_attestation_contract.py

The contract is compiled with py-solc-x (installed on demand if missing) and
deployed via raw JSON-RPC using eth-account. The ABI + bytecode artifact is
written to contracts/artifacts/SecurithmAttestation.json, which the backend
on-chain service reads (falling back to its embedded ABI for encoding).
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from eth_account import Account
from eth_utils import keccak
from rlp import encode as rlp_encode

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_PROJECT_ROOT / ".env")

CONTRACT_PATH = _PROJECT_ROOT / "contracts" / "SecurithmAttestation.sol"
ARTIFACT_PATH = _PROJECT_ROOT / "contracts" / "artifacts" / "SecurithmAttestation.json"
SOLC_VERSION = "0.8.24"

_RPC_JSON: dict = {"jsonrpc": "2.0", "id": 1}


def _rpc_call(rpc_url: str, method: str, params: list):
    payload = {**_RPC_JSON, "method": method, "params": params}
    resp = httpx.post(rpc_url, json=payload, timeout=30)
    resp.raise_for_status()
    body = resp.json()
    if "error" in body:
        raise RuntimeError(f"RPC {method} failed: {body['error']}")
    return body.get("result")


def compile_contract() -> tuple[list, str]:
    """Compile the contract; returns (abi, bytecode). Installs solc on demand."""
    source = CONTRACT_PATH.read_text(encoding="utf-8")

    try:
        import solcx
    except ImportError:
        sys.exit(
            "py-solc-x is required to compile the contract. Install it with:\n"
            "    python -m pip install py-solc-x\n"
            "or pre-compile and place the artifact at "
            "contracts/artifacts/SecurithmAttestation.json."
        )

    if not solcx.get_installed_solc_versions():
        print(f"[deploy] Installing solc {SOLC_VERSION} (one-time download)...")
        solcx.install_solc(SOLC_VERSION)
    solcx.set_solc_version(SOLC_VERSION)

    compiled = solcx.compile_source(source, output_values=["abi", "bin"])
    contract = compiled["<stdin>:SecurithmAttestation"]
    return contract["abi"], contract["bin"]


def compute_contract_address(deployer: str, nonce: int) -> str:
    """EIP-161 contract address = keccak256(rlp([sender, nonce]))[12:]."""
    encoded = rlp_encode([bytes.fromhex(deployer[2:]), nonce])
    return "0x" + keccak(encoded)[12:].hex()


def main() -> None:
    rpc_url = os.environ.get("RPC_URL") or os.environ.get("SOLVENCY_CHAIN_RPC_URL", "")
    private_key = os.environ.get("PRIVATE_KEY") or os.environ.get(
        "SOLVENCY_CHAIN_SIGNER_KEY", ""
    )
    if not rpc_url:
        sys.exit("RPC_URL is required (or set SOLVENCY_CHAIN_RPC_URL in .env)")
    if not private_key or len(private_key) != 66:
        sys.exit("PRIVATE_KEY (0x + 64 hex chars) is required")

    account = Account.from_key(private_key)
    print(f"[deploy] Deployer: {account.address}")

    abi, bytecode = compile_contract()
    nonce = int(_rpc_call(rpc_url, "eth_getTransactionCount", [account.address, "pending"]), 16)
    gas_price = int(_rpc_call(rpc_url, "eth_gasPrice", []), 16)
    chain_id = int(
        os.environ.get("CHAIN_ID") or _rpc_call(rpc_url, "eth_chainId", []), 16
    )

    tx = {
        "nonce": nonce,
        "gasPrice": gas_price,
        "gas": 4_000_000,
        "to": "",
        "value": 0,
        "data": "0x" + bytecode,
        "chainId": chain_id,
    }
    try:
        tx["gas"] = int(
            _rpc_call(
                rpc_url,
                "eth_estimateGas",
                [{"from": account.address, "data": tx["data"]}],
            ),
            16,
        )
    except RuntimeError:
        pass  # fall back to the fixed gas limit

    signed = account.sign_transaction(tx)
    tx_hash = _rpc_call(rpc_url, "eth_sendRawTransaction", [signed.raw_transaction.hex()])
    contract_address = compute_contract_address(account.address, nonce)
    print(f"[deploy] Transaction sent: {tx_hash}")
    print(f"[deploy] Contract address: {contract_address}")

    # Wait for confirmation (poll up to ~90s)
    for _ in range(30):
        time.sleep(3)
        receipt = _rpc_call(rpc_url, "eth_getTransactionReceipt", [tx_hash])
        if receipt:
            print(f"[deploy] Confirmed in block {int(receipt['blockNumber'], 16)}")
            break

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "contractName": "SecurithmAttestation",
        "solcVersion": SOLC_VERSION,
        "chainId": chain_id,
        "address": contract_address,
        "deployer": account.address,
        "txHash": tx_hash,
        "abi": abi,
        "bytecode": "0x" + bytecode,
    }
    ARTIFACT_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    print(f"[deploy] Artifact written to {ARTIFACT_PATH.relative_to(_PROJECT_ROOT)}")
    print(
        "\nNext: set these in the Vercel env so the API can publish attestations:\n"
        f"  SOLVENCY_CHAIN_RPC_URL={rpc_url}\n"
        f"  SOLVENCY_CHAIN_CONTRACT_ADDRESS={contract_address}\n"
        "  SOLVENCY_CHAIN_SIGNER_KEY=<deployer private key>"
    )


if __name__ == "__main__":
    main()
