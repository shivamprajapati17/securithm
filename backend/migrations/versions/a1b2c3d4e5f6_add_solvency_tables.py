"""add_solvency_tables

Revision ID: a1b2c3d4e5f6
Revises: 0868202e3a37
Create Date: 2026-08-11 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "0868202e3a37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum types
    verification_method = sa.Enum(
        "signature", "transaction", "custodian_attestation", name="verification_method"
    )
    verification_status = sa.Enum(
        "directly_verified", "attested", "unverified", name="verification_status"
    )
    snapshot_status = sa.Enum("pending", "completed", "failed", name="snapshot_status")
    attestation_status = sa.Enum(
        "verified", "pending", "expired", name="attestation_status"
    )
    alert_severity = sa.Enum("critical", "high", "medium", "low", name="alert_severity")
    alert_status = sa.Enum("open", "acknowledged", "resolved", name="alert_status")

    # solvency_orgs
    op.create_table(
        "solvency_orgs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id",
            sa.Uuid(),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "methodology_version",
            sa.String(length=20),
            nullable=False,
            server_default="0.1",
        ),
        sa.Column(
            "currency", sa.String(length=10), nullable=False, server_default="USD"
        ),
        sa.Column(
            "required_coverage",
            sa.String(length=20),
            nullable=False,
            server_default="1.00",
        ),
        sa.Column(
            "target_coverage",
            sa.String(length=20),
            nullable=False,
            server_default="1.10",
        ),
        sa.Column(
            "strong_coverage",
            sa.String(length=20),
            nullable=False,
            server_default="1.20",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_solvency_orgs_slug", "solvency_orgs", ["slug"], unique=True)

    # reserve_wallets
    op.create_table(
        "reserve_wallets",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column(
            "chain", sa.String(length=50), nullable=False, server_default="ethereum"
        ),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column(
            "verification_method",
            verification_method,
            nullable=False,
            server_default="signature",
        ),
        sa.Column(
            "verification_status",
            verification_status,
            nullable=False,
            server_default="unverified",
        ),
        sa.Column("verification_evidence", sa.JSON(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reserve_wallets_org_id", "reserve_wallets", ["org_id"])

    # reserve_snapshots
    op.create_table(
        "reserve_snapshots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("block_height", sa.String(length=50), nullable=True),
        sa.Column("reserve_root", sa.String(length=130), nullable=True),
        sa.Column("total_value_usd", sa.String(length=50), nullable=True),
        sa.Column(
            "methodology_version",
            sa.String(length=20),
            nullable=False,
            server_default="0.1",
        ),
        sa.Column("status", snapshot_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reserve_snapshots_org_id", "reserve_snapshots", ["org_id"])

    # reserve_assets
    op.create_table(
        "reserve_assets",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "snapshot_id",
            sa.Uuid(),
            sa.ForeignKey("reserve_snapshots.id"),
            nullable=False,
        ),
        sa.Column(
            "chain", sa.String(length=50), nullable=False, server_default="ethereum"
        ),
        sa.Column("wallet_address", sa.String(length=255), nullable=False),
        sa.Column("asset_address", sa.String(length=255), nullable=True),
        sa.Column("symbol", sa.String(length=30), nullable=False),
        sa.Column("balance", sa.String(length=60), nullable=False),
        sa.Column("price", sa.String(length=40), nullable=False),
        sa.Column("price_source", sa.String(length=80), nullable=False),
        sa.Column("price_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("value_usd", sa.String(length=50), nullable=False),
        sa.Column("block_height", sa.String(length=50), nullable=True),
        sa.Column(
            "evidence_status",
            verification_status,
            nullable=False,
            server_default="unverified",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reserve_assets_snapshot_id", "reserve_assets", ["snapshot_id"])

    # liability_snapshots
    op.create_table(
        "liability_snapshots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("liability_root", sa.String(length=130), nullable=False),
        sa.Column("total_liabilities", sa.String(length=60), nullable=False),
        sa.Column(
            "tree_type",
            sa.String(length=40),
            nullable=False,
            server_default="merkle_sum_tree",
        ),
        sa.Column(
            "methodology_version",
            sa.String(length=20),
            nullable=False,
            server_default="0.1",
        ),
        sa.Column(
            "user_count", sa.String(length=20), nullable=False, server_default="0"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_liability_snapshots_org_id", "liability_snapshots", ["org_id"])

    # liability_entries
    op.create_table(
        "liability_entries",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "snapshot_id",
            sa.Uuid(),
            sa.ForeignKey("liability_snapshots.id"),
            nullable=False,
        ),
        sa.Column("leaf_index", sa.String(length=20), nullable=False),
        sa.Column("user_ref", sa.String(length=130), nullable=False),
        sa.Column("balance", sa.String(length=60), nullable=False),
        sa.Column("nonce", sa.String(length=130), nullable=False),
        sa.Column("commitment", sa.String(length=130), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_liability_entries_snapshot_id", "liability_entries", ["snapshot_id"]
    )
    op.create_index("ix_liability_entries_user_ref", "liability_entries", ["user_ref"])

    # attestations
    op.create_table(
        "attestations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column(
            "snapshot_id",
            sa.Uuid(),
            sa.ForeignKey("reserve_snapshots.id"),
            nullable=True,
        ),
        sa.Column(
            "liability_snapshot_id",
            sa.Uuid(),
            sa.ForeignKey("liability_snapshots.id"),
            nullable=True,
        ),
        sa.Column("reserve_root", sa.String(length=130), nullable=True),
        sa.Column("liability_root", sa.String(length=130), nullable=True),
        sa.Column("reserve_value", sa.String(length=50), nullable=False),
        sa.Column("liability_value", sa.String(length=50), nullable=False),
        sa.Column("coverage_ratio", sa.String(length=20), nullable=False),
        sa.Column(
            "status", attestation_status, nullable=False, server_default="verified"
        ),
        sa.Column("signature", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("published_tx", sa.String(length=130), nullable=True),
        sa.Column("published_chain", sa.String(length=50), nullable=True),
        sa.Column("published_contract_address", sa.String(length=130), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_attestations_org_id", "attestations", ["org_id"])

    # solvency_alerts
    op.create_table(
        "solvency_alerts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "org_id", sa.Uuid(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column("alert_type", sa.String(length=60), nullable=False),
        sa.Column("severity", alert_severity, nullable=False, server_default="medium"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("value", sa.String(length=60), nullable=True),
        sa.Column("threshold", sa.String(length=60), nullable=True),
        sa.Column("status", alert_status, nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_solvency_alerts_org_id", "solvency_alerts", ["org_id"])


def downgrade() -> None:
    op.drop_index("ix_solvency_alerts_org_id", table_name="solvency_alerts")
    op.drop_table("solvency_alerts")
    op.drop_index("ix_attestations_org_id", table_name="attestations")
    op.drop_table("attestations")
    op.drop_index("ix_liability_entries_user_ref", table_name="liability_entries")
    op.drop_index("ix_liability_entries_snapshot_id", table_name="liability_entries")
    op.drop_table("liability_entries")
    op.drop_index("ix_liability_snapshots_org_id", table_name="liability_snapshots")
    op.drop_table("liability_snapshots")
    op.drop_index("ix_reserve_assets_snapshot_id", table_name="reserve_assets")
    op.drop_table("reserve_assets")
    op.drop_index("ix_reserve_snapshots_org_id", table_name="reserve_snapshots")
    op.drop_table("reserve_snapshots")
    op.drop_index("ix_reserve_wallets_org_id", table_name="reserve_wallets")
    op.drop_table("reserve_wallets")
    op.drop_index("ix_solvency_orgs_slug", table_name="solvency_orgs")
    op.drop_table("solvency_orgs")

    sa.Enum(name="verification_method").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="verification_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="snapshot_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="attestation_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="alert_severity").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="alert_status").drop(op.get_bind(), checkfirst=True)
