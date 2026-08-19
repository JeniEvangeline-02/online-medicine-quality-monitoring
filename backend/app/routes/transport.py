from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import Transport, TransportMonitoringRecord, TransportExcursion, Alert, AuditLog
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/transport", tags=["Transport"])


# ---------- Schemas ----------

class TransportCreate(BaseModel):
    transport_id: str
    supplier_id: Optional[int] = None
    batch_id: Optional[int] = None
    source_location: Optional[str] = None
    destination_location: Optional[str] = None
    vehicle_number: Optional[str] = None
    carrier_name: Optional[str] = None
    departure_time: Optional[datetime] = None
    expected_arrival: Optional[datetime] = None
    temperature_min_required: Optional[float] = None
    temperature_max_required: Optional[float] = None
    notes: Optional[str] = None


class TransportUpdate(BaseModel):
    status: Optional[str] = None
    actual_arrival: Optional[datetime] = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None


class TransportOut(BaseModel):
    id: int
    transport_id: str
    supplier_id: Optional[int]
    batch_id: Optional[int]
    source_location: Optional[str]
    destination_location: Optional[str]
    vehicle_number: Optional[str]
    carrier_name: Optional[str]
    departure_time: Optional[datetime]
    expected_arrival: Optional[datetime]
    actual_arrival: Optional[datetime]
    temperature_min_required: Optional[float]
    temperature_max_required: Optional[float]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransportMonitoringCreate(BaseModel):
    transport_id: int
    recorded_temperature: Optional[float] = None
    recorded_humidity: Optional[float] = None
    recorded_at: datetime
    source: Optional[str] = "MANUAL"
    location_at_time: Optional[str] = None
    notes: Optional[str] = None


class TransportMonitoringOut(BaseModel):
    id: int
    transport_id: int
    recorded_temperature: Optional[float]
    recorded_humidity: Optional[float]
    recorded_at: datetime
    source: str
    temperature_status: str
    humidity_status: str
    overall_status: str
    location_at_time: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransportExcursionCreate(BaseModel):
    transport_id: int
    batch_id: Optional[int] = None
    parameter: str
    expected_min: Optional[float] = None
    expected_max: Optional[float] = None
    observed_value: float
    severity: str
    start_time: datetime
    notes: Optional[str] = None


class TransportExcursionOut(BaseModel):
    id: int
    transport_id: int
    batch_id: Optional[int]
    parameter: str
    expected_min: Optional[float]
    expected_max: Optional[float]
    observed_value: float
    severity: str
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Helpers ----------

def _temp_status(value: float, t_min: Optional[float], t_max: Optional[float]) -> str:
    if value is None or t_min is None or t_max is None:
        return "NORMAL"
    if value < t_min or value > t_max:
        diff = abs(value - (t_min if value < t_min else t_max))
        return "CRITICAL" if diff > 5 else "WARNING"
    return "NORMAL"


# ---------- Endpoints ----------

@router.get("", response_model=List[TransportOut])
def list_transports(
    status: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Transport)
    if status:
        q = q.filter(Transport.status == status)
    if batch_id:
        q = q.filter(Transport.batch_id == batch_id)
    return q.order_by(Transport.created_at.desc()).limit(limit).all()


@router.post("", response_model=TransportOut, status_code=201)
def create_transport(
    payload: TransportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Transport).filter(Transport.transport_id == payload.transport_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Transport ID already exists")
    t = Transport(**payload.dict(), created_by=current_user.id)
    db.add(t)
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_TRANSPORT",
        entity_type="Transport",
        entity_id=payload.transport_id,
        new_value=f"Batch {payload.batch_id} → {payload.destination_location}",
    ))
    db.commit()
    db.refresh(t)
    return t


