import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Control(Base):
    __tablename__ = "controls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # preventivo, detectivo, corretivo
    frequency: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # diario, semanal, mensal, anual
    responsible: Mapped[str | None] = mapped_column(String(255), nullable=True)
    effectiveness: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # efetivo, parcialmente_efetivo, inefetivo
    empresa_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    risks: Mapped[list["Risk"]] = relationship(  # noqa: F821
        secondary="risk_controls", back_populates="controls"
    )
    action_plans: Mapped[list["ActionPlan"]] = relationship(back_populates="control")  # noqa: F821
