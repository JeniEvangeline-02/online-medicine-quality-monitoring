from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from fastapi import HTTPException
from app.models import QualityStandard, Product
from app.schemas.quality_standard import QualityStandardCreate, QualityStandardUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

def get_quality_standards(db: Session, page: int, page_size: int,
                          search: str = None, product_id: int = None,
                          parameter_type: str = None, is_critical: bool = None,
                          is_active: bool = None):
    q = db.query(QualityStandard).options(joinedload(QualityStandard.product))
    if search:
        q = q.filter(QualityStandard.parameter_name.ilike(f"%{search}%"))
    if product_id is not None:
        q = q.filter(QualityStandard.product_id == product_id)
    if parameter_type:
        q = q.filter(QualityStandard.parameter_type == parameter_type)
    if is_critical is not None:
        q = q.filter(QualityStandard.is_critical == is_critical)
    if is_active is not None:
        q = q.filter(QualityStandard.is_active == is_active)
    
    # Order by creation date descending
    q = q.order_by(QualityStandard.created_at.desc())

    items, total, total_pages = paginate(q, page, page_size)
    return items, total, total_pages

def get_quality_standard(db: Session, standard_id: int):
    standard = db.query(QualityStandard).options(joinedload(QualityStandard.product)).filter(QualityStandard.id == standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Quality standard not found.")
    return standard

def create_quality_standard(db: Session, data: QualityStandardCreate, user_id: int):
    # Validate product exists
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    # Store standard
    standard = QualityStandard(**data.model_dump())
    db.add(standard)
    db.commit()
    db.refresh(standard)
    
    create_audit_log(
        db,
        action="QUALITY_STANDARD_CREATED",
        entity_type="QualityStandard",
        entity_id=standard.id,
        user_id=user_id,
        new_value=standard.parameter_name
    )
    return get_quality_standard(db, standard.id)

def update_quality_standard(db: Session, standard_id: int, data: QualityStandardUpdate, user_id: int):
    standard = get_quality_standard(db, standard_id)
    
    # Keep previous value for audit logging
    prev_val = f"Name: {standard.parameter_name}, Active: {standard.is_active}"
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(standard, field, value)
        
    db.commit()
    db.refresh(standard)
    
    new_val = f"Name: {standard.parameter_name}, Active: {standard.is_active}"
    create_audit_log(
        db,
        action="QUALITY_STANDARD_UPDATED",
        entity_type="QualityStandard",
        entity_id=standard.id,
        user_id=user_id,
        previous_value=prev_val,
        new_value=new_val
    )
    return get_quality_standard(db, standard.id)

def deactivate_quality_standard(db: Session, standard_id: int, user_id: int):
    standard = get_quality_standard(db, standard_id)
    
    prev_val = f"Active: {standard.is_active}"
    standard.is_active = False
    db.commit()
    db.refresh(standard)
    
    new_val = "Active: False"
    create_audit_log(
        db,
        action="QUALITY_STANDARD_DEACTIVATED",
        entity_type="QualityStandard",
        entity_id=standard.id,
        user_id=user_id,
        previous_value=prev_val,
        new_value=new_val
    )
    return standard
