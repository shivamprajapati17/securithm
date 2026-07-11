"""Tests for wallet persistence and API key usage endpoints.

Tests the PATCH /api/v1/auth/me (wallet address) and
GET /api/v1/auth/api-keys/usage endpoints.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base, get_db
from backend.main import app
from backend.models.user import User, Organization, Plan
from backend.core.security import get_password_hash, create_access_token

# ─── In-memory SQLite database for tests ──────────────────

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


# ─── Fixtures ─────────────────────────────────────────────


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

    org = Organization(
        id=uuid.uuid4(),
        name="Test Org",
        plan_id=plan.id,
    )
    db.add(org)
    db.flush()

    user = User(
        id=uuid.uuid4(),
        email="wallet-test@example.com",
        display_name="Wallet Test",
        password_hash=get_password_hash("password123"),
        org_id=org.id,
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


# ─── Wallet Tests ─────────────────────────────────────────


class TestWalletPersistence:
    def test_update_wallet_address(self, client, auth_headers):
        """Test setting a wallet address via PATCH /me."""
        response = client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"wallet_address": "0x1234567890abcdef1234567890abcdef12345678"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["wallet_address"] == "0x1234567890abcdef1234567890abcdef12345678"
        assert data["email"] == "wallet-test@example.com"

    def test_clear_wallet_address(self, client, auth_headers):
        """Test clearing a wallet address (set to null)."""
        # First set it
        client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"wallet_address": "0xabc"},
        )
        # Then clear it
        response = client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"wallet_address": None},
        )
        assert response.status_code == 200
        assert response.json()["wallet_address"] is None

    def test_wallet_persists_across_requests(self, client, auth_headers):
        """Test that wallet address is stored in DB and returned by GET /me."""
        # Set wallet
        client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={"wallet_address": "0xDEADBEEF"},
        )
        # Verify via GET /me
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["wallet_address"] == "0xDEADBEEF"

    def test_update_wallet_unauthenticated(self, client):
        """Test updating profile without auth returns 401."""
        response = client.patch(
            "/api/v1/auth/me",
            json={"wallet_address": "0xabc"},
        )
        assert response.status_code == 401

    def test_update_display_name_and_wallet_together(self, client, auth_headers):
        """Test updating multiple fields at once."""
        response = client.patch(
            "/api/v1/auth/me",
            headers=auth_headers,
            json={
                "display_name": "New Name",
                "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "New Name"
        assert data["wallet_address"] == "0x1234567890abcdef1234567890abcdef12345678"


# ─── API Key Usage Tests ─────────────────────────────────


class TestApiKeyUsage:
    def test_usage_empty_no_keys(self, client, auth_headers):
        """Test usage endpoint returns empty dict when no keys exist."""
        response = client.get(
            "/api/v1/auth/api-keys/usage",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == {}

    def test_usage_returns_zero_for_new_key(self, client, auth_headers):
        """Test a newly created key has 0 usage."""
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Fresh Key", "rate_limit_per_hour": 100},
        )
        assert create_resp.status_code == 201

        response = client.get(
            "/api/v1/auth/api-keys/usage",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        key_id = create_resp.json()["id"]
        assert key_id in data
        assert data[key_id] == 0

    def test_usage_multiple_keys(self, client, auth_headers):
        """Test usage endpoint returns entries for all active keys."""
        resp1 = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Key A", "rate_limit_per_hour": 100},
        )
        resp2 = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Key B", "rate_limit_per_hour": 500},
        )

        response = client.get(
            "/api/v1/auth/api-keys/usage",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert resp1.json()["id"] in data
        assert resp2.json()["id"] in data

    def test_usage_unauthenticated(self, client):
        """Test usage endpoint without auth returns 401."""
        response = client.get("/api/v1/auth/api-keys/usage")
        assert response.status_code == 401

    def test_usage_revoked_key_excluded(self, client, auth_headers):
        """Test that revoked keys are excluded from usage stats."""
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Soon Gone", "rate_limit_per_hour": 100},
        )
        key_id = create_resp.json()["id"]

        # Revoke it
        client.delete(
            f"/api/v1/auth/api-keys/{key_id}",
            headers=auth_headers,
        )

        # Usage should no longer include this key
        response = client.get(
            "/api/v1/auth/api-keys/usage",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert key_id not in response.json()
