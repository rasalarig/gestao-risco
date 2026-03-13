"""Add category column to risk_factors table

Revision ID: 003_add_risk_factor_category
Revises: 002_add_assessment_columns
Create Date: 2026-03-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "003_add_risk_factor_category"
down_revision: Union[str, None] = "002_add_assessment_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add category column to risk_factors table (idempotent)
    op.execute("ALTER TABLE risk_factors ADD COLUMN IF NOT EXISTS category VARCHAR(100)")


def downgrade() -> None:
    op.drop_column("risk_factors", "category")
