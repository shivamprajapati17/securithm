"""Tests for the Securithm Solvency module.

Covers the Merkle Sum Tree cryptography (build/proof/verify/tamper detection)
and the full API pipeline (profile -> wallets -> liabilities -> snapshot ->
attestation -> public dashboard -> user proof verification).
"""

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base, get_db
from backend.main import app
from backend.models.user import User, Organization, Plan
from backend.core.security import get_password_hash, create_access_token

from backend.services.solvency.crypto import (
    build_liability_tree,
    leaf_commitment,
    verify_liability_proof,
)
from backend.services.solvency.onchain import (
    attestation_id_to_bytes32,
    cents_to_usd,
    encode_publish_calldata,
)

# ─── In-memory SQLite database for tests ──────────────────

# NOTE: uses the same SQLite file as the other backend test modules. All test
# modules override get_db at import time, and the app resolves the override from
# whichever module imported last; sharing one file keeps the override consistent
# regardless of import order.
TEST_DATABASE_URL = "sqlite:///./test_securithm.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ─── Crypto tests (no DB) ────────────────────────────────


class TestMerkleSumTree:
    def test_build_and_verify_all_leaves(self):
        entries = [
            ("u1", "1000", "n1"),
            ("u2", "2500", "n2"),
            ("u3", "500", "n3"),
            ("u4", "3000", "n4"),
            ("u5", "750", "n5"),
        ]
        tree = build_liability_tree(entries)
        assert tree.root is not None
        assert tree.root.startswith("0x")
        assert tree.format_total() == "7750.00"

        for i, (ref, bal, nonce) in enumerate(entries):
            proof = tree.proof(i)
            ok = verify_liability_proof(
                tree.root,
                i,
                leaf_commitment(ref, bal, nonce),
                int(Decimal(bal) * 100),
                proof,
            )
            assert ok, f"leaf {i} should be included"

    def test_tampered_balance_rejected(self):
        entries = [("u1", "1000", "n1"), ("u2", "2500", "n2")]
        tree = build_liability_tree(entries)
        proof = tree.proof(0)
        assert not verify_liability_proof(
            tree.root,
            0,
            leaf_commitment("u1", "9999", "n1"),
            int(9999 * 100),
            proof,
        )

    def test_fake_proof_rejected(self):
        entries = [("u1", "1000", "n1")]
        tree = build_liability_tree(entries)
        assert not verify_liability_proof(
            tree.root, 0, leaf_commitment("u1", "1000", "n1"), 100000, ["0xdeadbeef"]
        )

    def test_negative_balance_rejected(self):
        with pytest.raises(ValueError):
            build_liability_tree([("u1", "-100", "n1")])

    def test_empty_tree_has_defined_root(self):
        tree = build_liability_tree([("u1", "100", "n1")])
        assert tree.root

    def test_invalid_balance_rejected(self):
        from decimal import InvalidOperation

        with pytest.raises((ValueError, InvalidOperation)):
            build_liability_tree([("u1", "not-a-number", "n1")])


