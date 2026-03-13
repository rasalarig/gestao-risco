import uuid
from datetime import date, datetime
from pydantic import BaseModel


class ActionPlanCreate(BaseModel):
    title: str
    description: str | None = None
    responsible: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    status: str = "pendente"
    priority: str = "media"
    risk_id: uuid.UUID | None = None
    control_id: uuid.UUID | None = None
    empresa_id: uuid.UUID | None = None


class ActionPlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    responsible: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    status: str | None = None
    priority: str | None = None
    risk_id: uuid.UUID | None = None
    control_id: uuid.UUID | None = None
    empresa_id: uuid.UUID | None = None


class ActionPlanResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    responsible: str | None
    start_date: date | None
    due_date: date | None
    status: str
    priority: str
    risk_id: uuid.UUID | None
    control_id: uuid.UUID | None
    empresa_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActionPlanListResponse(BaseModel):
    items: list[ActionPlanResponse]
    total: int
    page: int
    page_size: int


class ActionPlanSummaryResponse(BaseModel):
    pendente: int = 0
    em_andamento: int = 0
    concluido: int = 0
    cancelado: int = 0
    total: int = 0
