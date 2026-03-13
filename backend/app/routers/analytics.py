from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.models.risk_assessment import RiskAssessment
from app.models.control import Control
from app.models.action_plan import ActionPlan
from app.models.risk_control import risk_control
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    empresa_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    # ------ Base filters ------
    risk_filter = []
    control_filter = []
    plan_filter = []
    if empresa_id:
        risk_filter.append(Risk.empresa_id == empresa_id)
        control_filter.append(Control.empresa_id == empresa_id)
        plan_filter.append(ActionPlan.empresa_id == empresa_id)
    if category_id:
        risk_filter.append(Risk.category_id == category_id)

    # ------ Totals ------
    risks_count = await db.scalar(
        select(func.count(Risk.id)).where(*risk_filter) if risk_filter
        else select(func.count(Risk.id))
    )
    controls_count = await db.scalar(
        select(func.count(Control.id)).where(*control_filter) if control_filter
        else select(func.count(Control.id))
    )
    plans_count = await db.scalar(
        select(func.count(ActionPlan.id)).where(*plan_filter) if plan_filter
        else select(func.count(ActionPlan.id))
    )

    # Assessments count – filtered via risk join when category/empresa given
    assess_q = select(func.count(RiskAssessment.id))
    if risk_filter:
        assess_q = assess_q.join(Risk, RiskAssessment.risk_id == Risk.id).where(*risk_filter)
    assessments_count = await db.scalar(assess_q)

    # ------ Risks by category ------
    rbc_q = (
        select(
            func.coalesce(RiskCategory.name, "Sem Categoria").label("category_name"),
            func.count(Risk.id).label("count"),
        )
        .outerjoin(RiskCategory, Risk.category_id == RiskCategory.id)
        .group_by(RiskCategory.name)
        .order_by(func.count(Risk.id).desc())
    )
    if risk_filter:
        rbc_q = rbc_q.where(*risk_filter)
    rbc_rows = (await db.execute(rbc_q)).all()
    risks_by_category = [
        {"category_name": row.category_name, "count": row.count} for row in rbc_rows
    ]

    # ------ Risks by severity (via assessments) ------
    severity_order = ["Critico", "Alto", "Moderado", "Baixo"]
    rbs_q = (
        select(
            RiskAssessment.severity.label("severity"),
            func.count(func.distinct(RiskAssessment.risk_id)).label("count"),
        )
        .group_by(RiskAssessment.severity)
    )
    if risk_filter:
        rbs_q = rbs_q.join(Risk, RiskAssessment.risk_id == Risk.id).where(*risk_filter)
    rbs_rows = (await db.execute(rbs_q)).all()
    rbs_dict = {row.severity: row.count for row in rbs_rows}
    risks_by_severity = [
        {"severity": s, "count": rbs_dict.get(s, 0)} for s in severity_order
    ]

    # ------ Action plans by status ------
    status_labels = ["pendente", "em_andamento", "concluido", "cancelado"]
    aps_q = (
        select(
            ActionPlan.status.label("status"),
            func.count(ActionPlan.id).label("count"),
        )
        .group_by(ActionPlan.status)
    )
    if plan_filter:
        aps_q = aps_q.where(*plan_filter)
    aps_rows = (await db.execute(aps_q)).all()
    aps_dict = {row.status: row.count for row in aps_rows}
    action_plans_by_status = [
        {"status": s, "count": aps_dict.get(s, 0)} for s in status_labels
    ]

    # ------ Controls by type ------
    type_labels = ["preventivo", "detectivo", "corretivo"]
    cbt_q = (
        select(
            Control.type.label("type"),
            func.count(Control.id).label("count"),
        )
        .group_by(Control.type)
    )
    if control_filter:
        cbt_q = cbt_q.where(*control_filter)
    cbt_rows = (await db.execute(cbt_q)).all()
    cbt_dict = {row.type: row.count for row in cbt_rows}
    controls_by_type = [
        {"type": t, "count": cbt_dict.get(t, 0)} for t in type_labels
    ]

    # ------ Controls by effectiveness ------
    eff_labels = ["efetivo", "parcialmente_efetivo", "inefetivo"]
    cbe_q = (
        select(
            func.coalesce(Control.effectiveness, "nao_avaliado").label("effectiveness"),
            func.count(Control.id).label("count"),
        )
        .group_by(Control.effectiveness)
    )
    if control_filter:
        cbe_q = cbe_q.where(*control_filter)
    cbe_rows = (await db.execute(cbe_q)).all()
    cbe_dict = {row.effectiveness: row.count for row in cbe_rows}
    controls_by_effectiveness = [
        {"effectiveness": e, "count": cbe_dict.get(e, 0)} for e in eff_labels
    ]

    return {
        "total_riscos": risks_count or 0,
        "total_controles": controls_count or 0,
        "total_planos_acao": plans_count or 0,
        "total_avaliacoes": assessments_count or 0,
        "risks_by_category": risks_by_category,
        "risks_by_severity": risks_by_severity,
        "action_plans_by_status": action_plans_by_status,
        "controls_by_type": controls_by_type,
        "controls_by_effectiveness": controls_by_effectiveness,
    }


