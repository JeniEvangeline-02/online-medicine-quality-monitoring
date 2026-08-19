from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException
from app.models import Product, Manufacturer
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

VALID_TYPES = {"MEDICINE", "CONSUMABLE"}
VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED"}

def get_products(db: Session, page: int, page_size: int, search: str = None,
                 product_type: str = None, category: str = None,
                 manufacturer_id: int = None, status: str = None):
    q = db.query(Product).options(joinedload(Product.manufacturer))
    if search:
        q = q.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.product_code.ilike(f"%{search}%"),
            Product.generic_name.ilike(f"%{search}%"),
            Product.registration_number.ilike(f"%{search}%"),
        ))
    if product_type:
        q = q.filter(Product.product_type == product_type)
    if category:
        q = q.filter(Product.category == category)
    if manufacturer_id:
        q = q.filter(Product.manufacturer_id == manufacturer_id)
    if status:
        q = q.filter(Product.status == status)
    return paginate(q, page, page_size)

def get_product(db: Session, product_id: int):
    p = db.query(Product).options(joinedload(Product.manufacturer)).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return p

def create_product(db: Session, data: ProductCreate, user_id: int):
    if data.product_type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid product_type. Use MEDICINE or CONSUMABLE.")
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status.")
    existing_code = db.query(Product).filter(Product.product_code == data.product_code).first()
    if existing_code:
        raise HTTPException(status_code=409, detail="A product with this product code already exists.")
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == data.manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found.")
    p = Product(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    create_audit_log(db, "PRODUCT_CREATED", "Product", p.id, user_id, new_value=p.name)
    return get_product(db, p.id)

def update_product(db: Session, product_id: int, data: ProductUpdate, user_id: int):
    p = get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    create_audit_log(db, "PRODUCT_UPDATED", "Product", p.id, user_id, new_value=p.name)
    return get_product(db, p.id)

def delete_product(db: Session, product_id: int, user_id: int):
    p = get_product(db, product_id)
    from app.models import Batch
    has_batches = db.query(Batch).filter(Batch.product_id == product_id).first()
    if has_batches:
        p.status = "INACTIVE"
        db.commit()
        create_audit_log(db, "PRODUCT_ARCHIVED", "Product", p.id, user_id)
        return {"message": "Product has associated batches and has been archived (set to INACTIVE)."}
    db.delete(p)
    db.commit()
    create_audit_log(db, "PRODUCT_DELETED", "Product", product_id, user_id)
    return {"message": "Product deleted."}
