import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import async_session, engine, Base
from app.models.empresa import Empresa
from app.models.user import User
from app.models.risk_category import RiskCategory
from app.auth.jwt import get_password_hash
from app.routers import auth, risks, controls, action_plans, analytics

logger = logging.getLogger(__name__)


async def seed_admin_user() -> None:
    """Create default empresa and admin user if they don't exist."""
    async with async_session() as session:
        async with session.begin():
            # Check if admin user already exists
            result = await session.execute(
                select(User).where(User.username == "admin")
            )
            if result.scalar_one_or_none() is not None:
                logger.info("Admin user already exists, skipping seed.")
                return

            # Create default empresa
            result = await session.execute(
                select(Empresa).where(Empresa.cnpj == "00.000.000/0001-00")
            )
            empresa = result.scalar_one_or_none()
            if empresa is None:
                empresa = Empresa(
                    name="Empresa Demonstracao",
                    cnpj="00.000.000/0001-00",
                )
                session.add(empresa)
                await session.flush()
                logger.info("Created default empresa: Empresa Demonstracao")

            # Create admin user
            admin_user = User(
                username="admin",
                email="admin@grcpro.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                empresa_id=empresa.id,
                is_active=True,
            )
            session.add(admin_user)
            logger.info("Created admin user: admin / admin123")


async def seed_risk_categories() -> None:
    """Seed initial risk categories if none exist."""
    async with async_session() as session:
        async with session.begin():
            result = await session.execute(select(RiskCategory).limit(1))
            if result.scalar_one_or_none() is not None:
                logger.info("Risk categories already exist, skipping seed.")
                return

            categories_data = {
                "ESTRATEGIA": ["Objetivos Estrategicos", "Planejamento"],
                "GESTAO": ["Gestao de Pessoas", "Gestao Financeira"],
                "OPERACIONAL": ["Processos", "Producao", "Logistica"],
                "FINANCEIRO": ["Credito", "Mercado", "Liquidez"],
                "COMPLIANCE": ["Regulatorio", "Legal"],
                "TECNOLOGIA DA INFORMACAO": [
                    "Seguranca da Informacao",
                    "Infraestrutura",
                ],
                "IMAGEM E REPUTACAO": [],
                "SOCIOAMBIENTAL": [],
            }

            for parent_name, children_names in categories_data.items():
                parent = RiskCategory(name=parent_name)
                session.add(parent)
                await session.flush()

                for child_name in children_names:
                    child = RiskCategory(name=child_name, parent_id=parent.id)
                    session.add(child)

            logger.info("Seeded %d risk category trees.", len(categories_data))


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan: run startup tasks then yield."""
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed admin user
    await seed_admin_user()
    # Seed risk categories
    await seed_risk_categories()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(risks.router, prefix=settings.API_V1_PREFIX)
app.include_router(controls.router, prefix=settings.API_V1_PREFIX)
app.include_router(action_plans.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}
