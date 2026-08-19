from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.quality_standard import QualityStandardCreate, QualityStandardUpdate, QualityStandardOut, PaginatedQualityStandards
import app.services.quality_standard as svc

router = APIRouter(prefix="/quality-standards", tags=["Quality Standards"])

@router.get("", response_model=PaginatedQualityStandards)
def list_quality_standards(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, product_id: Optional[int] = None,
    parameter_type: Optional[str] = None, is_critical: Optional[bool] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_quality_standards(
        db, page, page_size, search, product_id, parameter_type, is_critical, is_active
    )
    return PaginatedQualityStandards(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{standard_id}", response_model=QualityStandardOut)
def get_quality_standard(
    standard_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return svc.get_quality_standard(db, standard_id)

@router.post("", response_model=QualityStandardOut, status_code=201)
def create_quality_standard(
    data: QualityStandardCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.create_quality_standard(db, data, current_user.id)

@router.put("/{standard_id}", response_model=QualityStandardOut)
def update_quality_standard(
    standard_id: int, data: QualityStandardUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.update_quality_standard(db, standard_id, data, current_user.id)

@router.delete("/{standard_id}", response_model=QualityStandardOut)
def deactivate_quality_standard(
    standard_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.deactivate_quality_standard(db, standard_id, current_user.id)
