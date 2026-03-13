"""
Seed script for GRC Pro Platform.

Populates the database with realistic sample data in Portuguese (pt-BR).
Idempotent: checks if data already exists before creating.

Usage:
    cd backend && source venv/bin/activate && python seed.py
"""

import asyncio
import sys
import uuid
from datetime import date, timedelta

from sqlalchemy import select, insert, func

# Ensure app package is importable
sys.path.insert(0, ".")

from app.database import async_session, engine, Base
from app.models.empresa import Empresa
from app.models.risk_category import RiskCategory
from app.models.risk import Risk
from app.models.risk_assessment import RiskAssessment, compute_severity
from app.models.control import Control
from app.models.risk_control import risk_control
from app.models.action_plan import ActionPlan
from app.models.risk_factor import RiskFactor


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def print_step(msg: str):
    print(f"  -> {msg}")


# ---------------------------------------------------------------------------
# 1. Empresa
# ---------------------------------------------------------------------------

async def ensure_empresa(session) -> uuid.UUID:
    result = await session.execute(
        select(Empresa).where(Empresa.cnpj == "00.000.000/0001-00")
    )
    empresa = result.scalar_one_or_none()
    if empresa:
        print_step(f"Empresa ja existe: {empresa.name} (id={empresa.id})")
        return empresa.id

    empresa = Empresa(name="Empresa Demonstracao", cnpj="00.000.000/0001-00")
    session.add(empresa)
    await session.flush()
    print_step(f"Empresa criada: {empresa.name} (id={empresa.id})")
    return empresa.id


# ---------------------------------------------------------------------------
# 2. Risk Categories
# ---------------------------------------------------------------------------

CATEGORIES_DATA = {
    "ESTRATEGIA": ["Objetivos Estrategicos", "Planejamento"],
    "GESTAO": ["Gestao de Pessoas", "Gestao Financeira"],
    "OPERACIONAL": ["Processos", "Producao", "Logistica"],
    "FINANCEIRO": ["Credito", "Mercado", "Liquidez"],
    "COMPLIANCE": ["Regulatorio", "Legal"],
    "TECNOLOGIA DA INFORMACAO": ["Seguranca da Informacao", "Infraestrutura"],
    "IMAGEM E REPUTACAO": [],
    "SOCIOAMBIENTAL": [],
}


async def ensure_categories(session) -> dict[str, uuid.UUID]:
    """Return mapping of category name -> id, creating if needed."""
    result = await session.execute(select(RiskCategory))
    existing = {cat.name: cat.id for cat in result.scalars().all()}

    if existing:
        print_step(f"Categorias ja existem ({len(existing)} encontradas)")
    else:
        for parent_name, children_names in CATEGORIES_DATA.items():
            parent = RiskCategory(name=parent_name)
            session.add(parent)
            await session.flush()
            existing[parent.name] = parent.id

            for child_name in children_names:
                child = RiskCategory(name=child_name, parent_id=parent.id)
                session.add(child)
                await session.flush()
                existing[child.name] = child.id

        print_step(f"Criadas {len(existing)} categorias de risco")

    return existing


# ---------------------------------------------------------------------------
# 3. Risks
# ---------------------------------------------------------------------------

