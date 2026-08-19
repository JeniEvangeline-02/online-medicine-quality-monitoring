from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import Alert, AuditLog
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ---------- Schemas ----------

class AlertCreate(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    related_batch_id: Optional[int] = None
    related_supply_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    assigned_to: Optional[int] = None


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    alert_type: Optional[str]
    severity: Optional[str]
    title: Optional[str]
    message: Optional[str]
    related_batch_id: Optional[int]
    related_supply_id: Optional[int]
    is_read: bool
    status: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[str]
    assigned_to: Optional[int]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@router.get("", response_model=List[AlertOut])
def list_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status)
    if severity:
        q = q.filter(Alert.severity == severity)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    if is_read is not None:
        q = q.filter(Alert.is_read == is_read)
    return q.order_by(Alert.created_at.desc()).limit(limit).all()


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("", response_model=AlertOut, status_code=201)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = Alert(
        alert_type=payload.alert_type,
        severity=payload.severity,
        title=payload.title,
        message=payload.message,
        related_batch_id=payload.related_batch_id,
        related_supply_id=payload.related_supply_id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        assigned_to=payload.assigned_to,
        status="UNREAD",
        is_read=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "ACKNOWLEDGED"
    alert.is_read = True
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    return {"message": "Alert acknowledged", "id": alert_id}


@router.put("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    resolution_notes: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "RESOLVED"
    alert.is_read = True
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = resolution_notes
    db.add(AuditLog(
        user_id=current_user.id,
        action="RESOLVE_ALERT",
        entity_type="Alert",
        entity_id=str(alert_id),
        new_value=f"Resolved: {resolution_notes}",
    ))
    db.commit()
    return {"message": "Alert resolved", "id": alert_id}


@router.put("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    for k, v in payload.dict(exclude_none=True).items():
        setattr(alert, k, v)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    alert.status = "RESOLVED"
    db.commit()
    return {"message": "Alert dismissed", "id": alert_id}
