"""Inspect the production database state (safe — never prints credentials).

Loads DATABASE_URL from .env.prod.local and reports:
  - whether the DB is reachable
  - whether alembic_version exists and which revisions are stamped
  - whether the solvency tables exist
  - whether the user_role column exists (added by migration 0868202e3a37)
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env.prod.local")

import os  # noqa: E402
import urllib.parse  # noqa: E402

import psycopg2  # noqa: E402

url = os.environ["DATABASE_URL"]
parsed = urllib.parse.urlparse(url)
host = parsed.hostname or "?"
print(f"host: {host}  db: {parsed.path.lstrip('/')}  port: {parsed.port or 5432}")

try:
    conn = psycopg2.connect(url, connect_timeout=10)
except Exception as e:
    print(f"REACHABILITY: FAILED — {type(e).__name__}: {e}")
    sys.exit(1)
print("REACHABILITY: OK")

with conn.cursor() as cur:
    cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' ORDER BY table_name"
    )
    tables = {r[0] for r in cur.fetchall()}

    solvency_tables = [
        "solvency_orgs",
        "reserve_wallets",
        "reserve_snapshots",
        "reserve_assets",
        "liability_snapshots",
        "liability_entries",
        "attestations",
        "solvency_alerts",
    ]
    print(f"total tables: {len(tables)}")
    print("alembic_version present:", "alembic_version" in tables)
    print("solvency tables present:", sorted(set(solvency_tables) & tables))
    print("solvency tables missing:", sorted(set(solvency_tables) - tables))

    if "alembic_version" in tables:
        cur.execute("SELECT version_num FROM alembic_version")
        print("alembic revisions:", [r[0] for r in cur.fetchall()])

    # Check user_role column on users (migration 0868202e3a37)
    if "users" in tables:
        cur.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='users' AND column_name='user_role'"
        )
        print("users.user_role column:", bool(cur.fetchall()))
conn.close()