# (risk_name, description, category_name_key, area, responsible)
RISKS_DATA = [
    # ESTRATEGIA
    ("Risco de desalinhamento estrategico",
     "Desalinhamento entre a estrategia corporativa e as acoes operacionais",
     "ESTRATEGIA", "Diretoria", "Diretor Executivo"),
    ("Risco de mudanca no ambiente competitivo",
     "Alteracoes no cenario competitivo que impactam o posicionamento da empresa",
     "ESTRATEGIA", "Planejamento Estrategico", "VP de Estrategia"),
    ("Risco de falha na execucao do planejamento",
     "Incapacidade de executar o plano estrategico conforme previsto",
     "ESTRATEGIA", "Planejamento Estrategico", "Gerente de Projetos"),
    # GESTAO
    ("Risco de perda de talentos-chave",
     "Saida de profissionais essenciais para a operacao",
     "GESTAO", "Recursos Humanos", "Diretor de RH"),
    ("Risco de gestao financeira inadequada",
     "Falhas nos processos de gestao financeira e orcamentaria",
     "GESTAO", "Financeiro", "CFO"),
    ("Risco de conflito de interesses",
     "Situacoes de conflito de interesse entre colaboradores e a empresa",
     "GESTAO", "Compliance", "Diretor de Compliance"),
    # OPERACIONAL
    ("Risco de falha em processos criticos",
     "Interrupcao ou falha em processos operacionais essenciais",
     "OPERACIONAL", "Operacoes", "Diretor de Operacoes"),
    ("Risco de interrupcao da cadeia produtiva",
     "Parada na cadeia de producao por fatores internos ou externos",
     "OPERACIONAL", "Producao", "Gerente de Producao"),
    ("Risco de ineficiencia logistica",
     "Problemas na logistica que geram atrasos e custos adicionais",
     "OPERACIONAL", "Logistica", "Gerente de Logistica"),
    ("Risco de qualidade do produto",
     "Produto final nao atende aos padroes de qualidade exigidos",
     "OPERACIONAL", "Qualidade", "Gerente de Qualidade"),
    # FINANCEIRO
    ("Risco de credito de contrapartes",
     "Inadimplencia de clientes ou parceiros comerciais",
     "FINANCEIRO", "Financeiro", "Gerente de Credito"),
    ("Risco de variacao cambial",
     "Exposicao a variacoes nas taxas de cambio",
     "FINANCEIRO", "Tesouraria", "Tesoureiro"),
    ("Risco de liquidez insuficiente",
     "Falta de recursos financeiros para honrar compromissos",
     "FINANCEIRO", "Tesouraria", "CFO"),
    ("Risco de fraude financeira",
     "Atos fraudulentos que causam perdas financeiras",
     "FINANCEIRO", "Auditoria Interna", "Auditor Chefe"),
    # COMPLIANCE
    ("Risco de nao conformidade regulatoria",
     "Descumprimento de normas e regulamentos aplicaveis",
     "COMPLIANCE", "Compliance", "Diretor de Compliance"),
    ("Risco de sancoes legais",
     "Risco de sofrer sancoes por descumprimento legal",
     "COMPLIANCE", "Juridico", "Diretor Juridico"),
    ("Risco de violacao da LGPD",
     "Tratamento inadequado de dados pessoais em desacordo com a LGPD",
     "COMPLIANCE", "Protecao de Dados", "DPO"),
    ("Risco de multas e penalidades",
     "Aplicacao de multas por orgaos reguladores",
     "COMPLIANCE", "Compliance", "Gerente de Compliance"),
    # TECNOLOGIA DA INFORMACAO
    ("Risco de ataque cibernetico",
     "Ataques maliciosos a infraestrutura de TI da empresa",
     "TECNOLOGIA DA INFORMACAO", "Seguranca da Informacao", "CISO"),
    ("Risco de indisponibilidade de sistemas",
     "Sistemas criticos ficam indisponiveis por falhas tecnicas",
     "TECNOLOGIA DA INFORMACAO", "Infraestrutura de TI", "Gerente de TI"),
    ("Risco de perda de dados",
     "Perda de dados criticos por falhas ou incidentes",
     "TECNOLOGIA DA INFORMACAO", "Infraestrutura de TI", "Gerente de TI"),
    ("Risco de falha na infraestrutura",
     "Falhas em hardware, rede ou servicos de infraestrutura",
     "TECNOLOGIA DA INFORMACAO", "Infraestrutura de TI", "Gerente de Infraestrutura"),
    # IMAGEM E REPUTACAO
    ("Risco reputacional",
     "Danos a reputacao da empresa perante stakeholders",
     "IMAGEM E REPUTACAO", "Comunicacao", "Diretor de Comunicacao"),
    ("Risco de crise de imagem",
     "Evento que gera crise de imagem publica",
     "IMAGEM E REPUTACAO", "Comunicacao", "Gerente de Comunicacao"),
    # SOCIOAMBIENTAL
    ("Risco ambiental",
     "Impactos ambientais decorrentes das atividades da empresa",
     "SOCIOAMBIENTAL", "Sustentabilidade", "Gerente de Sustentabilidade"),
    ("Risco de impacto social negativo",
     "Acoes da empresa que geram impacto social adverso",
     "SOCIOAMBIENTAL", "Responsabilidade Social", "Gerente de RSC"),
]


