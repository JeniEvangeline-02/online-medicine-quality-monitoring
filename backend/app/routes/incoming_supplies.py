from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.incoming_supply import IncomingSupplyCreate, IncomingSupplyUpdate, IncomingSupplyOut, PaginatedIncomingSupplies
import app.services.incoming_supply as svc

router = APIRouter(prefix="/incoming-supplies", tags=["Incoming Supplies"])

@router.get("", response_model=PaginatedIncomingSupplies)
def list_incoming_supplies(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, quality_status: Optional[str] = None,
    compliance_status: Optional[str] = None, final_decision: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    # HOSPITAL users can only see their own hospital's supplies
    hospital_id = None
    if current_user.role.name == UserRole.HOSPITAL:
        hospital_id = current_user.id  # simplified; production would use org ID
    
    items, total, total_pages = svc.get_incoming_supplies(
        db, page, page_size, search, quality_status, compliance_status, final_decision, hospital_id
    )
    return PaginatedIncomingSupplies(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{supply_id}", response_model=IncomingSupplyOut)
def get_incoming_supply(supply_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_active_user)):
    return svc.get_incoming_supply(db, supply_id)

@router.post("", response_model=IncomingSupplyOut, status_code=201)
def create_incoming_supply(
    data: IncomingSupplyCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HOSPITAL, UserRole.QUALITY_INSPECTOR]))
):
    return svc.create_incoming_supply(db, data, current_user.id)

@router.put("/{supply_id}", response_model=IncomingSupplyOut)
def update_incoming_supply(
    supply_id: int, data: IncomingSupplyUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.QUALITY_INSPECTOR]))
):
    return svc.update_incoming_supply(db, supply_id, data, current_user.id)
