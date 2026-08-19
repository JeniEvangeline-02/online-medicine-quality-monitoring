from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models import User, UserRole
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, PaginatedProducts
import app.services.product as svc

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=PaginatedProducts)
def list_products(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None, product_type: Optional[str] = None,
    category: Optional[str] = None, manufacturer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    items, total, total_pages = svc.get_products(db, page, page_size, search, product_type, category, manufacturer_id, status)
    return PaginatedProducts(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_active_user)):
    return svc.get_product(db, product_id)

@router.post("", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.create_product(db, data, current_user.id)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.update_product(db, product_id, data, current_user.id)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return svc.delete_product(db, product_id, current_user.id)