async def ensure_risks(session, categories: dict, empresa_id: uuid.UUID) -> list[tuple[str, uuid.UUID]]:
    """Create risks, return list of (name, id)."""
    result = await session.execute(select(func.count()).select_from(Risk))
    count = result.scalar()
    if count and count >= 25:
        print_step(f"Riscos ja existem ({count} encontrados)")
        result = await session.execute(select(Risk.name, Risk.id))
        return result.all()

    risk_list = []
    for name, desc, cat_key, area, responsible in RISKS_DATA:
        cat_id = categories.get(cat_key)
        risk = Risk(
            name=name,
            description=desc,
            category_id=cat_id,
            area=area,
            responsible=responsible,
            status="aberto",
            empresa_id=empresa_id,
        )
        session.add(risk)
        await session.flush()
        risk_list.append((risk.name, risk.id))

    print_step(f"Criados {len(risk_list)} riscos")
    return risk_list


# ---------------------------------------------------------------------------
# 4. Risk Assessments (inherent + residual per risk)
# ---------------------------------------------------------------------------

# Pre-defined assessment data: (inherent_impact, inherent_prob, residual_impact, residual_prob)
ASSESSMENT_PROFILES = [
    (5, 4, 3, 2),   # High -> Medium
    (4, 5, 3, 3),   # High -> Medium
    (5, 5, 4, 3),   # Critical -> High
    (4, 4, 3, 2),   # High -> Medium
    (3, 4, 2, 3),   # Medium -> Medium-Low
    (4, 3, 3, 2),   # Medium -> Low-Med
    (5, 3, 3, 2),   # High -> Medium-Low
    (4, 4, 2, 2),   # High -> Low
    (3, 3, 2, 2),   # Medium -> Low
    (3, 2, 2, 1),   # Low-Med -> Low
    (5, 4, 4, 2),   # High -> Medium
    (4, 3, 3, 2),   # Medium -> Medium-Low
    (3, 4, 2, 2),   # Medium -> Low
    (5, 5, 3, 3),   # Critical -> Medium
    (4, 5, 3, 2),   # High -> Medium-Low
    (4, 4, 3, 3),   # High -> Medium
    (5, 4, 3, 2),   # High -> Medium-Low
    (4, 3, 2, 2),   # Medium -> Low
    (5, 5, 4, 4),   # Critical -> High
    (5, 4, 3, 3),   # High -> Medium
    (4, 5, 3, 2),   # High -> Medium-Low
    (5, 3, 4, 2),   # High -> Medium
    (4, 4, 3, 2),   # High -> Medium-Low
    (3, 3, 2, 2),   # Medium -> Low
    (4, 3, 3, 2),   # Medium -> Medium-Low
    (3, 2, 2, 1),   # Low-Med -> Low
]


async def ensure_assessments(session, risks: list[tuple[str, uuid.UUID]]):
    result = await session.execute(select(func.count()).select_from(RiskAssessment))
    count = result.scalar()
    if count and count >= 50:
        print_step(f"Avaliacoes ja existem ({count} encontradas)")
        return

    created = 0
    for idx, (risk_name, risk_id) in enumerate(risks):
        profile = ASSESSMENT_PROFILES[idx % len(ASSESSMENT_PROFILES)]
        inh_impact, inh_prob, res_impact, res_prob = profile

        # Inherent
        inh_score = inh_impact * inh_prob
        session.add(RiskAssessment(
            risk_id=risk_id,
            type="inherent",
            impact=inh_impact,
            probability=inh_prob,
            score=float(inh_score),
            severity=compute_severity(inh_score),
            notes="Avaliacao de risco inerente",
            assessed_by="Equipe de Riscos",
        ))

        # Residual
        res_score = res_impact * res_prob
        session.add(RiskAssessment(
            risk_id=risk_id,
            type="residual",
            impact=res_impact,
            probability=res_prob,
            score=float(res_score),
            severity=compute_severity(res_score),
            notes="Avaliacao de risco residual apos controles",
            assessed_by="Equipe de Riscos",
        ))
        created += 2

    await session.flush()
    print_step(f"Criadas {created} avaliacoes de risco (inerente + residual)")


