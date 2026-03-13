import uuid
from datetime import datetime
from pydantic import BaseModel


class ControlCreate(BaseModel):
    description: str
    type: str  # Preventivo, Detectivo, Corretivo
    frequency: str | None = None  # Diario, Semanal, Mensal, Trimestral, Anual
    responsible: str | None = None
    effectiveness: str | None = None  # Efetivo, Parcialmente Efetivo, Inefetivo
    empresa_id: uuid.UUID | None = None
    risk_ids: list[uuid.UUID] = []


class ControlUpdate(BaseModel):
    description: str | None = None
    type: str | None = None
    frequency: str | None = None
    responsible: str | None = None
    effectiveness: str | None = None
    empresa_id: uuid.UUID | None = None
    risk_ids: list[uuid.UUID] | None = None


class ControlResponse(BaseModel):
    id: uuid.UUID
    description: str
    type: str
    frequency: str | None
    responsible: str | None
    effectiveness: str | None
    empresa_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    risk_ids: list[uuid.UUID] = []

    model_config = {"from_attributes": True}


class ControlListResponse(BaseModel):
    items: list[ControlResponse]
    total: int
    page: int
    page_size: int
