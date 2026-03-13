import uuid
from datetime import datetime
from pydantic import BaseModel


class RiskCategoryCreate(BaseModel):
    name: str
    parent_id: uuid.UUID | None = None


class RiskCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RiskCategoryTreeResponse(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: uuid.UUID | None
    created_at: datetime
    children: list["RiskCategoryTreeResponse"] = []

    model_config = {"from_attributes": True}


class RiskCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: uuid.UUID | None = None
    area: str | None = None
    responsible: str | None = None
    status: str = "ativo"
    empresa_id: uuid.UUID | None = None


class RiskUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: uuid.UUID | None = None
    area: str | None = None
    responsible: str | None = None
    status: str | None = None
    empresa_id: uuid.UUID | None = None


class RiskResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category_id: uuid.UUID | None
    area: str | None
    responsible: str | None
    status: str
    empresa_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RiskListResponse(BaseModel):
    items: list[RiskResponse]
    total: int
    page: int
    page_size: int


class RiskAssessmentCreate(BaseModel):
    risk_id: uuid.UUID
    type: str  # inherent or residual
    impact: int  # 1-5
    probability: int  # 1-5
    notes: str | None = None
    assessed_by: str | None = None


class RiskAssessmentUpdate(BaseModel):
    type: str | None = None
    impact: int | None = None
    probability: int | None = None
    notes: str | None = None
    assessed_by: str | None = None


class RiskAssessmentResponse(BaseModel):
    id: uuid.UUID
    risk_id: uuid.UUID
    type: str
    impact: int
    probability: int
    score: float
    severity: str
    notes: str | None
    assessed_by: str | None
    assessed_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class RiskAssessmentSummaryItem(BaseModel):
    risk_id: uuid.UUID
    risk_name: str
    category_name: str | None
    inherent_impact: int | None = None
    inherent_probability: int | None = None
    inherent_score: float | None = None
    inherent_severity: str | None = None
    residual_impact: int | None = None
    residual_probability: int | None = None
    residual_score: float | None = None
    residual_severity: str | None = None


class RiskAssessmentSummaryResponse(BaseModel):
    items: list[RiskAssessmentSummaryItem]
    severity_counts: dict[str, int]


class RiskFactorCreate(BaseModel):
    name: str
    description: str | None = None
    risk_id: uuid.UUID
    category: str | None = None


class RiskFactorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    risk_id: uuid.UUID | None = None
    category: str | None = None


class RiskFactorResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    risk_id: uuid.UUID
    category: str | None = None
    risk_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RiskFactorListResponse(BaseModel):
    items: list[RiskFactorResponse]
    total: int
    page: int
    page_size: int
