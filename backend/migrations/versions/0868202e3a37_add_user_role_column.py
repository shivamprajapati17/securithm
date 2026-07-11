"""add_user_role_column

Revision ID: 0868202e3a37
Revises:
Create Date: 2026-07-11 16:25:35.641843
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '0868202e3a37'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column to existing users table
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=True))
    # Set default role for existing rows
    op.execute("UPDATE users SET role = 'admin' WHERE role IS NULL")
    # Make role non-nullable going forward
    op.alter_column('users', 'role', existing_type=sa.String(length=20), nullable=False)


def downgrade() -> None:
    op.drop_column('users', 'role')
