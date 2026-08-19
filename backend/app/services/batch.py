import uuid
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException
from app.models import Batch, Product, Manufacturer, Supplier
from app.schemas.batch import BatchCreate, BatchUpdate
from app.services.utils import paginate, calc_expiry_status
from app.services.audit import create_audit_log

def _generate_qr(db: Session) -> str:
    while True:
        qr = f"BATCH-QR-{date.today().year}-{uuid.uuid4().hex[:8].upper()}"
        exists = db.query(Batch).filter(Batch.qr_identifier == qr).first()
        if not exists:
            return qr

def _enrich(batch: Batch) -> Batch:
    """Attach computed expiry_status (not stored in DB)."""
    batch.expiry_status = calc_expiry_status(batch.expiry_date)
    return batch

def get_batches(db: Session, page: int, page_size: int,
                search: str = None, product_id: int = None,
                manufacturer_id: int = None, supplier_id: int = None,
                quality_status: str = None, compliance_status: str = None,
                recall_status: str = None, expiry_status: str = None):
    q = (db.query(Batch)
         .options(joinedload(Batch.product), joinedload(Batch.manufacturer), joinedload(Batch.supplier)))
    if search:
        q = q.filter(or_(Batch.batch_number.ilike(f"%{search}%")))
    if product_id:
        q = q.filter(Batch.product_id == product_id)
    if manufacturer_id:
        q = q.filter(Batch.manufacturer_id == manufacturer_id)
    if supplier_id:
        q = q.filter(Batch.supplier_id == supplier_id)
    if quality_status:
        q = q.filter(Batch.quality_status == quality_status)
    if compliance_status:
        q = q.filter(Batch.compliance_status == compliance_status)
    if recall_status:
        q = q.filter(Batch.recall_status == recall_status)

    items, total, total_pages = paginate(q, page, page_size)
    
    # Filter by expiry_status in Python (computed field)
    if expiry_status:
        items = [b for b in items if calc_expiry_status(b.expiry_date) == expiry_status]
    
    for b in items:
        _enrich(b)
    return items, total, total_pages

def get_batch(db: Session, batch_id: int):
    b = (db.query(Batch)
         .options(joinedload(Batch.product), joinedload(Batch.manufacturer), joinedload(Batch.supplier))
         .filter(Batch.id == batch_id).first())
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return _enrich(b)

def get_batch_by_qr(db: Session, qr_identifier: str):
    b = (db.query(Batch)
         .options(joinedload(Batch.product), joinedload(Batch.manufacturer), joinedload(Batch.supplier))
         .filter(Batch.qr_identifier == qr_identifier).first())
    if not b:
        raise HTTPException(status_code=404, detail="No batch found with this QR identifier.")
    return _enrich(b)

def create_batch(db: Session, data: BatchCreate, user_id: int):
    # Validate references
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.status != "ACTIVE":
        raise HTTPException(status_code=422, detail="Product is not active.")
    
    manufacturer = db.query(Manufacturer).filter(Manufacturer.id == data.manufacturer_id).first()
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found.")
    if manufacturer.status != "ACTIVE":
        raise HTTPException(status_code=422, detail="Manufacturer is not active.")
    
    supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    if supplier.status != "ACTIVE":
        raise HTTPException(status_code=422, detail="Supplier is not active.")

    # Validate dates
    if data.manufacturing_date >= data.expiry_date:
        raise HTTPException(status_code=422, detail="Expiry date must be later than manufacturing date.")
    if data.quantity <= 0:
        raise HTTPException(status_code=422, detail="Quantity must be greater than zero.")

    # Batch number unique per product
    exists = db.query(Batch).filter(
        Batch.batch_number == data.batch_number,
        Batch.product_id == data.product_id
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="Batch number already exists for this product.")

    b = Batch(
        **data.model_dump(),
        quality_status="PENDING",
        compliance_status="PENDING",
        final_decision="PENDING",
        recall_status="NOT_RECALLED",
        qr_identifier=_generate_qr(db)
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    create_audit_log(db, "BATCH_CREATED", "Batch", b.id, user_id, new_value=b.batch_number)
    return get_batch(db, b.id)

def update_batch(db: Session, batch_id: int, data: BatchUpdate, user_id: int):
    b = get_batch(db, batch_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(b, field, value)
    db.commit()
    db.refresh(b)
    create_audit_log(db, "BATCH_UPDATED", "Batch", b.id, user_id)
    return get_batch(db, b.id)
