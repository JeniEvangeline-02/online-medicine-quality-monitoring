from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.database.database import SessionLocal
from app.routes import auth as auth_router
from app.routes import manufacturers as manufacturers_router
from app.routes import suppliers as suppliers_router
from app.routes import products as products_router
from app.routes import batches as batches_router
from app.routes import incoming_supplies as incoming_supplies_router
from app.routes import quality_standards as quality_standards_router
from app.routes import quality_samples as quality_samples_router
from app.routes import quality_tests as quality_tests_router
from app.routes import compliance as compliance_router
from app.routes import certificates as certificates_router
from app.routes import traceability as traceability_router
from app.routes import storage as storage_router
from app.routes import transport as transport_router
from app.routes import quarantine as quarantine_router
from app.routes import recalls as recalls_router
from app.routes import corrective_actions as corrective_actions_router
from app.routes import alerts as alerts_router
from app.routes import dashboard as dashboard_router
from app.routes import analytics as analytics_router
from app.routes import reports as reports_router
from app.routes import search as search_router
from app.routes import ai as ai_router


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Online Testing and Monitoring of Quality of Medicines and Consumables",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
)

# Configure CORS — only allow the known frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(manufacturers_router.router, prefix=settings.API_V1_STR)
app.include_router(suppliers_router.router, prefix=settings.API_V1_STR)
app.include_router(products_router.router, prefix=settings.API_V1_STR)
app.include_router(batches_router.router, prefix=settings.API_V1_STR)
app.include_router(incoming_supplies_router.router, prefix=settings.API_V1_STR)
app.include_router(quality_standards_router.router, prefix=settings.API_V1_STR)
app.include_router(quality_samples_router.router, prefix=settings.API_V1_STR)
app.include_router(quality_tests_router.router, prefix=settings.API_V1_STR)
app.include_router(compliance_router.router, prefix=settings.API_V1_STR)
app.include_router(certificates_router.router, prefix=settings.API_V1_STR)
# Phase 6 routers
app.include_router(traceability_router.router, prefix=settings.API_V1_STR)
app.include_router(storage_router.router, prefix=settings.API_V1_STR)
app.include_router(transport_router.router, prefix=settings.API_V1_STR)
app.include_router(quarantine_router.router, prefix=settings.API_V1_STR)
app.include_router(recalls_router.router, prefix=settings.API_V1_STR)
app.include_router(corrective_actions_router.router, prefix=settings.API_V1_STR)
app.include_router(alerts_router.router, prefix=settings.API_V1_STR)
# Phase 7 routers
app.include_router(dashboard_router.router, prefix=settings.API_V1_STR)
app.include_router(analytics_router.router, prefix=settings.API_V1_STR)
app.include_router(reports_router.router, prefix=settings.API_V1_STR)
app.include_router(search_router.router, prefix=settings.API_V1_STR)
# Phase 8 router
app.include_router(ai_router.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    from app.database.migrate import migrate_db
    migrate_db()



@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint — also verifies PostgreSQL connectivity."""
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "unavailable"

    from datetime import datetime
    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "medicine-quality-monitoring",
        "database": db_status,
        "version": "2.0.0",
        "ai_engine_version": "risk-engine-v1",
        "timestamp": datetime.utcnow().isoformat()
    }