@router.get("/{transport_id}", response_model=TransportOut)
def get_transport(transport_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    t = db.query(Transport).filter(Transport.id == transport_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transport not found")
    return t


@router.put("/{transport_id}", response_model=TransportOut)
def update_transport(
    transport_id: int,
    payload: TransportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = db.query(Transport).filter(Transport.id == transport_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transport not found")
    for k, v in payload.dict(exclude_none=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


# ---------- Monitoring ----------

@router.get("/monitoring/records", response_model=List[TransportMonitoringOut])
def list_transport_monitoring(
    transport_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(TransportMonitoringRecord)
    if transport_id:
        q = q.filter(TransportMonitoringRecord.transport_id == transport_id)
    return q.order_by(TransportMonitoringRecord.recorded_at.desc()).limit(limit).all()


@router.post("/monitoring", response_model=TransportMonitoringOut, status_code=201)
def add_transport_monitoring(
    payload: TransportMonitoringCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = db.query(Transport).filter(Transport.id == payload.transport_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transport not found")

    temp_status = _temp_status(payload.recorded_temperature, t.temperature_min_required, t.temperature_max_required)
    hum_status = "NORMAL"
    overall = "CRITICAL" if temp_status == "CRITICAL" else ("WARNING" if temp_status == "WARNING" else "NORMAL")

    rec = TransportMonitoringRecord(
        transport_id=payload.transport_id,
        recorded_temperature=payload.recorded_temperature,
        recorded_humidity=payload.recorded_humidity,
        recorded_at=payload.recorded_at,
        source=payload.source or "MANUAL",
        temperature_status=temp_status,
        humidity_status=hum_status,
        overall_status=overall,
        recorded_by=current_user.id,
        location_at_time=payload.location_at_time,
        notes=payload.notes,
    )
    db.add(rec)

    if overall in ("WARNING", "CRITICAL"):
        db.add(Alert(
            alert_type="TRANSPORT_EXCURSION",
            severity=overall,
            title=f"Transport {overall}: {t.transport_id}",
            message=f"Temperature={payload.recorded_temperature}°C — {overall} detected during transport.",
            status="UNREAD",
            entity_type="Transport",
            entity_id=str(t.id),
            related_batch_id=t.batch_id,
        ))

    db.commit()
    db.refresh(rec)
    return rec


# ---------- Excursions ----------

@router.get("/excursions/list", response_model=List[TransportExcursionOut])
def list_transport_excursions(
    transport_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(TransportExcursion)
    if transport_id:
        q = q.filter(TransportExcursion.transport_id == transport_id)
    if status:
        q = q.filter(TransportExcursion.status == status)
    return q.order_by(TransportExcursion.start_time.desc()).all()


@router.post("/excursions", response_model=TransportExcursionOut, status_code=201)
def create_transport_excursion(
    payload: TransportExcursionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exc = TransportExcursion(
        transport_id=payload.transport_id,
        batch_id=payload.batch_id,
        parameter=payload.parameter,
        expected_min=payload.expected_min,
        expected_max=payload.expected_max,
        observed_value=payload.observed_value,
        severity=payload.severity,
        start_time=payload.start_time,
        resolution_notes=payload.notes,
        created_by=current_user.id,
    )
    db.add(exc)
    db.add(Alert(
        alert_type="TRANSPORT_EXCURSION",
        severity=payload.severity,
        title=f"Transport Excursion — {payload.parameter}",
        message=f"Observed: {payload.observed_value}. Range: {payload.expected_min}-{payload.expected_max}. Transport ID: {payload.transport_id}.",
        status="UNREAD",
        entity_type="TransportExcursion",
        related_batch_id=payload.batch_id,
    ))
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_TRANSPORT_EXCURSION",
        entity_type="TransportExcursion",
        entity_id="new",
        new_value=f"{payload.parameter} excursion on transport {payload.transport_id}",
    ))
    db.commit()
    db.refresh(exc)
    return exc


@router.put("/excursions/{excursion_id}/resolve", response_model=TransportExcursionOut)
def resolve_transport_excursion(
    excursion_id: int,
    resolution_notes: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exc = db.query(TransportExcursion).filter(TransportExcursion.id == excursion_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Excursion not found")
    exc.status = "RESOLVED"
    exc.resolution_notes = resolution_notes
    exc.end_time = datetime.utcnow()
    db.commit()
    db.refresh(exc)
    return exc
