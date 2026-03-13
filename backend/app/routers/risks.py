import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.models.risk_assessment import RiskAssessment
from app.models.risk_factor import RiskFactor
from app.models.user import User
from app.models.risk_assessment import compute_severity
from app.schemas.risk import (
    RiskCategoryCreate,
    RiskCategoryResponse,
    RiskCategoryTreeResponse,
    RiskCreate,
    RiskUpdate,
    RiskResponse,
    RiskListResponse,
    RiskAssessmentCreate,
    RiskAssessmentUpdate,
    RiskAssessmentResponse,
    RiskAssessmentSummaryItem,
    RiskAssessmentSummaryResponse,
    RiskFactorCreate,
    RiskFactorUpdate,
    RiskFactorResponse,
    RiskFactorListResponse,
)

router = APIRouter(prefix="/risks", tags=["risks"])


# --- Risk Categories ---
@router.get("/categories", response_model=list[RiskCategoryTreeResponse])
async def list_categories_tree(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return all categories as a tree structure (root nodes with children)."""
    result = await db.execute(
        select(RiskCategory)
        .options(selectinload(RiskCategory.children))
        .order_by(RiskCategory.name)
    )
    all_categories = result.scalars().unique().all()

    # Build tree: only root nodes (parent_id is None), children loaded via relationship
    # We need to build a map and assemble manually for deep nesting support
    cat_map: dict[uuid.UUID, dict] = {}
    for cat in all_categories:
        cat_map[cat.id] = {
            "id": cat.id,
            "name": cat.name,
            "parent_id": cat.parent_id,
            "created_at": cat.created_at,
            "children": [],
        }

    roots = []
    for cat in all_categories:
        node = cat_map[cat.id]
        if cat.parent_id is None:
            roots.append(node)
        elif cat.parent_id in cat_map:
            cat_map[cat.parent_id]["children"].append(node)

    # Sort roots and children by name
    roots.sort(key=lambda x: x["name"])
    for node in cat_map.values():
        node["children"].sort(key=lambda x: x["name"])

    return roots


@router.post("/categories", response_model=RiskCategoryResponse, status_code=201)
async def create_category(
    data: RiskCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    category = RiskCategory(**data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


# --- Risks CRUD ---
@router.get("/", response_model=RiskListResponse)
async def list_risks(
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List risks with optional category filter, search, and pagination."""
    query = select(Risk)

    if category_id is not None:
        # Also include risks from child categories
        child_result = await db.execute(
            select(RiskCategory.id).where(RiskCategory.parent_id == category_id)
        )
        child_ids = [row[0] for row in child_result.all()]
        all_category_ids = [category_id] + child_ids
        query = query.where(Risk.category_id.in_(all_category_ids))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Risk.name.ilike(search_pattern),
                Risk.description.ilike(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Risk.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/", response_model=RiskResponse, status_code=201)
async def create_risk(
    data: RiskCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    risk = Risk(**data.model_dump())
    db.add(risk)
    await db.flush()
    await db.refresh(risk)
    return risk


@router.get("/{risk_id}", response_model=RiskResponse)
async def get_risk(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Risk).where(Risk.id == risk_id))
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risco nao encontrado")
    return risk


@router.put("/{risk_id}", response_model=RiskResponse)
async def update_risk(
    risk_id: uuid.UUID,
    data: RiskUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Risk).where(Risk.id == risk_id))
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risco nao encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(risk, field, value)

    await db.flush()
    await db.refresh(risk)
    return risk


@router.delete("/{risk_id}", status_code=204)
async def delete_risk(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Risk).where(Risk.id == risk_id))
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risco nao encontrado")
    await db.delete(risk)


