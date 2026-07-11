"""Tests for the API Key management endpoints.

These tests use FastAPI's TestClient with an in-memory SQLite database
to verify the full CRUD lifecycle of API keys including rate limiting.
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
    """Override the get_db dependency to use test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ─── Fixtures ─────────────────────────────────────────────


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables and seed test data before each test, clean up after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a test database session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db):
    """Create and return a test user with a free plan."""
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
        email="test@example.com",
        display_name="Test User",
        password_hash=get_password_hash("password123"),
        org_id=org.id,
    )
    db.add(user)
    db.commit()

    return user


@pytest.fixture
def auth_headers(test_user):
    """Generate JWT auth headers for the test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


# ─── Tests ────────────────────────────────────────────────


class TestApiKeyCreate:
    def test_create_api_key_success(self, client, auth_headers):
        """Test creating a new API key returns the full key once."""
        response = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Test Key", "rate_limit_per_hour": 100},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Key"
        assert data["rate_limit_per_hour"] == 100
        assert data["is_active"] is True
        assert data["full_key"].startswith("sk_live_")
        assert data["key_prefix"] is not None
        assert "id" in data

    def test_create_api_key_default_rate_limit(self, client, auth_headers):
        """Test creating a key without specifying rate limit uses default 100."""
        response = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Default Key"},
        )
        assert response.status_code == 201
        assert response.json()["rate_limit_per_hour"] == 100

    def test_create_api_key_invalid_rate_limit(self, client, auth_headers):
        """Test that rate limit below 1 returns 400."""
        response = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Bad Key", "rate_limit_per_hour": 0},
        )
        assert response.status_code == 400
        assert "Rate limit" in response.json()["detail"]

    def test_create_api_key_exceeds_max(self, client, auth_headers):
        """Test that rate limit above 10000 returns 400."""
        response = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Too High", "rate_limit_per_hour": 99999},
        )
        assert response.status_code == 400
        assert "Rate limit" in response.json()["detail"]

    def test_create_api_key_unauthenticated(self, client):
        """Test creating a key without auth returns 401."""
        response = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "No Auth", "rate_limit_per_hour": 100},
        )
        assert response.status_code == 401

    def test_create_api_key_max_keys(self, client, auth_headers):
        """Test that creating more than 10 active keys fails."""
        for i in range(10):
            client.post(
                "/api/v1/auth/api-keys",
                headers=auth_headers,
                json={"name": f"Key {i}", "rate_limit_per_hour": 100},
            )

        # 11th key should fail
        response = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Too Many", "rate_limit_per_hour": 100},
        )
        assert response.status_code == 400
        assert "Maximum" in response.json()["detail"]


class TestApiKeyList:
    def test_list_api_keys_empty(self, client, auth_headers):
        """Test listing keys when none exist returns empty array."""
        response = client.get("/api/v1/auth/api-keys", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_api_keys(self, client, auth_headers):
        """Test listing keys returns all created keys."""
        client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Key 1", "rate_limit_per_hour": 100},
        )
        client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Key 2", "rate_limit_per_hour": 500},
        )

        response = client.get("/api/v1/auth/api-keys", headers=auth_headers)
        assert response.status_code == 200
        keys = response.json()
        assert len(keys) == 2
        assert keys[0]["name"] == "Key 2"  # Most recent first
        assert keys[1]["name"] == "Key 1"
        # Full key should NOT be in list responses
        assert "full_key" not in keys[0]

    def test_list_api_keys_unauthenticated(self, client):
        """Test listing keys without auth returns 401."""
        response = client.get("/api/v1/auth/api-keys")
        assert response.status_code == 401


class TestApiKeyUpdate:
    def test_update_rate_limit(self, client, auth_headers):
        """Test updating an API key's rate limit."""
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Updatable", "rate_limit_per_hour": 100},
        )
        key_id = create_resp.json()["id"]

        response = client.patch(
            f"/api/v1/auth/api-keys/{key_id}",
            headers=auth_headers,
            json={"rate_limit_per_hour": 500},
        )
        assert response.status_code == 200
        assert response.json()["rate_limit_per_hour"] == 500
        assert response.json()["name"] == "Updatable"  # Name unchanged

    def test_update_name(self, client, auth_headers):
        """Test updating an API key's name."""
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Old Name", "rate_limit_per_hour": 100},
        )
        key_id = create_resp.json()["id"]

        response = client.patch(
            f"/api/v1/auth/api-keys/{key_id}",
            headers=auth_headers,
            json={"name": "New Name"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"
        assert response.json()["rate_limit_per_hour"] == 100

    def test_update_key_not_found(self, client, auth_headers):
        """Test updating a non-existent key returns 404."""
        fake_id = uuid.uuid4()
        response = client.patch(
            f"/api/v1/auth/api-keys/{fake_id}",
            headers=auth_headers,
            json={"name": "Ghost"},
        )
        assert response.status_code == 404


class TestApiKeyRevoke:
    def test_revoke_api_key(self, client, auth_headers):
        """Test revoking (deleting) an API key."""
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "To Delete", "rate_limit_per_hour": 100},
        )
        key_id = create_resp.json()["id"]

        response = client.delete(
            f"/api/v1/auth/api-keys/{key_id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Verify it's gone from list
        list_resp = client.get("/api/v1/auth/api-keys", headers=auth_headers)
        assert len(list_resp.json()) == 0

    def test_revoke_key_not_found(self, client, auth_headers):
        """Test revoking a non-existent key returns 404."""
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/api/v1/auth/api-keys/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestApiKeyAuth:
    def test_invalid_api_key_rejected(self, client):
        """Test that a request with an invalid API key gets 401."""
        headers = {"Authorization": "Bearer sk_live_invalidkey1234567890"}
        response = client.get("/api/v1/scans", headers=headers)
        # The middleware validates the key against the DB; if not found, returns 401
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    def test_api_key_authenticated_request(self, client, test_user, auth_headers):
        """Test that a valid API key is properly created and stored.

        Verifies the full lifecycle: create a key via JWT auth, verify it
        appears in the list, then revoke it.
        """
        # Create API key
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            headers=auth_headers,
            json={"name": "Lifecycle Key", "rate_limit_per_hour": 50},
        )
        assert create_resp.status_code == 201
        key_id = create_resp.json()["id"]
        full_key = create_resp.json()["full_key"]
        assert full_key.startswith("sk_live_")

        # Verify it appears in the list
        list_resp = client.get("/api/v1/auth/api-keys", headers=auth_headers)
        assert list_resp.status_code == 200
        key_ids = [k["id"] for k in list_resp.json()]
        assert key_id in key_ids

        # Revoke it
        del_resp = client.delete(
            f"/api/v1/auth/api-keys/{key_id}",
            headers=auth_headers,
        )
        assert del_resp.status_code == 204

        # Verify it's gone
        list_resp2 = client.get("/api/v1/auth/api-keys", headers=auth_headers)
        key_ids2 = [k["id"] for k in list_resp2.json()]
        assert key_id not in key_ids2


# ─── Client fixture that depends on dependency override ──


@pytest.fixture
def client():
    """Provide a TestClient with the overridden db dependency."""
    with TestClient(app) as c:
        yield c
