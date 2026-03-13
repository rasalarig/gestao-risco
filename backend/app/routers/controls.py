import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.models.control import Control
from app.models.risk import Risk
from app.models.risk_control import risk_control
from app.models.user import User
from app.schemas.control import (
    ControlCreate,
    ControlUpdate,
    ControlResponse,
    ControlListResponse,
)

router = APIRouter(prefix="/controls", tags=["controls"])


def _control_to_response(control: Control) -> dict:
    """Convert a Control ORM object to a response dict with risk_ids."""
    risk_ids = [r.id for r in control.risks] if control.risks else []
    return {
        "id": control.id,
        "description": control.description,
        "type": control.type,
        "frequency": control.frequency,
        "responsible": control.responsible,
        "effectiveness": control.effectiveness,
        "empresa_id": control.empresa_id,
        "created_at": control.created_at,
        "updated_at": control.updated_at,
        "risk_ids": risk_ids,
    }


@router.get("/", response_model=ControlListResponse)
async def list_controls(
    risk_id: Optional[uuid.UUID] = Query(None, description="Filter by linked risk"),
    search: Optional[str] = Query(None, description="Search by description or responsible"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List controls with optional risk filter, search, and pagination."""
    query = select(Control).options(selectinload(Control.risks))

    if risk_id is not None:
        query = query.join(risk_control).where(risk_control.c.risk_id == risk_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Control.description.ilike(search_pattern)
            | Control.responsible.ilike(search_pattern)
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Control.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    controls = result.scalars().unique().all()

    items = [_control_to_response(c) for c in controls]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/", response_model=ControlResponse, status_code=201)
async def create_control(
    data: ControlCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    control_data = data.model_dump(exclude={"risk_ids"})
    control = Control(**control_data)
    db.add(control)
    await db.flush()

    # Link risks if provided
    if data.risk_ids:
        for rid in data.risk_ids:
            await db.execute(
                risk_control.insert().values(risk_id=rid, control_id=control.id)
            )

    await db.refresh(control, attribute_names=["risks"])
    return _control_to_response(control)


@router.get("/{control_id}", response_model=ControlResponse)
async def get_control(
    control_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Control)
        .options(selectinload(Control.risks))
        .where(Control.id == control_id)
    )
    control = result.scalar_one_or_none()
    if not control:
        raise HTTPException(status_code=404, detail="Controle nao encontrado")
    return _control_to_response(control)


@router.put("/{control_id}", response_model=ControlResponse)
async def update_control(
    control_id: uuid.UUID,
    data: ControlUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Control)
        .options(selectinload(Control.risks))
        .where(Control.id == control_id)
    )
    control = result.scalar_one_or_none()
    if not control:
        raise HTTPException(status_code=404, detail="Controle nao encontrado")

    update_data = data.model_dump(exclude_unset=True, exclude={"risk_ids"})
    for field, value in update_data.items():
        setattr(control, field, value)

    # Update risk links if provided
    if data.risk_ids is not None:
        # Clear existing links
        await db.execute(
            delete(risk_control).where(risk_control.c.control_id == control_id)
        )
        # Add new links
        for rid in data.risk_ids:
            await db.execute(
                risk_control.insert().values(risk_id=rid, control_id=control.id)
            )

    await db.flush()
    await db.refresh(control, attribute_names=["risks"])
    return _control_to_response(control)


@router.delete("/{control_id}", status_code=204)
async def delete_control(
    control_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Control).where(Control.id == control_id))
    control = result.scalar_one_or_none()
    if not control:
        raise HTTPException(status_code=404, detail="Controle nao encontrado")
    # Remove risk links first
    await db.execute(
        delete(risk_control).where(risk_control.c.control_id == control_id)
    )
    await db.delete(control)


@router.post("/{control_id}/risks/{risk_id}", status_code=201)
async def link_control_to_risk(
    control_id: uuid.UUID,
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    # Verify control exists
    result = await db.execute(select(Control).where(Control.id == control_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Controle nao encontrado")

    # Verify risk exists
    result = await db.execute(select(Risk).where(Risk.id == risk_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Risco nao encontrado")

    # Check if link already exists
    existing = await db.execute(
        select(risk_control).where(
            risk_control.c.risk_id == risk_id,
            risk_control.c.control_id == control_id,
        )
    )
    if existing.first():
        raise HTTPException(status_code=409, detail="Vinculo ja existe")

    await db.execute(
        risk_control.insert().values(risk_id=risk_id, control_id=control_id)
    )
    return {"message": "Vinculo criado com sucesso"}


@router.delete("/{control_id}/risks/{risk_id}", status_code=204)
async def unlink_control_from_risk(
    control_id: uuid.UUID,
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        delete(risk_control).where(
            risk_control.c.risk_id == risk_id,
            risk_control.c.control_id == control_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Vinculo nao encontrado")
