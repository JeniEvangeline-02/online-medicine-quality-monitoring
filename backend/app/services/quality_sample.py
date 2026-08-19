from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException
from datetime import datetime, date
from app.models import QualitySample, IncomingSupply, Batch, User
from app.schemas.quality_sample import QualitySampleCreate, QualitySampleUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

def _generate_sample_code(db: Session) -> str:
    current_year = date.today().year
    base_count = db.query(QualitySample).filter(QualitySample.sample_code.like(f"SMP-{current_year}-%")).count()
    seq = base_count + 1
    while True:
        code = f"SMP-{current_year}-{seq:06d}"
        exists = db.query(QualitySample).filter(QualitySample.sample_code == code).first()
        if not exists:
            return code
        seq += 1

def get_quality_samples(db: Session, page: int, page_size: int,
                        search: str = None, batch_id: int = None,
                        product_id: int = None, status: str = None,
                        start_date: datetime = None, end_date: datetime = None):
    # Join batch to allow product filtering
    q = (db.query(QualitySample)
         .options(
             joinedload(QualitySample.batch).joinedload(Batch.product),
             joinedload(QualitySample.incoming_supply),
             joinedload(QualitySample.collector)
         ))
    
    if search:
        q = q.filter(or_(
            QualitySample.sample_code.ilike(f"%{search}%"),
            Batch.batch_number.ilike(f"%{search}%")
        ))
    if batch_id is not None:
        q = q.filter(QualitySample.batch_id == batch_id)
    if product_id is not None:
        q = q.join(QualitySample.batch).filter(Batch.product_id == product_id)
    if status:
        q = q.filter(QualitySample.status == status)
    if start_date:
        q = q.filter(QualitySample.collection_date >= start_date)
    if end_date:
        q = q.filter(QualitySample.collection_date <= end_date)

    q = q.order_by(QualitySample.created_at.desc())

    items, total, total_pages = paginate(q, page, page_size)
    return items, total, total_pages

def get_quality_sample(db: Session, sample_id: int):
    sample = (db.query(QualitySample)
              .options(
                  joinedload(QualitySample.batch).joinedload(Batch.product),
                  joinedload(QualitySample.incoming_supply),
                  joinedload(QualitySample.collector)
              )
              .filter(QualitySample.id == sample_id).first())
    if not sample:
        raise HTTPException(status_code=404, detail="Quality sample not found.")
    return sample

def create_quality_sample(db: Session, data: QualitySampleCreate, user_id: int):
    # Verify incoming supply exists
    supply = db.query(IncomingSupply).filter(IncomingSupply.id == data.incoming_supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Incoming supply not found.")
    
    # Verify batch exists
    batch = db.query(Batch).filter(Batch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    # Check that sample belongs to the supply batch
    if supply.batch_id != data.batch_id:
        raise HTTPException(status_code=422, detail="Selected batch does not match incoming supply batch.")
    
    # Validate quantity
    if data.sample_quantity <= 0:
        raise HTTPException(status_code=422, detail="Sample quantity must be greater than 0.")
    
    # Validate date is not in future
    if data.collection_date.date() > date.today():
        raise HTTPException(status_code=422, detail="Collection date cannot be in the future.")

    # Create sample
    sample_code = _generate_sample_code(db)
    sample = QualitySample(
        sample_code=sample_code,
        incoming_supply_id=data.incoming_supply_id,
        batch_id=data.batch_id,
        collected_by=user_id,
        collection_date=data.collection_date,
        sample_quantity=data.sample_quantity,
        unit=data.unit,
        sample_condition=data.sample_condition,
        status="COLLECTED"
    )
    
    db.add(sample)
    db.commit()
    db.refresh(sample)

    create_audit_log(
        db,
        action="SAMPLE_CREATED",
        entity_type="QualitySample",
        entity_id=sample.id,
        user_id=user_id,
        new_value=sample.sample_code
    )
    return get_quality_sample(db, sample.id)

def update_quality_sample(db: Session, sample_id: int, data: QualitySampleUpdate, user_id: int):
    sample = get_quality_sample(db, sample_id)
    
    prev_val = f"Status: {sample.status}, Quantity: {sample.sample_quantity}"
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sample, field, value)
        
    db.commit()
    db.refresh(sample)
    
    new_val = f"Status: {sample.status}, Quantity: {sample.sample_quantity}"
    create_audit_log(
        db,
        action="SAMPLE_UPDATED",
        entity_type="QualitySample",
        entity_id=sample.id,
        user_id=user_id,
        previous_value=prev_val,
        new_value=new_val
    )
    return get_quality_sample(db, sample.id)
