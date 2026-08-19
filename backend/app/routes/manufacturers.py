from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.manufacturer import ManufacturerCreate, ManufacturerUpdate, ManufacturerOut, PaginatedManufacturers
import app.services.manufacturer as svc

router = APIRouter(prefix="/manufacturers", tags=["Manufacturers"])

@router.get("", response_model=PaginatedManufacturers)
def list_manufacturers(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_manufacturers(db, page, page_size, search, status)
    return PaginatedManufacturers(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{manufacturer_id}", response_model=ManufacturerOut)
def get_manufacturer(manufacturer_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_active_user)):
    return svc.get_manufacturer(db, manufacturer_id)

@router.post("", response_model=ManufacturerOut, status_code=201)
def create_manufacturer(data: ManufacturerCreate, db: Session = Depends(get_db),
                        current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.create_manufacturer(db, data, current_user.id)

@router.put("/{manufacturer_id}", response_model=ManufacturerOut)
def update_manufacturer(manufacturer_id: int, data: ManufacturerUpdate, db: Session = Depends(get_db),
                        current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.update_manufacturer(db, manufacturer_id, data, current_user.id)

@router.delete("/{manufacturer_id}")
def delete_manufacturer(manufacturer_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.delete_manufacturer(db, manufacturer_id, current_user.id)