# ---------------------------------------------------------------------------
# 5. Controls
# ---------------------------------------------------------------------------

# (description, type, frequency, responsible, effectiveness)
CONTROLS_DATA = [
    ("Revisao periodica do planejamento estrategico", "preventivo", "trimestral", "Diretor Executivo", "efetivo"),
    ("Monitoramento de indicadores de desempenho", "detectivo", "mensal", "Gerente de Planejamento", "efetivo"),
    ("Programa de retencao de talentos", "preventivo", "anual", "Diretor de RH", "parcialmente_efetivo"),
    ("Auditoria interna financeira", "detectivo", "trimestral", "Auditor Chefe", "efetivo"),
    ("Controle de acesso a sistemas", "preventivo", "diario", "CISO", "efetivo"),
    ("Backup e recuperacao de dados", "preventivo", "diario", "Gerente de TI", "efetivo"),
    ("Firewall e antivirus", "preventivo", "diario", "CISO", "efetivo"),
    ("Programa de compliance", "preventivo", "mensal", "Diretor de Compliance", "efetivo"),
    ("Treinamento de seguranca da informacao", "preventivo", "anual", "CISO", "parcialmente_efetivo"),
    ("Monitoramento de riscos operacionais", "detectivo", "semanal", "Gerente de Operacoes", "efetivo"),
    ("Gestao de vulnerabilidades", "detectivo", "mensal", "CISO", "parcialmente_efetivo"),
    ("Plano de continuidade de negocios", "corretivo", "anual", "Diretor de Operacoes", "parcialmente_efetivo"),
    ("Revisao de contratos", "preventivo", "trimestral", "Diretor Juridico", "efetivo"),
    ("Controle de qualidade", "detectivo", "diario", "Gerente de Qualidade", "efetivo"),
    ("Gestao de terceiros", "preventivo", "trimestral", "Gerente de Compras", "parcialmente_efetivo"),
    ("Politica de seguranca da informacao", "preventivo", "anual", "CISO", "efetivo"),
    ("Monitoramento de midias e reputacao", "detectivo", "diario", "Gerente de Comunicacao", "efetivo"),
    ("Gestao ambiental", "preventivo", "mensal", "Gerente de Sustentabilidade", "parcialmente_efetivo"),
    ("Canal de denuncias", "detectivo", "diario", "Diretor de Compliance", "efetivo"),
    ("Comite de riscos", "preventivo", "mensal", "Diretor Executivo", "efetivo"),
]


async def ensure_controls(session, empresa_id: uuid.UUID) -> list[tuple[str, uuid.UUID]]:
    result = await session.execute(select(func.count()).select_from(Control))
    count = result.scalar()
    if count and count >= 20:
        print_step(f"Controles ja existem ({count} encontrados)")
        result = await session.execute(select(Control.description, Control.id))
        return result.all()

    control_list = []
    for desc, ctrl_type, freq, responsible, effectiveness in CONTROLS_DATA:
        ctrl = Control(
            description=desc,
            type=ctrl_type,
            frequency=freq,
            responsible=responsible,
            effectiveness=effectiveness,
            empresa_id=empresa_id,
        )
        session.add(ctrl)
        await session.flush()
        control_list.append((ctrl.description, ctrl.id))

    print_step(f"Criados {len(control_list)} controles")
    return control_list


# ---------------------------------------------------------------------------
# 5b. Risk-Control links
# ---------------------------------------------------------------------------

