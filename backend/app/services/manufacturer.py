from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models import Manufacturer, Batch, Product
from app.schemas.manufacturer import ManufacturerCreate, ManufacturerUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED"}

def get_manufacturers(db: Session, page: int, page_size: int,
                      search: str = None, status: str = None):
    q = db.query(Manufacturer)
    if search:
        q = q.filter(or_(
            Manufacturer.name.ilike(f"%{search}%"),
            Manufacturer.registration_number.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(Manufacturer.status == status)
    return paginate(q, page, page_size)

def get_manufacturer(db: Session, manufacturer_id: int):
    m = db.query(Manufacturer).filter(Manufacturer.id == manufacturer_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Manufacturer not found.")
    return m

def create_manufacturer(db: Session, data: ManufacturerCreate, user_id: int):
    existing = db.query(Manufacturer).filter(
        Manufacturer.registration_number == data.registration_number
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A manufacturer with this registration number already exists.")
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status. Use one of: {VALID_STATUSES}")
    m = Manufacturer(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    create_audit_log(db, "MANUFACTURER_CREATED", "Manufacturer", m.id, user_id, new_value=m.name)
    return m

def update_manufacturer(db: Session, manufacturer_id: int, data: ManufacturerUpdate, user_id: int):
    m = get_manufacturer(db, manufacturer_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    create_audit_log(db, "MANUFACTURER_UPDATED", "Manufacturer", m.id, user_id, new_value=m.name)
    return m

def delete_manufacturer(db: Session, manufacturer_id: int, user_id: int):
    m = get_manufacturer(db, manufacturer_id)
    # Check if referenced by products or batches
    has_products = db.query(Product).filter(Product.manufacturer_id == manufacturer_id).first()
    has_batches = db.query(Batch).filter(Batch.manufacturer_id == manufacturer_id).first()
    if has_products or has_batches:
        # Soft-delete: archive instead of hard delete
        m.status = "INACTIVE"
        db.commit()
        create_audit_log(db, "MANUFACTURER_ARCHIVED", "Manufacturer", m.id, user_id)
        return {"message": "Manufacturer has associated records and has been archived (set to INACTIVE) instead of deleted."}
    db.delete(m)
    db.commit()
    create_audit_log(db, "MANUFACTURER_DELETED", "Manufacturer", manufacturer_id, user_id)
    return {"message": "Manufacturer deleted."}
