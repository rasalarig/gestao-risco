from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

risk_control = Table(
    "risk_controls",
    Base.metadata,
    Column("risk_id", UUID(as_uuid=True), ForeignKey("risks.id"), primary_key=True),
    Column(
        "control_id", UUID(as_uuid=True), ForeignKey("controls.id"), primary_key=True
    ),
)
