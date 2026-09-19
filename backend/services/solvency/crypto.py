"""Cryptographic primitives for the Securithm Solvency module.

Implements:
- Keccak-256 hashing (Ethereum-compatible, via pycryptodome with a hashlib.sha3_256 fallback)
- Merkle Sum Tree (blueprint section 9): each leaf commits to a user's balance,
  each parent commits to the sum of its children's amounts. The root commits to
  the total liability.

Leaf layout:      commitment = H(user_ref || balance || nonce), amount = balance
Internal node:    amount = left.amount + right.amount
                  hash   = H(left.hash || right.hash || amount)
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional

try:  # pragma: no cover - environment dependent
    from Crypto.Hash import keccak as _pycryptodome_keccak

    def _keccak_256(data: bytes) -> bytes:
        h = _pycryptodome_keccak.new(digest_bits=256)
        h.update(data)
        return h.digest()

    HASH_NAME = "keccak-256"
except ImportError:  # pragma: no cover - fallback when pycryptodome is absent

    def _keccak_256(data: bytes) -> bytes:
        # NOTE: hashlib.sha3_256 is NIST SHA3, NOT Ethereum keccak. Used only as
        # a fallback so the module still runs without pycryptodome.
        return hashlib.sha3_256(data).digest()

    HASH_NAME = "sha3-256-fallback"


def keccak_256(data: bytes) -> bytes:
    return _keccak_256(data)


def hash_hex(data: bytes) -> str:
    return "0x" + _keccak_256(data).hex()


def _leaf_hash(commitment: str, amount: int) -> str:
    payload = f"{commitment}|{amount}".encode()
    return "0x" + _keccak_256(payload).hex()


def _node_hash(left_hash: str, right_hash: str, amount: int) -> str:
    payload = f"{left_hash}|{right_hash}|{amount}".encode()
    return "0x" + _keccak_256(payload).hex()


def leaf_commitment(user_ref: str, balance: str, nonce: str) -> str:
    """Commitment for a single liability leaf: H(user_ref || balance || nonce)."""
    return hash_hex(f"{user_ref}|{balance}|{nonce}".encode())


@dataclass
class MerkleSumTree:
    """Binary Merkle Sum Tree with power-of-two padding.

    Amounts are stored as integers (smallest unit). For USD liabilities we use
    cents (scale=2) so the tree is exact.
    """

    leaves: list[tuple[str, int]] = field(default_factory=list)  # (commitment, amount)
    levels: list[list[tuple[str, int]]] = field(default_factory=list)
    _scale: int = 2

    @property
    def root(self) -> Optional[str]:
        return self.levels[-1][0][0] if self.levels else None

    @property
    def total_amount(self) -> int:
        return self.levels[-1][0][1] if self.levels else 0

    @property
    def leaf_count(self) -> int:
        return len(self.leaves)

    @staticmethod
    def _pad_to_power_of_two(n: int) -> int:
        size = 1
        while size < n:
            size *= 2
        return size

    def build(self) -> "MerkleSumTree":
        """Build the tree from the current leaves. Must call before proof()/root."""
        if not self.leaves:
            # Empty tree -> single zero leaf so the root is well-defined
            self.leaves = [(leaf_commitment("EMPTY", "0", "0"), 0)]

        size = self._pad_to_power_of_two(len(self.leaves))
        # Pad with zero-amount leaves
        padded: list[tuple[str, int]] = list(self.leaves)
        while len(padded) < size:
            padded.append((leaf_commitment(f"PAD{len(padded)}", "0", "0"), 0))

        level: list[tuple[str, int]] = [
            (_leaf_hash(comm, amt), amt) for comm, amt in padded
        ]
        self.levels = [level]

        while len(level) > 1:
            nxt: list[tuple[str, int]] = []
            for i in range(0, len(level), 2):
                lh, la = level[i]
                rh, ra = level[i + 1]
                nxt.append((_node_hash(lh, rh, la + ra), la + ra))
            self.levels.append(nxt)
            level = nxt

        return self

    def proof(self, leaf_index: int) -> list[str]:
        """Return the merkle proof (sibling hashes bottom-up) for a leaf.

        Because this is a *sum* tree, each sibling is encoded as
        ``hash|amount`` so the verifier can recompute the internal node
        commitments exactly (blueprint section 9).
        """
        if not self.levels:
            raise ValueError("Tree not built")
        if leaf_index < 0 or leaf_index >= self.leaf_count:
            raise ValueError("leaf_index out of range")

        proof: list[str] = []
        idx = leaf_index
        for level in self.levels[:-1]:
            sibling = idx ^ 1
            if sibling < len(level):
                sh, sa = level[sibling]
                proof.append(f"{sh}|{sa}")
            idx //= 2
        return proof

    def format_total(self) -> str:
        """Total amount as a decimal string in the tree's scale (cents -> dollars)."""
        return (
            (Decimal(self.total_amount) / Decimal(10**self._scale))
            .quantize(Decimal("0.01"))
            .to_eng_string()
        )


def build_liability_tree(entries: list[tuple[str, str, str]]) -> MerkleSumTree:
    """Build a Merkle Sum Tree from (user_ref, balance_usd, nonce) entries.

    Balances are USD amounts with 2-decimal precision, stored as integer cents.
    Returns the built tree.
    """
    tree = MerkleSumTree(_scale=2)
    for user_ref, balance, nonce in entries:
        amount = int(Decimal(balance) * 100)
        if amount < 0:
            raise ValueError("Negative liability balances are not allowed")
        tree.leaves.append((leaf_commitment(user_ref, balance, nonce), amount))
    return tree.build()


def verify_liability_proof(
    root: str,
    leaf_index: int,
    commitment: str,
    amount: int,
    proof: list[str],
) -> bool:
    """Verify a Merkle Sum Tree proof against a published root.

    `amount` is the leaf amount in cents. Each proof element is ``hash|amount``
    for the sibling node (sum tree needs sibling amounts). Returns True if the
    recomputed root matches the published root and the totals add up.
    """
    if not root or not commitment or amount < 0:
        return False

    cur_hash = _leaf_hash(commitment, amount)
    cur_amount = amount
    idx = leaf_index
    for item in proof:
        parts = item.rsplit("|", 1)
        if len(parts) != 2:
            return False
        sibling_hash, sibling_amount = parts[0], int(parts[1])
        combined = cur_amount + sibling_amount
        if idx % 2 == 0:
            # current is left, sibling is right
            cur_hash = _node_hash(cur_hash, sibling_hash, combined)
        else:
            # current is right, sibling is left
            cur_hash = _node_hash(sibling_hash, cur_hash, combined)
        cur_amount = combined
        idx //= 2
    return cur_hash.lower() == root.lower()
