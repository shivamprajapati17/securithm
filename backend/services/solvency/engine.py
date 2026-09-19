"""Solvency Engine — orchestrates the full proof-of-solvency pipeline.

Pipeline (blueprint section 4 / 33):
  1. Reserve Engine fetches on-chain balances
  2. Valuation Engine converts to USD
  3. Liability Engine builds a Merkle Sum Tree commitment
  4. Solvency ratio computed from verified reserve/liability values
  5. Attestation is signed and stored
  6. Monitoring alerts generated against thresholds
"""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Optional

from sqlalchemy.orm import Session

from ...core.config import get_settings
from ...models.solvency import (
    Attestation,
    AttestationStatus,
    LiabilityEntry,
    LiabilitySnapshot,
    ReserveAsset,
    ReserveSnapshot,
    ReserveWallet,
    SnapshotStatus,
    SolvencyAlert,
    SolvencyOrg,
    SolvencyStatus,
    VerificationStatus,
)
from .crypto import build_liability_tree, leaf_commitment
from .reserve import ReserveEngine, format_balance
from .valuation import ValuationEngine

settings = get_settings()


def _to_decimal(value) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return Decimal("0")


class SolvencyEngine:
    """Runs the reserve/liability/solvency pipeline for an organization."""

    def __init__(self, db: Session):
        self.db = db
        self.reserve_engine = ReserveEngine()
        self.valuation = ValuationEngine()

    # ─── Reserve snapshot ───────────────────────────────────

    async def create_reserve_snapshot(self, org: SolvencyOrg) -> ReserveSnapshot:
        """Fetch all active wallet balances and store a reserve snapshot."""
        wallets = (
            self.db.query(ReserveWallet)
            .filter(
                ReserveWallet.org_id == org.org_id,
                ReserveWallet.is_active.is_(True),
            )
            .all()
        )

        snapshot = ReserveSnapshot(
            org_id=org.org_id,
            methodology_version=org.methodology_version,
            status=SnapshotStatus.PENDING,
        )
        self.db.add(snapshot)
        self.db.flush()

        # Only query the chain when at least one wallet needs a live fetch.
        # Wallets with declared (simulated) balances never touch the network,
        # which keeps demo/test runs deterministic and fast.
        all_declared = all(
            (wallet.verification_evidence or {}).get("declared_assets")
            for wallet in wallets
        )
        block_height = None
        if not all_declared:
            block_height = await self.reserve_engine.get_block_number()
        total = Decimal("0")

        for wallet in wallets:
            evidence = wallet.verification_evidence or {}
            declared_assets = evidence.get("declared_assets") or []

            # Wallets registered with declared (simulated) balances use those
            # values directly — deterministic and demo-friendly. Wallets without
            # declared assets are fetched live from the chain. Evidence labels
            # always reflect how the balance was obtained.
            assets_to_fetch = declared_assets or [
                {"asset_address": None, "symbol": "ETH", "decimals": 18}
            ]

            for asset_cfg in assets_to_fetch:
                asset_address = asset_cfg.get("asset_address")
                symbol = (asset_cfg.get("symbol") or "ETH").upper()
                decimals = int(asset_cfg.get("decimals", 18))
                declared = asset_cfg.get("balance")

                if declared_assets and declared is not None:
                    # Declared balance path (demo/simulated) — no network
                    balance = _to_decimal(declared)
                    height = None
                else:
                    try:
                        balance, height = await self.reserve_engine.fetch_asset_balance(
                            wallet.address,
                            asset_address=asset_address,
                            symbol=symbol,
                            decimals=decimals,
                        )
                    except Exception:
                        if declared is None:
                            continue
                        balance = _to_decimal(declared)
                        height = None

                price, source, price_ts = await self.valuation.get_price(symbol)
                if price is None:
                    continue
                value = (balance * _to_decimal(price)).quantize(Decimal("0.01"))

                total += value
                # Evidence label reflects the *balance source* (blueprint 5.1):
                # live on-chain balances carry the wallet's ownership evidence;
                # declared/simulated balances are never DIRECTLY_VERIFIED — the
                # wallet ownership and the balance provenance are distinct claims.
                if declared_assets:
                    evidence_status = (
                        VerificationStatus.ATTESTED
                        if wallet.verification_status == VerificationStatus.ATTESTED
                        else VerificationStatus.UNVERIFIED
                    )
                else:
                    evidence_status = wallet.verification_status

                self.db.add(
                    ReserveAsset(
                        snapshot_id=snapshot.id,
                        chain=wallet.chain,
                        wallet_address=wallet.address,
                        asset_address=asset_address,
                        symbol=symbol,
                        balance=format_balance(balance),
                        price=str(price),
                        price_source=source,
                        price_timestamp=price_ts,
                        value_usd=str(value),
                        block_height=str(height) if height else None,
                        evidence_status=evidence_status,
                    )
                )

        snapshot.block_height = str(block_height) if block_height else None
        snapshot.total_value_usd = str(total.quantize(Decimal("0.01")))
        snapshot.reserve_root = self._commit_reserve_root(snapshot)
        snapshot.status = SnapshotStatus.COMPLETED
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def _commit_reserve_root(self, snapshot: ReserveSnapshot) -> str:
        """Deterministic commitment over the snapshot's assets."""
        assets = (
            self.db.query(ReserveAsset)
            .filter(ReserveAsset.snapshot_id == snapshot.id)
            .order_by(ReserveAsset.wallet_address, ReserveAsset.symbol)
            .all()
        )
        h = hashlib.sha3_256()
        for a in assets:
            h.update(f"{a.chain}|{a.wallet_address}|{a.symbol}|{a.balance}".encode())
        return "0x" + h.hexdigest()

    # ─── Liability snapshot ─────────────────────────────────

    def create_liability_snapshot(
        self,
        org: SolvencyOrg,
        entries: list[tuple[str, str]],
    ) -> LiabilitySnapshot:
        """Build a Merkle Sum Tree over (user_ref, balance_usd) entries.

        Raises ValueError on empty input, duplicate user refs, or invalid
        (non-numeric / negative) balances.
        """
        if not entries:
            raise ValueError("Liability dataset cannot be empty")

        seen: set[str] = set()
        validated: list[tuple[str, str]] = []
        for ref, bal in entries:
            ref = ref.strip()
            bal = bal.strip()
            if not ref:
                raise ValueError("user_ref cannot be empty")
            if ref in seen:
                raise ValueError(f"Duplicate user entry: {ref}")
            seen.add(ref)
            try:
                amount = Decimal(bal)
            except (InvalidOperation, ValueError):
                raise ValueError(f"Invalid balance for {ref}: '{bal}'")
            if amount < 0:
                raise ValueError(f"Negative liability balance for {ref}")
            validated.append((ref, bal))

        nonced = [(ref, bal, secrets.token_hex(16)) for ref, bal in validated]
        tree = build_liability_tree(nonced)

        snapshot = LiabilitySnapshot(
            org_id=org.org_id,
            liability_root=tree.root or "",
            total_liabilities=tree.format_total(),
            tree_type="merkle_sum_tree",
            methodology_version=org.methodology_version,
            user_count=str(len(entries)),
        )
        self.db.add(snapshot)
        self.db.flush()

        for idx, (ref, bal, nonce) in enumerate(nonced):
            self.db.add(
                LiabilityEntry(
                    snapshot_id=snapshot.id,
                    leaf_index=str(idx),
                    user_ref=ref,
                    balance=bal,
                    nonce=nonce,
                    commitment=leaf_commitment(ref, bal, nonce),
                )
            )

        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_user_proof(
        self, snapshot: LiabilitySnapshot, user_ref: str
    ) -> Optional[dict]:
        """Return the full verification payload for a user (blueprint section 10)."""
        leaf = (
            self.db.query(LiabilityEntry)
            .filter(
                LiabilityEntry.snapshot_id == snapshot.id,
                LiabilityEntry.user_ref == user_ref,
            )
            .first()
        )
        if not leaf:
            return None

        # Rebuild the tree to derive the proof path for this leaf index
        entries = [
            (e.user_ref, e.balance, e.nonce)
            for e in self.db.query(LiabilityEntry)
            .filter(LiabilityEntry.snapshot_id == snapshot.id)
            .order_by(LiabilityEntry.leaf_index)
            .all()
        ]
        tree = build_liability_tree(entries)
        proof = tree.proof(int(leaf.leaf_index))

        return {
            "snapshotId": str(snapshot.id),
            "leafIndex": int(leaf.leaf_index),
            "balance": leaf.balance,
            "nonce": leaf.nonce,
            "commitment": leaf.commitment,
            "merkleProof": proof,
            "liabilityRoot": snapshot.liability_root,
        }

    # ─── Solvency calculation ───────────────────────────────

    def compute_solvency(
        self, org: SolvencyOrg, reserve_value: Decimal, liability_value: Decimal
    ) -> dict:
        """Compute coverage ratio + status (blueprint section 14)."""
        if liability_value <= 0:
            ratio = Decimal("0")
            status = SolvencyStatus.UNDER_COLLATERALIZED
        else:
            ratio = reserve_value / liability_value
            status = (
                SolvencyStatus.SOLVENT
                if ratio >= _to_decimal(org.required_coverage)
                else SolvencyStatus.UNDER_COLLATERALIZED
            )

        return {
            "reserve_value_usd": reserve_value.quantize(Decimal("0.01")),
            "liability_value_usd": liability_value.quantize(Decimal("0.01")),
            "coverage_ratio": ratio.quantize(Decimal("0.0001")),
            "coverage_percent": (ratio * 100).quantize(Decimal("0.01")),
            "status": status,
            "required_coverage": _to_decimal(org.required_coverage),
            "target_coverage": _to_decimal(org.target_coverage),
            "strong_coverage": _to_decimal(org.strong_coverage),
        }

    # ─── Attestation ────────────────────────────────────────

    def create_attestation(
        self,
        org: SolvencyOrg,
        reserve_snapshot: ReserveSnapshot,
        liability_snapshot: LiabilitySnapshot,
        solvency: dict,
    ) -> Attestation:
        """Build and sign a canonical attestation payload (blueprint section 15)."""
        generated_at = datetime.now(timezone.utc)
        expires_at = generated_at + timedelta(days=1)

        payload = {
            "attestationId": f"att_{secrets.token_hex(4)}",
            "snapshotId": str(reserve_snapshot.id),
            "chain": "ethereum",
            "reserveRoot": reserve_snapshot.reserve_root,
            "liabilityRoot": liability_snapshot.liability_root,
            "reserveValueUsd": str(solvency["reserve_value_usd"]),
            "liabilityValueUsd": str(solvency["liability_value_usd"]),
            "coverageRatio": str(solvency["coverage_ratio"]),
            "coveragePercent": str(solvency["coverage_percent"]),
            "solvencyStatus": solvency["status"].value,
            "methodologyVersion": org.methodology_version,
            "generatedAt": generated_at.isoformat(),
            "expiresAt": expires_at.isoformat(),
            "status": "VERIFIED",
            "disclaimer": (
                "Securithm verifies a defined set of reserves and liabilities "
                "under the published methodology and calculates the resulting "
                "coverage ratio. This does not prove the organization is "
                "financially solvent in the legal sense."
            ),
        }

        signature = self._sign_payload(payload)

        attestation = Attestation(
            org_id=org.org_id,
            snapshot_id=reserve_snapshot.id,
            liability_snapshot_id=liability_snapshot.id,
            reserve_root=reserve_snapshot.reserve_root,
            liability_root=liability_snapshot.liability_root,
            reserve_value=str(solvency["reserve_value_usd"]),
            liability_value=str(solvency["liability_value_usd"]),
            coverage_ratio=str(solvency["coverage_ratio"]),
            status=AttestationStatus.VERIFIED,
            signature=signature,
            payload=payload,
            expires_at=expires_at,
        )
        self.db.add(attestation)
        self.db.commit()
        self.db.refresh(attestation)
        return attestation

    def _sign_payload(self, payload: dict) -> str:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hmac.new(
            settings.solvency_signing_secret.encode(),
            canonical.encode(),
            hashlib.sha256,
        ).hexdigest()

    def verify_attestation_signature(self, attestation: Attestation) -> bool:
        """Recompute the HMAC over the stored payload to validate integrity."""
        if not attestation.payload or not attestation.signature:
            return False
        canonical = json.dumps(
            attestation.payload, sort_keys=True, separators=(",", ":")
        )
        expected = hmac.new(
            settings.solvency_signing_secret.encode(),
            canonical.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, attestation.signature)

    # ─── Full pipeline ──────────────────────────────────────

    async def run_full_snapshot(
        self,
        org: SolvencyOrg,
        liability_entries: Optional[list[tuple[str, str]]] = None,
    ) -> dict:
        """Run the complete pipeline: reserves → liabilities → solvency → attestation."""
        reserve_snapshot = await self.create_reserve_snapshot(org)

        # Use provided liability entries, or the most recent liability snapshot
        if liability_entries is not None:
            liability_snapshot = self.create_liability_snapshot(org, liability_entries)
        else:
            liability_snapshot = (
                self.db.query(LiabilitySnapshot)
                .filter(LiabilitySnapshot.org_id == org.org_id)
                .order_by(LiabilitySnapshot.created_at.desc())
                .first()
            )
            if not liability_snapshot:
                raise ValueError(
                    "No liability dataset. Import liabilities before generating a snapshot."
                )

        reserve_value = _to_decimal(reserve_snapshot.total_value_usd)
        liability_value = _to_decimal(liability_snapshot.total_liabilities)
        solvency = self.compute_solvency(org, reserve_value, liability_value)

        attestation = self.create_attestation(
            org, reserve_snapshot, liability_snapshot, solvency
        )
        alerts = self.generate_alerts(org, solvency)
        # Commit the alerts persisted after the attestation commit
        self.db.commit()

        return {
            "reserve_snapshot": reserve_snapshot,
            "liability_snapshot": liability_snapshot,
            "solvency": solvency,
            "attestation": attestation,
            "alerts": alerts,
        }

    # ─── Monitoring / alerts ────────────────────────────────

    def generate_alerts(self, org: SolvencyOrg, solvency: dict) -> list[SolvencyAlert]:
        """Generate monitoring alerts based on coverage thresholds (section 21)."""
        created: list[SolvencyAlert] = []
        ratio = _to_decimal(solvency["coverage_ratio"])
        required = _to_decimal(org.required_coverage)

        if ratio < required:
            created.append(
                self._add_alert(
                    org,
                    alert_type="coverage",
                    severity="critical",
                    message=(
                        f"Coverage ratio {solvency['coverage_percent']}% is below "
                        f"the required {required * 100}% threshold."
                    ),
                    value=str(solvency["coverage_percent"]),
                    threshold=str(required * 100),
                )
            )
        else:
            created.append(
                self._add_alert(
                    org,
                    alert_type="coverage",
                    severity="low",
                    message=(
                        f"Coverage ratio {solvency['coverage_percent']}% meets the "
                        f"required {required * 100}% threshold."
                    ),
                    value=str(solvency["coverage_percent"]),
                    threshold=str(required * 100),
                )
            )
        return created

    def _add_alert(
        self,
        org: SolvencyOrg,
        alert_type: str,
        severity: str,
        message: str,
        value: Optional[str] = None,
        threshold: Optional[str] = None,
    ) -> SolvencyAlert:
        from ...models.solvency import AlertSeverity

        alert = SolvencyAlert(
            org_id=org.org_id,
            alert_type=alert_type,
            severity=AlertSeverity(severity),
            message=message,
            value=value,
            threshold=threshold,
        )
        self.db.add(alert)
        self.db.flush()
        return alert
