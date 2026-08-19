from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.batch import BatchCreate, BatchUpdate, BatchOut, PaginatedBatches
import app.services.batch as svc

router = APIRouter(prefix="/batches", tags=["Batches"])

@router.get("", response_model=PaginatedBatches)
def list_batches(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, product_id: Optional[int] = None,
    manufacturer_id: Optional[int] = None, supplier_id: Optional[int] = None,
    quality_status: Optional[str] = None, compliance_status: Optional[str] = None,
    recall_status: Optional[str] = None, expiry_status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_batches(
        db, page, page_size, search, product_id, manufacturer_id,
        supplier_id, quality_status, compliance_status, recall_status, expiry_status
    )
    return PaginatedBatches(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

# QR lookup MUST come before /{batch_id} to avoid routing conflict
@router.get("/qr/{qr_identifier}", response_model=BatchOut)
def get_batch_by_qr(qr_identifier: str, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_active_user)):
    return svc.get_batch_by_qr(db, qr_identifier)

@router.get("/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db),
              current_user: User = Depends(get_current_active_user)):
    return svc.get_batch(db, batch_id)

@router.post("", response_model=BatchOut, status_code=201)
def create_batch(data: BatchCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))):
    return svc.create_batch(db, data, current_user.id)

@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: int, data: BatchUpdate, db: Session = Depends(get_db),
                 current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))):
    return svc.update_batch(db, batch_id, data, current_user.id)