# --- Risk Assessments ---
@router.get("/assessments/summary", response_model=RiskAssessmentSummaryResponse)
async def get_assessments_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return a summary of all risks with their latest inherent and residual assessments."""
    # Get all risks with their category
    risks_result = await db.execute(
        select(Risk).options(selectinload(Risk.category)).order_by(Risk.name)
    )
    all_risks = risks_result.scalars().unique().all()

    # Get all assessments
    assessments_result = await db.execute(
        select(RiskAssessment).order_by(RiskAssessment.assessed_at.desc())
    )
    all_assessments = assessments_result.scalars().all()

    # Group assessments by risk_id and type, keeping latest
    latest: dict[tuple, RiskAssessment] = {}
    for a in all_assessments:
        key = (a.risk_id, a.type)
        if key not in latest:
            latest[key] = a

    items = []
    severity_counts: dict[str, int] = {
        "Critico": 0,
        "Alto": 0,
        "Moderado": 0,
        "Baixo": 0,
    }

    for risk in all_risks:
        inherent = latest.get((risk.id, "inherent"))
        residual = latest.get((risk.id, "residual"))

        item = RiskAssessmentSummaryItem(
            risk_id=risk.id,
            risk_name=risk.name,
            category_name=risk.category.name if risk.category else None,
            inherent_impact=inherent.impact if inherent else None,
            inherent_probability=inherent.probability if inherent else None,
            inherent_score=inherent.score if inherent else None,
            inherent_severity=inherent.severity if inherent else None,
            residual_impact=residual.impact if residual else None,
            residual_probability=residual.probability if residual else None,
            residual_score=residual.score if residual else None,
            residual_severity=residual.severity if residual else None,
        )
        items.append(item)

        # Count by highest severity (inherent takes priority)
        sev = (inherent.severity if inherent else None) or (
            residual.severity if residual else None
        )
        if sev and sev in severity_counts:
            severity_counts[sev] += 1

    return RiskAssessmentSummaryResponse(
        items=items, severity_counts=severity_counts
    )


@router.get("/{risk_id}/assessments", response_model=list[RiskAssessmentResponse])
async def list_assessments(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(RiskAssessment)
        .where(RiskAssessment.risk_id == risk_id)
        .order_by(RiskAssessment.assessed_at.desc())
    )
    return result.scalars().all()


@router.post("/assessments", response_model=RiskAssessmentResponse, status_code=201)
async def create_assessment(
    data: RiskAssessmentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    score = data.impact * data.probability
    severity = compute_severity(score)
    assessment = RiskAssessment(
        **data.model_dump(), score=score, severity=severity
    )
    db.add(assessment)
    await db.flush()
    await db.refresh(assessment)
    return assessment


@router.put("/assessments/{assessment_id}", response_model=RiskAssessmentResponse)
async def update_assessment(
    assessment_id: uuid.UUID,
    data: RiskAssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(RiskAssessment).where(RiskAssessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Avaliacao nao encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assessment, field, value)

    # Recompute score and severity if impact or probability changed
    assessment.score = assessment.impact * assessment.probability
    assessment.severity = compute_severity(assessment.score)

    await db.flush()
    await db.refresh(assessment)
    return assessment


# --- Risk Factors ---
@router.get("/factors/all", response_model=RiskFactorListResponse)
async def list_all_factors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List all risk factors with pagination."""
    query = select(RiskFactor).options(selectinload(RiskFactor.risk))

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                RiskFactor.name.ilike(search_pattern),
                RiskFactor.description.ilike(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(RiskFactor.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    factors = result.scalars().unique().all()

    items = []
    for f in factors:
        items.append(RiskFactorResponse(
            id=f.id,
            name=f.name,
            description=f.description,
            risk_id=f.risk_id,
            category=f.category,
            risk_name=f.risk.name if f.risk else None,
            created_at=f.created_at,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{risk_id}/factors", response_model=list[RiskFactorResponse])
async def list_factors_for_risk(
    risk_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List all factors for a specific risk."""
    result = await db.execute(
        select(RiskFactor)
        .options(selectinload(RiskFactor.risk))
        .where(RiskFactor.risk_id == risk_id)
        .order_by(RiskFactor.created_at.asc())
    )
    factors = result.scalars().unique().all()

    items = []
    for f in factors:
        items.append(RiskFactorResponse(
            id=f.id,
            name=f.name,
            description=f.description,
            risk_id=f.risk_id,
            category=f.category,
            risk_name=f.risk.name if f.risk else None,
            created_at=f.created_at,
        ))
    return items


@router.post("/factors", response_model=RiskFactorResponse, status_code=201)
async def create_factor(
    data: RiskFactorCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    # Verify risk exists
    risk_result = await db.execute(select(Risk).where(Risk.id == data.risk_id))
    risk = risk_result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risco nao encontrado")

    factor = RiskFactor(**data.model_dump())
    db.add(factor)
    await db.flush()
    await db.refresh(factor)
    return RiskFactorResponse(
        id=factor.id,
        name=factor.name,
        description=factor.description,
        risk_id=factor.risk_id,
        category=factor.category,
        risk_name=risk.name,
        created_at=factor.created_at,
    )


@router.put("/factors/{factor_id}", response_model=RiskFactorResponse)
async def update_factor(
    factor_id: uuid.UUID,
    data: RiskFactorUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(RiskFactor)
        .options(selectinload(RiskFactor.risk))
        .where(RiskFactor.id == factor_id)
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=404, detail="Fator de risco nao encontrado")

    update_data = data.model_dump(exclude_unset=True)

    # If risk_id is being changed, verify the new risk exists
    if "risk_id" in update_data and update_data["risk_id"] is not None:
        risk_result = await db.execute(
            select(Risk).where(Risk.id == update_data["risk_id"])
        )
        if not risk_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Risco nao encontrado")

    for field, value in update_data.items():
        setattr(factor, field, value)

    await db.flush()
    await db.refresh(factor, ["risk"])

    return RiskFactorResponse(
        id=factor.id,
        name=factor.name,
        description=factor.description,
        risk_id=factor.risk_id,
        category=factor.category,
        risk_name=factor.risk.name if factor.risk else None,
        created_at=factor.created_at,
    )


@router.delete("/factors/{factor_id}", status_code=204)
async def delete_factor(
    factor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(RiskFactor).where(RiskFactor.id == factor_id)
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=404, detail="Fator de risco nao encontrado")
    await db.delete(factor)
