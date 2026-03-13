import uuid
from datetime import datetime
from pydantic import BaseModel


class EmpresaCreate(BaseModel):
    name: str
    cnpj: str


class EmpresaResponse(BaseModel):
    id: uuid.UUID
    name: str
    cnpj: str
    created_at: datetime

    model_config = {"from_attributes": True}
