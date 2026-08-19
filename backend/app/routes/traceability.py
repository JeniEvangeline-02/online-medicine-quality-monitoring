from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import TraceabilityEvent, AuditLog
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/traceability", tags=["Traceability"])


# ---------- Schemas ----------

class TraceabilityEventCreate(BaseModel):
    entity_type: str
    entity_id: int
    event_type: str
    location: Optional[str] = None
    reference_id: Optional[str] = None
    remarks: Optional[str] = None
    metadata_json: Optional[str] = None


class TraceabilityEventOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    event_type: str
    location: Optional[str]
    performed_by: Optional[int]
    timestamp: datetime
    reference_id: Optional[str]
    remarks: Optional[str]
    metadata_json: Optional[str]

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get("/events", response_model=List[TraceabilityEventOut])
def list_events(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(TraceabilityEvent)
    if entity_type:
        q = q.filter(TraceabilityEvent.entity_type == entity_type)
    if entity_id:
        q = q.filter(TraceabilityEvent.entity_id == entity_id)
    if event_type:
        q = q.filter(TraceabilityEvent.event_type == event_type)
    return q.order_by(TraceabilityEvent.timestamp.desc()).limit(limit).all()


@router.get("/events/{event_id}", response_model=TraceabilityEventOut)
def get_event(event_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ev = db.query(TraceabilityEvent).filter(TraceabilityEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


@router.post("/events", response_model=TraceabilityEventOut, status_code=201)
def create_event(
    payload: TraceabilityEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ev = TraceabilityEvent(
        **payload.dict(),
        performed_by=current_user.id,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Audit
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_TRACEABILITY_EVENT",
        entity_type="TraceabilityEvent",
        entity_id=str(ev.id),
        new_value=f"{payload.entity_type}#{payload.entity_id} — {payload.event_type}",
    ))
    db.commit()
    return ev