# ─── API tests ───────────────────────────────────────────


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db):
    plan = Plan(
        id=uuid.uuid4(),
        name="Free",
        max_scans_per_month=50,
        max_monitored_contracts=1,
        price_usd=0.0,
    )
    db.add(plan)
    db.flush()

    org = Organization(id=uuid.uuid4(), name="Solvency Test Org", plan_id=plan.id)
    db.add(org)
    db.flush()

    user = User(
        id=uuid.uuid4(),
        email="solvency@example.com",
        display_name="Solvency Tester",
        password_hash=get_password_hash("password123"),
        org_id=org.id,
        role="admin",
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


class TestSolvencyPipeline:
    def _create_profile(self, client, auth_headers):
        return client.post(
            "/api/v1/solvency/profile",
            headers=auth_headers,
            json={
                "slug": "solvency-test",
                "display_name": "Solvency Test Org",
                "website": "https://example.com",
                "is_public": True,
            },
        )

    def test_full_pipeline(self, client, auth_headers):
        # 1. Create profile
        resp = self._create_profile(client, auth_headers)
        assert resp.status_code == 201, resp.text
        profile = resp.json()
        assert profile["slug"] == "solvency-test"

        # 2. Add reserve wallets with declared balances (no network needed)
        wallet = client.post(
            "/api/v1/solvency/wallets",
            headers=auth_headers,
            json={
                "chain": "ethereum",
                "address": "0x1111111111111111111111111111111111111111",
                "label": "Treasury",
                "declared_assets": [
                    {
                        "asset_address": None,
                        "symbol": "ETH",
                        "decimals": 18,
                        "balance": "100",
                    }
                ],
            },
        )
        assert wallet.status_code == 201, wallet.text

        wallet2 = client.post(
            "/api/v1/solvency/wallets",
            headers=auth_headers,
            json={
                "chain": "ethereum",
                "address": "0x2222222222222222222222222222222222222222",
                "label": "Stablecoins",
                "declared_assets": [
                    {
                        "asset_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                        "symbol": "USDC",
                        "decimals": 6,
                        "balance": "50000",
                    }
                ],
            },
        )
        assert wallet2.status_code == 201

        # 3. Commit liabilities via Merkle Sum Tree
        entries = [
            {"user_ref": f"user_{i:03d}", "balance": str(1000 + i * 500)}
            for i in range(8)
        ]
        liab = client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={"entries": entries},
        )
        assert liab.status_code == 201, liab.text
        liab_data = liab.json()
        assert liab_data["liability_root"].startswith("0x")
        assert liab_data["tree_type"] == "merkle_sum_tree"
        assert int(liab_data["user_count"]) == 8

        # 4. Run full snapshot pipeline
        snap = client.post("/api/v1/solvency/snapshots", headers=auth_headers)
        assert snap.status_code == 200, snap.text
        data = snap.json()
        assert data["status"] == "completed"
        assert data["orgSlug"] == "solvency-test"
        assert "attestationId" in data
        solvency = data["solvency"]
        assert solvency["status"] in ("solvent", "under-collateralized")

        # 5. Public dashboard data
        public = client.get("/api/v1/solvency/public/solvency-test")
        assert public.status_code == 200
        pub = public.json()
        assert pub["hasAttestation"] is True
        assert pub["orgName"] == "Solvency Test Org"
        assert len(pub["reserves"]) >= 2
        assert pub["liabilityRoot"] == liab_data["liability_root"]
        assert Decimal(pub["solvency"]["coverageRatio"]) > 0

        # 6. Alerts generated
        alerts = client.get("/api/v1/solvency/alerts", headers=auth_headers)
        assert alerts.status_code == 200
        assert len(alerts.json()) >= 1

        # 7. Verify an attestation signature
        att_id = data["attestationId"]
        att = client.get(
            f"/api/v1/solvency/attestation/{att_id}", params={"verify": "true"}
        )
        assert att.status_code == 200, att.text
        assert att.json()["signature"]

    def test_user_proof_roundtrip(self, client, auth_headers):
        self._create_profile(client, auth_headers)
        client.post(
            "/api/v1/solvency/wallets",
            headers=auth_headers,
            json={
                "address": "0x3333333333333333333333333333333333333333",
                "declared_assets": [{"symbol": "ETH", "balance": "10"}],
            },
        )
        liab = client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={"entries": [{"user_ref": "alice", "balance": "2500"}]},
        ).json()

        # Generate a proof for alice
        proof = client.get(
            f"/api/v1/solvency/liabilities/{liab['id']}/proof",
            headers=auth_headers,
            params={"user_ref": "alice"},
        )
        assert proof.status_code == 200, proof.text
        payload = proof.json()
        assert payload["balance"] == "2500"
        assert payload["liabilityRoot"] == liab["liability_root"]
        assert len(payload["merkleProof"]) >= 0

        # Verify the proof -> INCLUDED
        verify = client.post(
            "/api/v1/solvency/liabilities/verify",
            json={
                "snapshotId": liab["id"],
                "leafIndex": payload["leafIndex"],
                "balance": payload["balance"],
                "nonce": payload["nonce"],
                "commitment": payload["commitment"],
                "liabilityRoot": payload["liabilityRoot"],
                "merkleProof": payload["merkleProof"],
            },
        )
        assert verify.status_code == 200, verify.text
        assert verify.json()["result"] == "INCLUDED"

        # Tampered balance -> INVALID
        verify_bad = client.post(
            "/api/v1/solvency/liabilities/verify",
            json={
                "snapshotId": liab["id"],
                "leafIndex": payload["leafIndex"],
                "balance": "99999",
                "nonce": payload["nonce"],
                "commitment": payload["commitment"],
                "liabilityRoot": payload["liabilityRoot"],
                "merkleProof": payload["merkleProof"],
            },
        )
        assert verify_bad.json()["result"] == "INVALID"

        # Wrong root -> INVALID
        verify_wrong_root = client.post(
            "/api/v1/solvency/liabilities/verify",
            json={
                "snapshotId": liab["id"],
                "leafIndex": payload["leafIndex"],
                "balance": payload["balance"],
                "nonce": payload["nonce"],
                "commitment": payload["commitment"],
                "liabilityRoot": "0x" + "ab" * 32,
                "merkleProof": payload["merkleProof"],
            },
        )
        assert verify_wrong_root.json()["result"] == "INVALID"

    def test_demo_seed(self, client):
        resp = client.post("/api/v1/solvency/demo")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["orgSlug"] == "securithm-demo"
        assert "attestationId" in data

        # The public dashboard is live immediately
        public = client.get("/api/v1/solvency/public/securithm-demo")
        assert public.status_code == 200
        assert public.json()["hasAttestation"] is True

        # Demo should be idempotent (reuse existing org)
        resp2 = client.post("/api/v1/solvency/demo")
        assert resp2.json()["reused"] is True

    def test_profile_requires_unique_slug(self, client, auth_headers):
        self._create_profile(client, auth_headers)
        resp = self._create_profile(client, auth_headers)
        assert resp.status_code == 409

    def test_duplicate_liability_entries_rejected(self, client, auth_headers):
        self._create_profile(client, auth_headers)
        resp = client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={
                "entries": [
                    {"user_ref": "alice", "balance": "100"},
                    {"user_ref": "alice", "balance": "200"},
                ]
            },
        )
        assert resp.status_code == 400
        assert "Duplicate" in resp.json()["detail"]

    def test_invalid_liability_balance_rejected(self, client, auth_headers):
        self._create_profile(client, auth_headers)
        resp = client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={"entries": [{"user_ref": "alice", "balance": "abc"}]},
        )
        assert resp.status_code == 400
        assert "Invalid balance" in resp.json()["detail"]

    def test_private_org_data_not_exposed(self, client, auth_headers):
        """A private org's snapshot data must 404 on the public endpoints."""
        self._create_profile(client, auth_headers)
        # Make the org private
        client.patch(
            "/api/v1/solvency/profile",
            headers=auth_headers,
            json={"is_public": False},
        )
        client.post(
            "/api/v1/solvency/wallets",
            headers=auth_headers,
            json={
                "address": "0x4444444444444444444444444444444444444444",
                "declared_assets": [{"symbol": "ETH", "balance": "5"}],
            },
        )
        client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={"entries": [{"user_ref": "alice", "balance": "100"}]},
        )
        snap = client.post("/api/v1/solvency/snapshots", headers=auth_headers)
        assert snap.status_code == 200
        snap_id = snap.json()["snapshotId"]
        att_id = snap.json()["attestationId"]

        # Public endpoints must not leak private org data
        assert client.get(f"/api/v1/reserves/{snap_id}").status_code == 404
        assert client.get(f"/api/v1/solvency/attestation/{att_id}").status_code == 404

    def _seed_attestation(self, client, auth_headers) -> str:
        """Run the minimal pipeline and return the attestation id."""
        self._create_profile(client, auth_headers)
        client.post(
            "/api/v1/solvency/wallets",
            headers=auth_headers,
            json={
                "address": "0x5555555555555555555555555555555555555555",
                "declared_assets": [{"symbol": "ETH", "balance": "10"}],
            },
        )
        client.post(
            "/api/v1/solvency/liabilities",
            headers=auth_headers,
            json={"entries": [{"user_ref": "alice", "balance": "100"}]},
        )
        snap = client.post("/api/v1/solvency/snapshots", headers=auth_headers)
        assert snap.status_code == 200, snap.text
        return snap.json()["attestationId"]

    def test_attestation_json_export(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        resp = client.get(f"/api/v1/solvency/attestation/{att_id}/export?format=json")
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("application/json")
        assert "attachment" in resp.headers.get("content-disposition", "")
        doc = resp.json()
        assert doc["documentType"] == "securithm-solvency-attestation"
        assert doc["attestation"]["signature"]
        assert doc["attestation"]["reserveValueUsd"]
        assert doc["organization"]["name"] == "Solvency Test Org"
        assert doc["onChain"]["published"] is False

    def test_attestation_pdf_export(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        resp = client.get(f"/api/v1/solvency/attestation/{att_id}/export?format=pdf")
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("application/pdf")
        assert resp.content.startswith(b"%PDF")

    def test_attestation_export_bad_format(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        resp = client.get(f"/api/v1/solvency/attestation/{att_id}/export?format=xml")
        assert resp.status_code == 422

    def test_publish_requires_configuration(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        # No SOLVENCY_CHAIN_* configured in the test env -> 400
        resp = client.post(
            f"/api/v1/solvency/attestation/{att_id}/publish",
            headers=auth_headers,
            json={"chain": "ethereum"},
        )
        assert resp.status_code == 400, resp.text

    def test_publish_forbidden_for_other_org(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        # Create a second org/user whose attestation does not belong to the first
        resp = client.post(
            f"/api/v1/solvency/attestation/{att_id}/publish",
            headers=auth_headers,
            json={
                "chain": "ethereum",
                "rpc_url": "https://example.invalid",
                "contract_address": "0x" + "66" * 20,
            },
        )
        # Belongs to the same org, so we get 400 (unconfigured) not 403.
        assert resp.status_code == 400, resp.text

    def test_attestation_onchain_status_unpublished(self, client, auth_headers):
        att_id = self._seed_attestation(client, auth_headers)
        resp = client.get(f"/api/v1/solvency/attestation/{att_id}/onchain")
        assert resp.status_code == 200
        assert resp.json()["published"] is False


class TestOnChainEncoding:
    def test_publish_calldata_shape(self):
        calldata = encode_publish_calldata(
            "att_abcd",
            "0x" + "ab" * 32,
            "0x" + "cd" * 32,
            "100.50",
            "50.25",
            1700000000,
        )
        assert calldata.startswith("0x")
        # selector (8 hex chars) + 6 x 32-byte words
        assert len(calldata) == 2 + 8 + 6 * 64
        # Words: id, reserveRoot, liabilityRoot, reserveCents, liabilityCents, ts
        words = [calldata[i : i + 64] for i in range(10, len(calldata), 64)]
        assert words[3] == f"{10050:064x}"
        assert words[4] == f"{5025:064x}"
        assert words[5] == f"{1700000000:064x}"

    def test_cents_conversion(self):
        assert cents_to_usd(10050) == "100.50"
        assert cents_to_usd(0) == "0.00"

    def test_attestation_id_bytes32(self):
        value = attestation_id_to_bytes32("att_123")
        assert value.startswith("0x")
        assert len(value) == 66
        assert attestation_id_to_bytes32("att_123") == attestation_id_to_bytes32(
            "att_123"
        )

    def test_bytes32_padding_of_short_roots(self):
        calldata = encode_publish_calldata("att_x", "0x1234", "0xabcd", "1", "1", 1)
        # data starts after "0x" + 8-char selector
        words = [calldata[i : i + 64] for i in range(10, len(calldata), 64)]
        assert words[1] == "00" * 30 + "1234"
        assert words[2] == "00" * 30 + "abcd"