# Maps control index -> list of risk indices to link
RISK_CONTROL_LINKS = {
    0: [0, 1, 2],       # Revisao planejamento -> riscos estrategicos
    1: [0, 2, 6],       # Indicadores desempenho -> estrategia + operacional
    2: [3],             # Retencao talentos -> perda talentos
    3: [4, 10, 13],     # Auditoria financeira -> gestao financeira, credito, fraude
    4: [18, 19, 20],    # Controle acesso -> TI risks
    5: [20, 21],        # Backup -> perda de dados, falha infra
    6: [18, 21],        # Firewall -> ataque cibernetico, falha infra
    7: [5, 14, 15, 17], # Compliance -> conflito, conformidade, sancoes, multas
    8: [18, 19, 20],    # Treinamento seg -> TI risks
    9: [6, 7, 8, 9],    # Monitoramento operacional -> riscos operacionais
    10: [18, 19],       # Gestao vulnerabilidades -> ataque cibernetico, indisponibilidade
    11: [6, 7, 19],     # Continuidade negocios -> processos, cadeia, indisponibilidade
    12: [5, 15],        # Revisao contratos -> conflito, sancoes
    13: [9],            # Controle qualidade -> qualidade produto
    14: [7, 8],         # Gestao terceiros -> cadeia produtiva, logistica
    15: [18, 19, 20, 21],  # Politica seg info -> todos TI
    16: [22, 23],       # Monitoramento midias -> reputacional, crise imagem
    17: [24, 25],       # Gestao ambiental -> ambiental, impacto social
    18: [5, 13, 14],    # Canal denuncias -> conflito, fraude, conformidade
    19: [0, 1, 6, 10],  # Comite riscos -> estrategia, operacional, financeiro
}


async def ensure_risk_control_links(session, risks: list, controls: list):
    result = await session.execute(select(func.count()).select_from(risk_control))
    count = result.scalar()
    if count and count >= 10:
        print_step(f"Links risco-controle ja existem ({count} encontrados)")
        return

    created = 0
    for ctrl_idx, risk_indices in RISK_CONTROL_LINKS.items():
        if ctrl_idx >= len(controls):
            continue
        ctrl_id = controls[ctrl_idx][1]
        for risk_idx in risk_indices:
            if risk_idx >= len(risks):
                continue
            risk_id = risks[risk_idx][1]
            await session.execute(
                insert(risk_control).values(risk_id=risk_id, control_id=ctrl_id)
            )
            created += 1

    await session.flush()
    print_step(f"Criados {created} links risco-controle")


# ---------------------------------------------------------------------------
# 6. Action Plans
# ---------------------------------------------------------------------------

TODAY = date.today()

# (title, description, responsible, status, priority, risk_idx, control_idx_or_none)
ACTION_PLANS_DATA = [
    # Pendente (~8)
    ("Implementar sistema de gestao de riscos integrado",
     "Aquisicao e implantacao de ferramenta GRC integrada", "Gerente de TI",
     "pendente", "alta", 0, 19),
    ("Revisar politica de seguranca da informacao",
     "Atualizacao completa da politica de seguranca", "CISO",
     "pendente", "alta", 18, 15),
    ("Atualizar programa de compliance",
     "Revisao e atualizacao do programa de compliance corporativo", "Diretor de Compliance",
     "pendente", "alta", 14, 7),
    ("Realizar treinamento de conscientizacao",
     "Programa de treinamento para todos os colaboradores sobre riscos", "RH",
     "pendente", "media", 3, 2),
    ("Contratar consultoria de ciberseguranca",
     "Avaliacao externa de vulnerabilidades e pentest", "CISO",
     "pendente", "alta", 18, 10),
    ("Implantar programa de gestao de terceiros",
     "Desenvolvimento de framework para avaliacao de fornecedores", "Gerente de Compras",
     "pendente", "media", 7, 14),
    ("Revisar matriz de riscos operacionais",
     "Atualizacao da matriz de riscos dos processos operacionais", "Gerente de Operacoes",
     "pendente", "media", 6, 9),
    ("Elaborar plano de comunicacao de crise",
     "Desenvolver procedimentos para comunicacao em situacoes de crise", "Gerente de Comunicacao",
     "pendente", "media", 22, 16),

    # Em Andamento (~8)
    ("Implantar solucao de backup em nuvem",
     "Migracao do backup local para solucao em nuvem", "Gerente de TI",
     "em_andamento", "alta", 20, 5),
    ("Desenvolver plano de continuidade",
     "Elaboracao do BCP/DRP para processos criticos", "Diretor de Operacoes",
     "em_andamento", "alta", 6, 11),
    ("Implementar gestao de vulnerabilidades",
     "Implantacao de ferramenta de scan de vulnerabilidades", "CISO",
     "em_andamento", "alta", 19, 10),
    ("Atualizar controles de acesso",
     "Revisao e atualizacao de permissoes em todos os sistemas", "CISO",
     "em_andamento", "media", 19, 4),
    ("Implementar monitoramento de reputacao",
     "Implantacao de ferramenta de monitoramento de midias sociais", "Gerente de Comunicacao",
     "em_andamento", "media", 22, 16),
    ("Realizar auditoria de processos financeiros",
     "Auditoria detalhada dos processos financeiros criticos", "Auditor Chefe",
     "em_andamento", "alta", 13, 3),
    ("Revisar framework de gestao de riscos",
     "Atualizacao do framework de ERM da empresa", "Gerente de Riscos",
     "em_andamento", "media", 0, 19),
    ("Implantar canal de denuncias digital",
     "Desenvolvimento de plataforma digital para canal de denuncias", "Diretor de Compliance",
     "em_andamento", "media", 5, 18),

    # Concluido (~7)
    ("Contratar auditoria externa",
     "Contratacao de firma de auditoria para avaliacao independente", "CFO",
     "concluido", "alta", 4, 3),
    ("Implementar firewall de nova geracao",
     "Substituicao do firewall legado por solucao NGFW", "CISO",
     "concluido", "alta", 18, 6),
    ("Realizar treinamento LGPD",
     "Treinamento sobre protecao de dados para todas as areas", "DPO",
     "concluido", "alta", 16, 7),
    ("Atualizar politica de retencao de talentos",
     "Revisao do pacote de beneficios e plano de carreira", "Diretor de RH",
     "concluido", "media", 3, 2),
    ("Implementar controle de qualidade automatizado",
     "Implantacao de testes automatizados na linha de producao", "Gerente de Qualidade",
     "concluido", "media", 9, 13),
    ("Revisar contratos com fornecedores criticos",
     "Revisao e renegociacao de contratos com fornecedores-chave", "Diretor Juridico",
     "concluido", "media", 7, 12),
    ("Implementar gestao ambiental ISO 14001",
     "Implantacao do sistema de gestao ambiental conforme ISO 14001", "Gerente de Sustentabilidade",
     "concluido", "baixa", 24, 17),

    # Cancelado (~2)
    ("Migrar data center para nuvem",
     "Projeto de migracao do data center on-premises para cloud - cancelado por mudanca de estrategia",
     "CTO", "cancelado", "alta", 21, None),
    ("Implementar blockchain para auditoria",
     "Projeto piloto de blockchain para trilha de auditoria - descontinuado por inviabilidade tecnica",
     "Gerente de Inovacao", "cancelado", "baixa", 13, None),
]


