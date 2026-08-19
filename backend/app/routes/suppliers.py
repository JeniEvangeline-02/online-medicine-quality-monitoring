from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut, PaginatedSuppliers
import app.services.supplier as svc

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=PaginatedSuppliers)
def list_suppliers(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_suppliers(db, page, page_size, search, status)
    return PaginatedSuppliers(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_active_user)):
    return svc.get_supplier(db, supplier_id)

@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.create_supplier(db, data, current_user.id)

@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, data: SupplierUpdate, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.update_supplier(db, supplier_id, data, current_user.id)

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.delete_supplier(db, supplier_id, current_user.id)