@router.get("/matrix")
async def get_risk_matrix(
    empresa_id: Optional[UUID] = Query(None),
    category_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return a 5x5 risk matrix grid for both inherent and residual assessments."""
    result = {"inherent": [], "residual": []}

    for assessment_type in ("inherent", "residual"):
        # Build query: get assessments grouped by impact/probability
        base_q = (
            select(
                RiskAssessment.impact,
                RiskAssessment.probability,
                Risk.id.label("risk_id"),
                Risk.name.label("risk_name"),
            )
            .join(Risk, RiskAssessment.risk_id == Risk.id)
            .where(RiskAssessment.type == assessment_type)
        )

        if empresa_id:
            base_q = base_q.where(Risk.empresa_id == empresa_id)
        if category_id:
            base_q = base_q.where(Risk.category_id == category_id)

        # For each risk, take the latest assessment of this type
        # Use a subquery to get max assessed_at per risk
        from sqlalchemy import and_

        latest_sq = (
            select(
                RiskAssessment.risk_id,
                func.max(RiskAssessment.assessed_at).label("max_assessed_at"),
            )
            .where(RiskAssessment.type == assessment_type)
            .group_by(RiskAssessment.risk_id)
            .subquery()
        )

        q = (
            select(
                RiskAssessment.impact,
                RiskAssessment.probability,
                Risk.id.label("risk_id"),
                Risk.name.label("risk_name"),
            )
            .join(Risk, RiskAssessment.risk_id == Risk.id)
            .join(
                latest_sq,
                and_(
                    RiskAssessment.risk_id == latest_sq.c.risk_id,
                    RiskAssessment.assessed_at == latest_sq.c.max_assessed_at,
                ),
            )
            .where(RiskAssessment.type == assessment_type)
        )

        if empresa_id:
            q = q.where(Risk.empresa_id == empresa_id)
        if category_id:
            q = q.where(Risk.category_id == category_id)

        rows = (await db.execute(q)).all()

        # Build the 5x5 grid
        grid: dict[tuple[int, int], list[dict]] = {}
        for imp in range(1, 6):
            for prob in range(1, 6):
                grid[(imp, prob)] = []

        for row in rows:
            imp = max(1, min(5, row.impact))
            prob = max(1, min(5, row.probability))
            grid[(imp, prob)].append(
                {"id": str(row.risk_id), "name": row.risk_name}
            )

        cells = []
        for imp in range(1, 6):
            for prob in range(1, 6):
                risks_in_cell = grid[(imp, prob)]
                cells.append(
                    {
                        "impact": imp,
                        "probability": prob,
                        "count": len(risks_in_cell),
                        "risks": risks_in_cell,
                    }
                )

        result[assessment_type] = cells

    return result


@router.get("/drill-tree")
async def get_drill_tree(
    empresa_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return hierarchical tree data: Categories -> Risks -> Controls -> Action Plans."""

    # Fetch all categories (top-level only, parent_id is NULL)
    cat_q = select(RiskCategory).where(RiskCategory.parent_id.is_(None))
    if empresa_id:
        # Categories don't have empresa_id, but we can still filter
        pass
    cat_rows = (await db.execute(cat_q)).scalars().all()

    # Fetch all risks with their controls and action plans
    risk_q = select(Risk).options(
        selectinload(Risk.controls).selectinload(Control.action_plans),
        selectinload(Risk.action_plans),
    )
    if empresa_id:
        risk_q = risk_q.where(Risk.empresa_id == empresa_id)
    risk_rows = (await db.execute(risk_q)).scalars().unique().all()

    # Group risks by category_id
    risks_by_cat: dict = {}
    uncategorized_risks = []
    for r in risk_rows:
        if r.category_id:
            risks_by_cat.setdefault(str(r.category_id), []).append(r)
        else:
            uncategorized_risks.append(r)

    def build_risk_node(r: Risk) -> dict:
        control_nodes = []
        for ctrl in r.controls:
            # Action plans linked to this control
            ap_nodes = [
                {
                    "id": f"ap_{ap.id}",
                    "name": ap.title,
                    "type": "action_plan",
                    "status": ap.status,
                }
                for ap in ctrl.action_plans
            ]
            control_nodes.append({
                "id": f"ctrl_{ctrl.id}",
                "name": ctrl.description[:80] if ctrl.description else "Controle",
                "type": "control",
                "children": ap_nodes,
            })
        # Also include action plans directly linked to the risk (no control)
        for ap in r.action_plans:
            if ap.control_id is None:
                control_nodes.append({
                    "id": f"ap_{ap.id}",
                    "name": ap.title,
                    "type": "action_plan",
                    "status": ap.status,
                })
        return {
            "id": f"risk_{r.id}",
            "name": r.name,
            "type": "risk",
            "children": control_nodes,
        }

    nodes = []
    for cat in cat_rows:
        cat_risks = risks_by_cat.get(str(cat.id), [])
        risk_nodes = [build_risk_node(r) for r in cat_risks]
        nodes.append({
            "id": f"cat_{cat.id}",
            "name": cat.name,
            "type": "category",
            "children": risk_nodes,
        })

    # Add uncategorized risks under a virtual category
    if uncategorized_risks:
        nodes.append({
            "id": "cat_uncategorized",
            "name": "Sem Categoria",
            "type": "category",
            "children": [build_risk_node(r) for r in uncategorized_risks],
        })

    return {"nodes": nodes}


@router.get("/drill-web")
async def get_drill_web(
    empresa_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return network graph data with nodes and links for the drill web visualization."""

    # Fetch risks
    risk_q = select(Risk)
    if empresa_id:
        risk_q = risk_q.where(Risk.empresa_id == empresa_id)
    risk_rows = (await db.execute(risk_q)).scalars().all()
    risk_ids = {str(r.id) for r in risk_rows}

    # Get latest severity per risk from assessments
    severity_sq = (
        select(
            RiskAssessment.risk_id,
            RiskAssessment.severity,
            func.row_number()
            .over(
                partition_by=RiskAssessment.risk_id,
                order_by=RiskAssessment.assessed_at.desc(),
            )
            .label("rn"),
        )
        .subquery()
    )
    sev_q = select(severity_sq.c.risk_id, severity_sq.c.severity).where(
        severity_sq.c.rn == 1
    )
    sev_rows = (await db.execute(sev_q)).all()
    severity_map = {str(row.risk_id): row.severity for row in sev_rows}

    # Fetch risk-control links
    rc_q = select(risk_control)
    rc_rows = (await db.execute(rc_q)).all()

    # Filter to only relevant risks
    relevant_control_ids = set()
    risk_control_links = []
    for row in rc_rows:
        rid = str(row.risk_id)
        cid = str(row.control_id)
        if rid in risk_ids:
            risk_control_links.append((rid, cid))
            relevant_control_ids.add(cid)

    # Fetch controls
    control_q = select(Control)
    if empresa_id:
        control_q = control_q.where(Control.empresa_id == empresa_id)
    control_rows = (await db.execute(control_q)).scalars().all()
    control_map = {str(c.id): c for c in control_rows}
    # Also include controls from risk_control links
    if relevant_control_ids:
        extra_ids = relevant_control_ids - set(control_map.keys())
        if extra_ids:
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            import uuid as uuid_mod
            extra_q = select(Control).where(
                Control.id.in_([uuid_mod.UUID(eid) for eid in extra_ids])
            )
            extra_rows = (await db.execute(extra_q)).scalars().all()
            for c in extra_rows:
                control_map[str(c.id)] = c

    # Fetch action plans
    ap_q = select(ActionPlan)
    if empresa_id:
        ap_q = ap_q.where(ActionPlan.empresa_id == empresa_id)
    ap_rows = (await db.execute(ap_q)).scalars().all()

    # Build nodes
    graph_nodes = []
    for r in risk_rows:
        graph_nodes.append({
            "id": f"risk_{r.id}",
            "name": r.name,
            "type": "risk",
            "severity": severity_map.get(str(r.id), "N/A"),
        })

    added_controls = set()
    for cid, ctrl in control_map.items():
        graph_nodes.append({
            "id": f"ctrl_{ctrl.id}",
            "name": ctrl.description[:80] if ctrl.description else "Controle",
            "type": "control",
        })
        added_controls.add(cid)

    for ap in ap_rows:
        graph_nodes.append({
            "id": f"ap_{ap.id}",
            "name": ap.title,
            "type": "action_plan",
            "status": ap.status,
        })

    # Build links
    links = []
    for rid, cid in risk_control_links:
        if cid in added_controls:
            links.append({
                "source": f"risk_{rid}",
                "target": f"ctrl_{cid}",
                "type": "risk_control",
            })

    for ap in ap_rows:
        if ap.control_id and str(ap.control_id) in added_controls:
            links.append({
                "source": f"ctrl_{ap.control_id}",
                "target": f"ap_{ap.id}",
                "type": "control_action_plan",
            })
        elif ap.risk_id and str(ap.risk_id) in risk_ids:
            links.append({
                "source": f"risk_{ap.risk_id}",
                "target": f"ap_{ap.id}",
                "type": "risk_action_plan",
            })

    return {"nodes": graph_nodes, "links": links}


@router.get("/summary")
async def get_summary(
    empresa_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return pipeline summary statistics for the Resumos view."""

    # --- Base filters ---
    risk_filter = []
    control_filter = []
    plan_filter = []
    if empresa_id:
        risk_filter.append(Risk.empresa_id == empresa_id)
        control_filter.append(Control.empresa_id == empresa_id)
        plan_filter.append(ActionPlan.empresa_id == empresa_id)

    def _where(q, filters):
        return q.where(*filters) if filters else q

    # --- Totals ---
    total_risks = await db.scalar(_where(select(func.count(Risk.id)), risk_filter)) or 0
    total_controls = await db.scalar(_where(select(func.count(Control.id)), control_filter)) or 0
    total_action_plans = await db.scalar(_where(select(func.count(ActionPlan.id)), plan_filter)) or 0

    # --- Risks with / without controls ---
    rc_risk_ids_q = select(func.distinct(risk_control.c.risk_id))
    if empresa_id:
        rc_risk_ids_q = rc_risk_ids_q.join(Risk, risk_control.c.risk_id == Risk.id).where(
            Risk.empresa_id == empresa_id
        )
    risks_with_controls = await db.scalar(
        select(func.count()).select_from(rc_risk_ids_q.subquery())
    ) or 0
    risks_without_controls = total_risks - risks_with_controls

    # --- Controls with / without action plans ---
    ctrl_with_ap_q = select(func.count(func.distinct(ActionPlan.control_id))).where(
        ActionPlan.control_id.isnot(None)
    )
    if plan_filter:
        ctrl_with_ap_q = ctrl_with_ap_q.where(*plan_filter)
    controls_with_action_plans = await db.scalar(ctrl_with_ap_q) or 0
    controls_without_action_plans = total_controls - controls_with_action_plans

    # --- Action plans by status ---
    aps_q = (
        select(ActionPlan.status, func.count(ActionPlan.id).label("count"))
        .group_by(ActionPlan.status)
    )
    if plan_filter:
        aps_q = aps_q.where(*plan_filter)
    aps_rows = (await db.execute(aps_q)).all()
    aps_dict = {row.status: row.count for row in aps_rows}
    action_plans_pending = aps_dict.get("pendente", 0)
    action_plans_in_progress = aps_dict.get("em_andamento", 0)
    action_plans_completed = aps_dict.get("concluido", 0)

    # --- Risks by criticality (via latest assessments) ---
    severity_order = ["Critico", "Alto", "Moderado", "Baixo"]
    rbs_q = (
        select(
            RiskAssessment.severity.label("level"),
            func.count(func.distinct(RiskAssessment.risk_id)).label("count"),
        )
        .group_by(RiskAssessment.severity)
    )
    if risk_filter:
        rbs_q = rbs_q.join(Risk, RiskAssessment.risk_id == Risk.id).where(*risk_filter)
    rbs_rows = (await db.execute(rbs_q)).all()
    rbs_dict = {row.level: row.count for row in rbs_rows}
    risks_by_criticality = [
        {"level": s, "count": rbs_dict.get(s, 0)} for s in severity_order
    ]

    # --- Risks with assessments ---
    risks_with_assess_q = select(func.count(func.distinct(RiskAssessment.risk_id)))
    if risk_filter:
        risks_with_assess_q = risks_with_assess_q.join(
            Risk, RiskAssessment.risk_id == Risk.id
        ).where(*risk_filter)
    risks_with_assessments = await db.scalar(risks_with_assess_q) or 0

    # --- Pipeline flow ---
    pipeline_flow = {
        "risks_total": total_risks,
        "risks_with_assessments": risks_with_assessments,
        "controls_total": total_controls,
        "action_plans_total": total_action_plans,
    }

    return {
        "total_risks": total_risks,
        "total_controls": total_controls,
        "total_action_plans": total_action_plans,
        "risks_with_controls": risks_with_controls,
        "risks_without_controls": risks_without_controls,
        "controls_with_action_plans": controls_with_action_plans,
        "controls_without_action_plans": controls_without_action_plans,
        "action_plans_pending": action_plans_pending,
        "action_plans_in_progress": action_plans_in_progress,
        "action_plans_completed": action_plans_completed,
        "risks_by_criticality": risks_by_criticality,
        "pipeline_flow": pipeline_flow,
    }
