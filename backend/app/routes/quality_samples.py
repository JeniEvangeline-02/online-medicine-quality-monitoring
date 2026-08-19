from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.quality_sample import QualitySampleCreate, QualitySampleUpdate, QualitySampleOut, PaginatedQualitySamples
import app.services.quality_sample as svc

router = APIRouter(prefix="/quality-samples", tags=["Quality Samples"])

@router.get("", response_model=PaginatedQualitySamples)
def list_quality_samples(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, batch_id: Optional[int] = None,
    product_id: Optional[int] = None, status: Optional[str] = None,
    start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_quality_samples(
        db, page, page_size, search, batch_id, product_id, status, start_date, end_date
    )
    return PaginatedQualitySamples(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{sample_id}", response_model=QualitySampleOut)
def get_quality_sample(
    sample_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return svc.get_quality_sample(db, sample_id)

@router.post("", response_model=QualitySampleOut, status_code=201)
def create_quality_sample(
    data: QualitySampleCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.create_quality_sample(db, data, current_user.id)

@router.put("/{sample_id}", response_model=QualitySampleOut)
def update_quality_sample(
    sample_id: int, data: QualitySampleUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.update_quality_sample(db, sample_id, data, current_user.id)
