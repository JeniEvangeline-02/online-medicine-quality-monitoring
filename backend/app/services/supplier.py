from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.models import Supplier, Batch, IncomingSupply
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

def get_suppliers(db: Session, page: int, page_size: int, search: str = None, status: str = None):
    q = db.query(Supplier)
    if search:
        q = q.filter(or_(
            Supplier.name.ilike(f"%{search}%"),
            Supplier.registration_number.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(Supplier.status == status)
    return paginate(q, page, page_size)

def get_supplier(db: Session, supplier_id: int):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return s

def create_supplier(db: Session, data: SupplierCreate, user_id: int):
    existing = db.query(Supplier).filter(Supplier.registration_number == data.registration_number).first()
    if existing:
        raise HTTPException(status_code=409, detail="A supplier with this registration number already exists.")
    s = Supplier(**data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    create_audit_log(db, "SUPPLIER_CREATED", "Supplier", s.id, user_id, new_value=s.name)
    return s

def update_supplier(db: Session, supplier_id: int, data: SupplierUpdate, user_id: int):
    s = get_supplier(db, supplier_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    create_audit_log(db, "SUPPLIER_UPDATED", "Supplier", s.id, user_id, new_value=s.name)
    return s

def delete_supplier(db: Session, supplier_id: int, user_id: int):
    s = get_supplier(db, supplier_id)
    has_batches = db.query(Batch).filter(Batch.supplier_id == supplier_id).first()
    if has_batches:
        s.status = "INACTIVE"
        db.commit()
        create_audit_log(db, "SUPPLIER_ARCHIVED", "Supplier", s.id, user_id)
        return {"message": "Supplier has associated batch records and has been archived (set to INACTIVE)."}
    db.delete(s)
    db.commit()
    create_audit_log(db, "SUPPLIER_DELETED", "Supplier", supplier_id, user_id)
    return {"message": "Supplier deleted."}
