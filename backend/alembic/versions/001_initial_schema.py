"""Initial schema with all models

Revision ID: 001_initial
Revises:
Create Date: 2026-03-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Empresas
    op.create_table(
        "empresas",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("cnpj", sa.String(18), unique=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Users
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="viewer"),
        sa.Column(
            "empresa_id", UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=True
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Risk Categories (tree structure)
    op.create_table(
        "risk_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "parent_id",
            UUID(as_uuid=True),
            sa.ForeignKey("risk_categories.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Risks
    op.create_table(
        "risks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category_id",
            UUID(as_uuid=True),
            sa.ForeignKey("risk_categories.id"),
            nullable=True,
        ),
        sa.Column("area", sa.String(255), nullable=True),
        sa.Column("responsible", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="aberto"),
        sa.Column(
            "empresa_id", UUID(as_uuid=True), sa.ForeignKey("empresas.id"), nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Risk Assessments
    op.create_table(
        "risk_assessments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "risk_id", UUID(as_uuid=True), sa.ForeignKey("risks.id"), nullable=False
        ),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("impact", sa.Integer(), nullable=False),
        sa.Column("probability", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column(
            "assessed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Risk Factors
    op.create_table(
        "risk_factors",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "risk_id", UUID(as_uuid=True), sa.ForeignKey("risks.id"), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Controls
    op.create_table(
        "controls",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("frequency", sa.String(50), nullable=True),
        sa.Column("responsible", sa.String(255), nullable=True),
        sa.Column("effectiveness", sa.String(50), nullable=True),
        sa.Column("empresa_id", UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Risk-Control many-to-many
    op.create_table(
        "risk_controls",
        sa.Column(
            "risk_id", UUID(as_uuid=True), sa.ForeignKey("risks.id"), primary_key=True
        ),
        sa.Column(
            "control_id",
            UUID(as_uuid=True),
            sa.ForeignKey("controls.id"),
            primary_key=True,
        ),
    )

    # Action Plans
    op.create_table(
        "action_plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("responsible", sa.String(255), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "status", sa.String(50), nullable=False, server_default="pendente"
        ),
        sa.Column("priority", sa.String(20), nullable=False, server_default="media"),
        sa.Column(
            "risk_id", UUID(as_uuid=True), sa.ForeignKey("risks.id"), nullable=True
        ),
        sa.Column(
            "control_id",
            UUID(as_uuid=True),
            sa.ForeignKey("controls.id"),
            nullable=True,
        ),
        sa.Column("empresa_id", UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("action_plans")
    op.drop_table("risk_controls")
    op.drop_table("controls")
    op.drop_table("risk_factors")
    op.drop_table("risk_assessments")
    op.drop_table("risks")
    op.drop_table("risk_categories")
    op.drop_table("users")
    op.drop_table("empresas")
