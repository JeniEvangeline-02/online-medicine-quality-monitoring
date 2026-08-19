from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.quality_test import QualityTestOut, PaginatedQualityTests, CompleteTestRequest
import app.services.quality_test as svc

router = APIRouter(prefix="/quality-tests", tags=["Quality Tests"])

class QualityTestStartRequest(BaseModel):
    sample_id: int

@router.get("", response_model=PaginatedQualityTests)
def list_quality_tests(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, sample_code: Optional[str] = None,
    batch_number: Optional[str] = None, product_id: Optional[int] = None,
    inspector_id: Optional[int] = None, overall_result: Optional[str] = None,
    start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    # Retrieve tests
    items, total, total_pages = svc.get_quality_tests(
        db, page, page_size, search, sample_code, batch_number, product_id,
        inspector_id, overall_result, start_date, end_date
    )
    return PaginatedQualityTests(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{test_id}", response_model=QualityTestOut)
def get_quality_test(
    test_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return svc.get_quality_test(db, test_id)

@router.post("", response_model=QualityTestOut, status_code=201)
def start_quality_test(
    data: QualityTestStartRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.create_quality_test(db, data.sample_id, current_user.id)

@router.put("/{test_id}", response_model=QualityTestOut)
def save_test_draft(
    test_id: int, data: CompleteTestRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.save_test_draft(db, test_id, data, current_user.id)

@router.post("/{test_id}/complete", response_model=QualityTestOut)
def complete_quality_test(
    test_id: int, data: CompleteTestRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.complete_quality_test(db, test_id, data, current_user.id)
