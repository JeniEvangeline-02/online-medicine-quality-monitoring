from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.analytics.quality_analytics import QualityAnalytics
from app.analytics.compliance_analytics import ComplianceAnalytics
from app.analytics.supplier_analytics import SupplierAnalytics
from app.analytics.product_analytics import ProductAnalytics
from app.analytics.storage_analytics import StorageAnalytics
from app.analytics.transport_analytics import TransportAnalytics
from app.analytics.recall_analytics import RecallAnalytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/quality")
def get_quality_analytics(
    days: int = Query(30, ge=1, le=365),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return QualityAnalytics.get_quality_performance_and_trends(db, days, product_id)

@router.get("/compliance")
def get_compliance_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ComplianceAnalytics.get_compliance_overview(db, days)

@router.get("/suppliers")
def get_supplier_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SupplierAnalytics.get_supplier_performance(db)

@router.get("/products")
def get_product_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalytics.get_product_performance(db)

@router.get("/storage")
def get_storage_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return StorageAnalytics.get_storage_health(db)

@router.get("/transport")
def get_transport_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return TransportAnalytics.get_transport_health(db)

@router.get("/recalls")
def get_recall_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return RecallAnalytics.get_recall_summary(db)
