import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def compute_severity(score: float) -> str:
    """Compute severity label from score (impact * probability)."""
    if score >= 20:
        return "Critico"
    elif score >= 12:
        return "Alto"
    elif score >= 6:
        return "Moderado"
    else:
        return "Baixo"


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    risk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("risks.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'inherent' or 'residual'
    impact: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    probability: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    score: Mapped[float] = mapped_column(Float, nullable=False)  # impact * probability
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="Baixo"
    )  # Critico, Alto, Moderado, Baixo
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    risk: Mapped["Risk"] = relationship(back_populates="assessments")  # noqa: F821
