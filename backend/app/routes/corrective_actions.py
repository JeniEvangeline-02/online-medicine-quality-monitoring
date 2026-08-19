from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import CorrectiveAction, AuditLog
from app.core.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/corrective-actions", tags=["Corrective Actions"])


# ---------- Schemas ----------

class CorrectiveActionCreate(BaseModel):
    reference_type: str   # STORAGE_EXCURSION, TRANSPORT_EXCURSION, RECALL, QUARANTINE
    reference_id: int
    action_type: str      # INVESTIGATE, QUARANTINE, RETEST, RETURN_TO_SUPPLIER, RECALL, DISPOSE, REPLACE, RELEASE
    description: Optional[str] = None
    batch_id: Optional[int] = None
    supply_id: Optional[int] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = "MEDIUM"
    due_date: Optional[datetime] = None


class CorrectiveActionUpdate(BaseModel):
    status: Optional[str] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = None


class CorrectiveActionOut(BaseModel):
    id: int
    action_number: str
    reference_type: str
    reference_id: int
    action_type: str
    description: Optional[str]
    batch_id: Optional[int]
    supply_id: Optional[int]
    assigned_to: Optional[int]
    created_by: Optional[int]
    priority: str
    due_date: Optional[datetime]
    status: str
    completed_at: Optional[datetime]
    completion_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get("", response_model=List[CorrectiveActionOut])
def list_corrective_actions(
    status: Optional[str] = Query(None),
    reference_type: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    assigned_to: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(CorrectiveAction)
    if status:
        q = q.filter(CorrectiveAction.status == status)
    if reference_type:
        q = q.filter(CorrectiveAction.reference_type == reference_type)
    if batch_id:
        q = q.filter(CorrectiveAction.batch_id == batch_id)
    if assigned_to:
        q = q.filter(CorrectiveAction.assigned_to == assigned_to)
    return q.order_by(CorrectiveAction.created_at.desc()).limit(limit).all()


@router.get("/{action_id}", response_model=CorrectiveActionOut)
def get_corrective_action(action_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    return ca


@router.post("", response_model=CorrectiveActionOut, status_code=201)
def create_corrective_action(
    payload: CorrectiveActionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    action_number = f"CA-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

    ca = CorrectiveAction(
        action_number=action_number,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        action_type=payload.action_type,
        description=payload.description,
        batch_id=payload.batch_id,
        supply_id=payload.supply_id,
        assigned_to=payload.assigned_to,
        created_by=current_user.id,
        priority=payload.priority or "MEDIUM",
        due_date=payload.due_date,
        status="OPEN",
    )
    db.add(ca)

    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_CORRECTIVE_ACTION",
        entity_type="CorrectiveAction",
        entity_id=action_number,
        new_value=f"{payload.action_type} for {payload.reference_type}#{payload.reference_id}",
    ))

    db.commit()
    db.refresh(ca)
    return ca


@router.put("/{action_id}", response_model=CorrectiveActionOut)
def update_corrective_action(
    action_id: int,
    payload: CorrectiveActionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective action not found")

    for k, v in payload.dict(exclude_none=True).items():
        setattr(ca, k, v)

    if payload.status == "COMPLETED" and not ca.completed_at:
        ca.completed_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_CORRECTIVE_ACTION",
        entity_type="CorrectiveAction",
        entity_id=str(ca.action_number),
        new_value=f"Status updated to {payload.status}",
    ))

    db.commit()
    db.refresh(ca)
    return ca
