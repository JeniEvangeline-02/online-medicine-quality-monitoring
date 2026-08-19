from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import Recall, Batch, RecallStatus, Alert, AuditLog
from app.core.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/recalls", tags=["Recalls"])


# ---------- Schemas ----------

class RecallCreate(BaseModel):
    batch_id: int
    product_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    severity: Optional[str] = "HIGH"
    instructions: Optional[str] = None
    recall_date: Optional[datetime] = None


class RecallUpdate(BaseModel):
    status: Optional[str] = None
    instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    affected_supplies_count: Optional[int] = None


class RecallOut(BaseModel):
    id: int
    recall_number: str
    batch_id: Optional[int]
    product_id: Optional[int]
    reason: Optional[str]
    description: Optional[str]
    severity: Optional[str]
    recall_date: Optional[datetime]
    instructions: Optional[str]
    status: Optional[str]
    affected_supplies_count: int
    completed_at: Optional[datetime]
    issued_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get("", response_model=List[RecallOut])
def list_recalls(
    status: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    product_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Recall)
    if status:
        q = q.filter(Recall.status == status)
    if batch_id:
        q = q.filter(Recall.batch_id == batch_id)
    if product_id:
        q = q.filter(Recall.product_id == product_id)
    return q.order_by(Recall.created_at.desc()).limit(limit).all()


@router.get("/{recall_id}", response_model=RecallOut)
def get_recall(recall_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rec = db.query(Recall).filter(Recall.id == recall_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recall not found")
    return rec


@router.post("", response_model=RecallOut, status_code=201)
def initiate_recall(
    payload: RecallCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = db.query(Batch).filter(Batch.id == payload.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    recall_number = f"RC-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

    rec = Recall(
        recall_number=recall_number,
        batch_id=payload.batch_id,
        product_id=payload.product_id or batch.product_id,
        reason=payload.reason,
        description=payload.description,
        severity=payload.severity,
        recall_date=payload.recall_date or datetime.utcnow(),
        instructions=payload.instructions,
        status="ACTIVE",
        issued_by=current_user.id,
        affected_supplies_count=0,
    )
    db.add(rec)

    # Update batch recall status
    batch.recall_status = RecallStatus.RECALLED

    # Create high-priority alert
    db.add(Alert(
        alert_type="RECALL",
        severity=payload.severity or "HIGH",
        title=f"RECALL INITIATED — {recall_number}",
        message=f"Batch {batch.batch_number} recalled. Reason: {payload.reason}.",
        status="UNREAD",
        entity_type="Recall",
        related_batch_id=payload.batch_id,
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        action="INITIATE_RECALL",
        entity_type="Recall",
        entity_id=recall_number,
        new_value=f"Batch {batch.batch_number} recalled. Severity: {payload.severity}. Reason: {payload.reason}",
    ))

    db.commit()
    db.refresh(rec)
    return rec


@router.put("/{recall_id}", response_model=RecallOut)
def update_recall(
    recall_id: int,
    payload: RecallUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rec = db.query(Recall).filter(Recall.id == recall_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recall not found")

    for k, v in payload.dict(exclude_none=True).items():
        setattr(rec, k, v)

    if payload.status == "COMPLETED" and not rec.completed_at:
        rec.completed_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_RECALL",
        entity_type="Recall",
        entity_id=str(rec.recall_number),
        new_value=f"Status updated to {payload.status}",
    ))

    db.commit()
    db.refresh(rec)
    return rec
