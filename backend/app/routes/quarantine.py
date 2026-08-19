from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import QuarantineRecord, Alert, AuditLog, Batch, FinalDecision
from app.core.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/quarantine", tags=["Quarantine"])


# ---------- Schemas ----------

class QuarantineCreate(BaseModel):
    incoming_supply_id: Optional[int] = None
    batch_id: Optional[int] = None
    reason: str
    reason_type: Optional[str] = None  # Quality Failure, Compliance Failure, Storage Excursion, etc.
    severity: Optional[str] = "MEDIUM"
    location: Optional[str] = None
    assigned_to: Optional[int] = None


class QuarantineUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    location: Optional[str] = None


class QuarantineOut(BaseModel):
    id: int
    quarantine_number: Optional[str]
    incoming_supply_id: Optional[int]
    batch_id: Optional[int]
    reason: Optional[str]
    reason_type: Optional[str]
    severity: Optional[str]
    status: Optional[str]
    location: Optional[str]
    assigned_to: Optional[int]
    created_at: datetime
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get("", response_model=List[QuarantineOut])
def list_quarantine(
    status: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(QuarantineRecord)
    if status:
        q = q.filter(QuarantineRecord.status == status)
    if batch_id:
        q = q.filter(QuarantineRecord.batch_id == batch_id)
    return q.order_by(QuarantineRecord.created_at.desc()).limit(limit).all()


@router.get("/{quarantine_id}", response_model=QuarantineOut)
def get_quarantine(quarantine_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rec = db.query(QuarantineRecord).filter(QuarantineRecord.id == quarantine_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Quarantine record not found")
    return rec


@router.post("", response_model=QuarantineOut, status_code=201)
def create_quarantine(
    payload: QuarantineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q_number = f"QR-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

    rec = QuarantineRecord(
        quarantine_number=q_number,
        incoming_supply_id=payload.incoming_supply_id,
        batch_id=payload.batch_id,
        reason=payload.reason,
        reason_type=payload.reason_type,
        severity=payload.severity,
        location=payload.location,
        assigned_to=payload.assigned_to,
        status="ACTIVE",
    )
    db.add(rec)

    # Update batch final decision if batch_id provided
    if payload.batch_id:
        batch = db.query(Batch).filter(Batch.id == payload.batch_id).first()
        if batch:
            batch.final_decision = FinalDecision.QUARANTINED

    # Create alert
    db.add(Alert(
        alert_type="QUARANTINE",
        severity=payload.severity or "MEDIUM",
        title=f"Batch Quarantined — {q_number}",
        message=f"Reason: {payload.reason}. Type: {payload.reason_type}. Location: {payload.location}.",
        status="UNREAD",
        entity_type="QuarantineRecord",
        related_batch_id=payload.batch_id,
        related_supply_id=payload.incoming_supply_id,
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        action="QUARANTINE_BATCH",
        entity_type="QuarantineRecord",
        entity_id=q_number,
        new_value=f"Batch {payload.batch_id} quarantined. Reason: {payload.reason}",
    ))

    db.commit()
    db.refresh(rec)
    return rec


@router.put("/{quarantine_id}", response_model=QuarantineOut)
def update_quarantine(
    quarantine_id: int,
    payload: QuarantineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rec = db.query(QuarantineRecord).filter(QuarantineRecord.id == quarantine_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Quarantine record not found")

    for k, v in payload.dict(exclude_none=True).items():
        setattr(rec, k, v)

    if payload.status in ("RELEASED", "REJECTED", "DISPOSED") and not rec.resolved_at:
        rec.resolved_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_QUARANTINE",
        entity_type="QuarantineRecord",
        entity_id=str(rec.quarantine_number),
        new_value=f"Status updated to {payload.status}",
    ))

    db.commit()
    db.refresh(rec)
    return rec
