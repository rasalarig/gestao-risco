import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.models.action_plan import ActionPlan
from app.models.user import User
from app.schemas.action_plan import (
    ActionPlanCreate,
    ActionPlanUpdate,
    ActionPlanResponse,
    ActionPlanListResponse,
    ActionPlanSummaryResponse,
)

router = APIRouter(prefix="/action-plans", tags=["action-plans"])


@router.get("/summary", response_model=ActionPlanSummaryResponse)
async def get_action_plans_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return counts of action plans grouped by status."""
    result = await db.execute(
        select(ActionPlan.status, func.count(ActionPlan.id)).group_by(
            ActionPlan.status
        )
    )
    rows = result.all()

    counts = {
        "pendente": 0,
        "em_andamento": 0,
        "concluido": 0,
        "cancelado": 0,
    }
    total = 0
    for status, count in rows:
        if status in counts:
            counts[status] = count
        total += count

    return ActionPlanSummaryResponse(
        pendente=counts["pendente"],
        em_andamento=counts["em_andamento"],
        concluido=counts["concluido"],
        cancelado=counts["cancelado"],
        total=total,
    )


@router.get("/", response_model=ActionPlanListResponse)
async def list_action_plans(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    risk_id: Optional[uuid.UUID] = Query(None, description="Filter by risk"),
    control_id: Optional[uuid.UUID] = Query(None, description="Filter by control"),
    search: Optional[str] = Query(
        None, description="Search by title, description or responsible"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List action plans with filters, search, and pagination."""
    query = select(ActionPlan)

    if status:
        query = query.where(ActionPlan.status == status)

    if priority:
        query = query.where(ActionPlan.priority == priority)

    if risk_id is not None:
        query = query.where(ActionPlan.risk_id == risk_id)

    if control_id is not None:
        query = query.where(ActionPlan.control_id == control_id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                ActionPlan.title.ilike(search_pattern),
                ActionPlan.description.ilike(search_pattern),
                ActionPlan.responsible.ilike(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(ActionPlan.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/", response_model=ActionPlanResponse, status_code=201)
async def create_action_plan(
    data: ActionPlanCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    plan = ActionPlan(**data.model_dump())
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=ActionPlanResponse)
async def get_action_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(ActionPlan).where(ActionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de acao nao encontrado")
    return plan


@router.put("/{plan_id}", response_model=ActionPlanResponse)
async def update_action_plan(
    plan_id: uuid.UUID,
    data: ActionPlanUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(ActionPlan).where(ActionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de acao nao encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.flush()
    await db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
async def delete_action_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(ActionPlan).where(ActionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de acao nao encontrado")
    await db.delete(plan)
