from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from fastapi import HTTPException
from app.models import IncomingSupply, Batch
from app.schemas.incoming_supply import IncomingSupplyCreate, IncomingSupplyUpdate
from app.services.utils import paginate
from app.services.audit import create_audit_log

def _generate_receiving_id(db: Session) -> str:
    year = date.today().year
    count = db.query(func.count(IncomingSupply.id)).scalar() or 0
    return f"REC-{year}-{str(count + 1).zfill(6)}"

def get_incoming_supplies(db: Session, page: int, page_size: int,
                          search: str = None, quality_status: str = None,
                          compliance_status: str = None, final_decision: str = None,
                          hospital_id: int = None, supplier_id: int = None):
    q = db.query(IncomingSupply).options(joinedload(IncomingSupply.batch))
    if search:
        q = q.filter(or_(IncomingSupply.receiving_id.ilike(f"%{search}%")))
    if quality_status:
        q = q.filter(IncomingSupply.quality_status == quality_status)
    if compliance_status:
        q = q.filter(IncomingSupply.compliance_status == compliance_status)
    if final_decision:
        q = q.filter(IncomingSupply.final_decision == final_decision)
    if hospital_id:
        q = q.filter(IncomingSupply.hospital_id == hospital_id)
    return paginate(q, page, page_size)

def get_incoming_supply(db: Session, supply_id: int):
    s = (db.query(IncomingSupply)
         .options(joinedload(IncomingSupply.batch))
         .filter(IncomingSupply.id == supply_id).first())
    if not s:
        raise HTTPException(status_code=404, detail="Incoming supply record not found.")
    return s

def create_incoming_supply(db: Session, data: IncomingSupplyCreate, user_id: int):
    batch = db.query(Batch).filter(Batch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if data.quantity_received <= 0:
        raise HTTPException(status_code=422, detail="Quantity received must be greater than zero.")

    receiving_id = _generate_receiving_id(db)
    s = IncomingSupply(
        **data.model_dump(),
        receiving_id=receiving_id,
        quality_status="PENDING",
        compliance_status="PENDING",
        final_decision="PENDING",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    create_audit_log(db, "INCOMING_SUPPLY_CREATED", "IncomingSupply", s.id, user_id,
                     new_value=f"REC ID: {receiving_id}")
    return get_incoming_supply(db, s.id)

def update_incoming_supply(db: Session, supply_id: int, data: IncomingSupplyUpdate, user_id: int):
    s = get_incoming_supply(db, supply_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    create_audit_log(db, "INCOMING_SUPPLY_UPDATED", "IncomingSupply", s.id, user_id)
    return get_incoming_supply(db, s.id)
