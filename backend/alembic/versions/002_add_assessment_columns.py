"""Add missing columns to risk_assessments table

Revision ID: 002_add_assessment_columns
Revises: 001_initial
Create Date: 2026-03-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_add_assessment_columns"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Add columns only if they don't already exist (idempotent)
    conn.execute(sa.text("""
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'Baixo',
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS assessed_by VARCHAR(255)
    """))

    # Back-fill severity for any existing rows based on their score
    conn.execute(sa.text("""
        UPDATE risk_assessments
        SET severity = CASE
            WHEN score >= 20 THEN 'Critico'
            WHEN score >= 12 THEN 'Alto'
            WHEN score >= 6  THEN 'Moderado'
            ELSE 'Baixo'
        END
        WHERE severity IS NULL
    """))


def downgrade() -> None:
    op.drop_column("risk_assessments", "assessed_by")
    op.drop_column("risk_assessments", "notes")
    op.drop_column("risk_assessments", "severity")