def _plan_dates(status: str, idx: int) -> tuple[date, date]:
    """Generate reasonable start/due dates based on status."""
    if status == "concluido":
        start = TODAY - timedelta(days=90 + idx * 10)
        due = start + timedelta(days=60)
    elif status == "em_andamento":
        start = TODAY - timedelta(days=30 + idx * 5)
        due = TODAY + timedelta(days=30 + idx * 10)
    elif status == "cancelado":
        start = TODAY - timedelta(days=60)
        due = TODAY - timedelta(days=10)
    else:  # pendente
        start = TODAY + timedelta(days=idx * 7)
        due = start + timedelta(days=60)
    return start, due


async def ensure_action_plans(session, risks: list, controls: list, empresa_id: uuid.UUID):
    result = await session.execute(select(func.count()).select_from(ActionPlan))
    count = result.scalar()
    if count and count >= 25:
        print_step(f"Planos de acao ja existem ({count} encontrados)")
        return

    created = 0
    for idx, (title, desc, responsible, status, priority, risk_idx, ctrl_idx) in enumerate(ACTION_PLANS_DATA):
        risk_id = risks[risk_idx][1] if risk_idx is not None and risk_idx < len(risks) else None
        ctrl_id = controls[ctrl_idx][1] if ctrl_idx is not None and ctrl_idx < len(controls) else None
        start_d, due_d = _plan_dates(status, idx)

        plan = ActionPlan(
            title=title,
            description=desc,
            responsible=responsible,
            start_date=start_d,
            due_date=due_d,
            status=status,
            priority=priority,
            risk_id=risk_id,
            control_id=ctrl_id,
            empresa_id=empresa_id,
        )
        session.add(plan)
        created += 1

    await session.flush()
    print_step(f"Criados {created} planos de acao")


# ---------------------------------------------------------------------------
# 7. Risk Factors
# ---------------------------------------------------------------------------

# (name, description, category, risk_indices_to_link)
RISK_FACTORS_DATA = [
    ("Falta de alinhamento entre areas",
     "Areas da empresa operam de forma isolada sem integracao estrategica",
     "Interno", [0, 2]),
    ("Rotatividade de funcionarios",
     "Alta rotatividade impacta a continuidade dos processos",
     "Interno", [3]),
    ("Processos manuais e nao automatizados",
     "Excesso de processos manuais aumenta a probabilidade de erros",
     "Interno", [6, 8, 9]),
    ("Exposicao a ataques ciberneticos",
     "Ameacas externas de seguranca cibernetica em constante evolucao",
     "Externo", [18, 19, 20]),
    ("Mudancas na legislacao",
     "Alteracoes frequentes no ambiente regulatorio brasileiro",
     "Externo", [14, 15, 16, 17]),
    ("Instabilidade economica",
     "Cenario macroeconomico adverso impacta resultados financeiros",
     "Externo", [10, 11, 12]),
    ("Dependencia de fornecedores criticos",
     "Concentracao de fornecedores essenciais sem alternativas viáveis",
     "Externo", [7, 8]),
    ("Cultura de risco insuficiente",
     "Falta de conscientizacao sobre riscos em todos os niveis",
     "Interno", [0, 5, 6]),
    ("Complexidade regulatoria",
     "Multiplicidade de normas e regulamentos aplicaveis",
     "Externo", [14, 16, 17]),
    ("Obsolescencia tecnologica",
     "Sistemas e infraestrutura de TI desatualizados",
     "Interno", [19, 20, 21]),
    ("Pressao competitiva do mercado",
     "Aumento da concorrencia e mudancas no comportamento do consumidor",
     "Externo", [1]),
    ("Falta de governanca de dados",
     "Ausencia de politicas claras de gestao e protecao de dados",
     "Interno", [16, 20]),
    ("Eventos climaticos extremos",
     "Impacto de eventos climaticos nas operacoes e cadeia de suprimentos",
     "Externo", [24, 25]),
    ("Concentracao de conhecimento",
     "Conhecimento critico concentrado em poucos profissionais",
     "Interno", [3, 6]),
    ("Falhas de comunicacao interna",
     "Deficiencias na comunicacao entre areas e niveis hierarquicos",
     "Interno", [0, 5, 22, 23]),
]


async def ensure_risk_factors(session, risks: list):
    result = await session.execute(select(func.count()).select_from(RiskFactor))
    count = result.scalar()
    if count and count >= 15:
        print_step(f"Fatores de risco ja existem ({count} encontrados)")
        return

    created = 0
    for name, desc, category, risk_indices in RISK_FACTORS_DATA:
        # Link to the first risk in the list (risk_id is required, not nullable)
        for risk_idx in risk_indices:
            if risk_idx < len(risks):
                # Use raw insert to avoid the 'category' column which exists
                # in the ORM model but not in the actual DB table
                await session.execute(
                    insert(RiskFactor.__table__).values(
                        id=uuid.uuid4(),
                        name=name,
                        description=desc,
                        risk_id=risks[risk_idx][1],
                    )
                )
                created += 1
                break  # Only one risk_id per factor since it's a FK, not M2M

    await session.flush()
    print_step(f"Criados {created} fatores de risco")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("=" * 60)
    print("GRC Pro - Seed Database")
    print("=" * 60)

    async with async_session() as session:
        async with session.begin():
            print("\n[1/7] Empresa...")
            empresa_id = await ensure_empresa(session)

            print("[2/7] Categorias de risco...")
            categories = await ensure_categories(session)

            print("[3/7] Riscos...")
            risks = await ensure_risks(session, categories, empresa_id)

            print("[4/7] Avaliacoes de risco...")
            await ensure_assessments(session, risks)

            print("[5/7] Controles...")
            controls = await ensure_controls(session, empresa_id)

            print("[5b/7] Links risco-controle...")
            await ensure_risk_control_links(session, risks, controls)

            print("[6/7] Planos de acao...")
            await ensure_action_plans(session, risks, controls, empresa_id)

            print("[7/7] Fatores de risco...")
            await ensure_risk_factors(session, risks)

    print("\n" + "=" * 60)
    print("Seed concluido com sucesso!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
