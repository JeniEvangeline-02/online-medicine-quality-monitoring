from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database.database import get_db
from app.models import (
    StorageLocation, StorageMonitoringRecord, StorageExcursion, Alert, AuditLog
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/storage", tags=["Storage"])


# ---------- Schemas ----------

class StorageLocationCreate(BaseModel):
    name: str
    location_code: str
    hospital_id: Optional[int] = None
    minimum_temperature: Optional[float] = None
    maximum_temperature: Optional[float] = None
    minimum_humidity: Optional[float] = None
    maximum_humidity: Optional[float] = None
    status: Optional[str] = "ACTIVE"


class StorageLocationOut(BaseModel):
    id: int
    name: str
    location_code: str
    hospital_id: Optional[int]
    minimum_temperature: Optional[float]
    maximum_temperature: Optional[float]
    minimum_humidity: Optional[float]
    maximum_humidity: Optional[float]
    status: Optional[str]

    class Config:
        from_attributes = True


class MonitoringRecordCreate(BaseModel):
    storage_location_id: int
    recorded_temperature: Optional[float] = None
    recorded_humidity: Optional[float] = None
    recorded_at: datetime
    source: Optional[str] = "MANUAL"
    batch_id: Optional[int] = None
    notes: Optional[str] = None


class MonitoringRecordOut(BaseModel):
    id: int
    storage_location_id: int
    recorded_temperature: Optional[float]
    recorded_humidity: Optional[float]
    recorded_at: datetime
    source: str
    temperature_status: str
    humidity_status: str
    overall_status: str
    batch_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ExcursionCreate(BaseModel):
    storage_location_id: int
    batch_id: Optional[int] = None
    parameter: str  # TEMPERATURE or HUMIDITY
    expected_min: Optional[float] = None
    expected_max: Optional[float] = None
    observed_value: float
    severity: str  # WARNING or CRITICAL
    start_time: datetime
    notes: Optional[str] = None


class ExcursionOut(BaseModel):
    id: int
    storage_location_id: int
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


class ExcursionResolve(BaseModel):
    resolution_notes: str
    end_time: Optional[datetime] = None


# ---------- Helpers ----------

def _classify_temperature(value: float, loc: StorageLocation):
    if loc.minimum_temperature is None or loc.maximum_temperature is None:
        return "NORMAL"
    if value < loc.minimum_temperature or value > loc.maximum_temperature:
        diff = abs(value - (loc.minimum_temperature if value < loc.minimum_temperature else loc.maximum_temperature))
        return "CRITICAL" if diff > 5 else "WARNING"
    return "NORMAL"


def _classify_humidity(value: float, loc: StorageLocation):
    if loc.minimum_humidity is None or loc.maximum_humidity is None:
        return "NORMAL"
    if value < loc.minimum_humidity or value > loc.maximum_humidity:
        return "WARNING"
    return "NORMAL"


# ---------- Endpoints: Storage Locations ----------

@router.get("/locations", response_model=List[StorageLocationOut])
def list_locations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(StorageLocation).all()


@router.post("/locations", response_model=StorageLocationOut, status_code=201)
def create_location(
    payload: StorageLocationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(StorageLocation).filter(StorageLocation.location_code == payload.location_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location code already exists")
    loc = StorageLocation(**payload.dict())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/locations/{location_id}", response_model=StorageLocationOut)
def get_location(location_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    loc = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


# ---------- Endpoints: Monitoring Records ----------

@router.get("/monitoring", response_model=List[MonitoringRecordOut])
def list_monitoring(
    storage_location_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(StorageMonitoringRecord)
    if storage_location_id:
        q = q.filter(StorageMonitoringRecord.storage_location_id == storage_location_id)
    if batch_id:
        q = q.filter(StorageMonitoringRecord.batch_id == batch_id)
    return q.order_by(StorageMonitoringRecord.recorded_at.desc()).limit(limit).all()


@router.post("/monitoring", response_model=MonitoringRecordOut, status_code=201)
def add_monitoring_record(
    payload: MonitoringRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    loc = db.query(StorageLocation).filter(StorageLocation.id == payload.storage_location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Storage location not found")

    temp_status = _classify_temperature(payload.recorded_temperature, loc) if payload.recorded_temperature is not None else "NORMAL"
    hum_status = _classify_humidity(payload.recorded_humidity, loc) if payload.recorded_humidity is not None else "NORMAL"
    statuses = [temp_status, hum_status]
    overall = "CRITICAL" if "CRITICAL" in statuses else ("WARNING" if "WARNING" in statuses else "NORMAL")

    record = StorageMonitoringRecord(
        storage_location_id=payload.storage_location_id,
        recorded_temperature=payload.recorded_temperature,
        recorded_humidity=payload.recorded_humidity,
        recorded_at=payload.recorded_at,
        source=payload.source or "MANUAL",
        temperature_status=temp_status,
        humidity_status=hum_status,
        overall_status=overall,
        recorded_by=current_user.id,
        batch_id=payload.batch_id,
        notes=payload.notes,
    )
    db.add(record)

    # Auto-generate alert for warnings/critical
    if overall in ("WARNING", "CRITICAL"):
        alert = Alert(
            alert_type="STORAGE_EXCURSION",
            severity=overall,
            title=f"Storage {overall}: {loc.name}",
            message=f"Temperature={payload.recorded_temperature}°C, Humidity={payload.recorded_humidity}% — {overall} condition detected.",
            status="UNREAD",
            entity_type="StorageLocation",
            entity_id=str(loc.id),
        )
        db.add(alert)

    db.commit()
    db.refresh(record)
    return record


# ---------- Endpoints: Excursions ----------

@router.get("/excursions", response_model=List[ExcursionOut])
def list_excursions(
    storage_location_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(StorageExcursion)
    if storage_location_id:
        q = q.filter(StorageExcursion.storage_location_id == storage_location_id)
    if status:
        q = q.filter(StorageExcursion.status == status)
    return q.order_by(StorageExcursion.start_time.desc()).all()


@router.post("/excursions", response_model=ExcursionOut, status_code=201)
def create_excursion(
    payload: ExcursionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exc = StorageExcursion(
        storage_location_id=payload.storage_location_id,
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

    # Generate alert
    alert = Alert(
        alert_type="STORAGE_EXCURSION",
        severity=payload.severity,
        title=f"Storage Excursion — {payload.parameter}",
        message=f"Observed: {payload.observed_value}. Range: {payload.expected_min}-{payload.expected_max}. Batch ID: {payload.batch_id}.",
        status="UNREAD",
        entity_type="StorageExcursion",
        related_batch_id=payload.batch_id,
    )
    db.add(alert)

    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_STORAGE_EXCURSION",
        entity_type="StorageExcursion",
        entity_id="new",
        new_value=f"{payload.parameter} excursion at location {payload.storage_location_id}",
    ))
    db.commit()
    db.refresh(exc)
    return exc


@router.put("/excursions/{excursion_id}/resolve", response_model=ExcursionOut)
def resolve_excursion(
    excursion_id: int,
    payload: ExcursionResolve,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exc = db.query(StorageExcursion).filter(StorageExcursion.id == excursion_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Excursion not found")
    exc.status = "RESOLVED"
    exc.resolution_notes = payload.resolution_notes
    exc.end_time = payload.end_time or datetime.utcnow()
    db.commit()
    db.refresh(exc)
    return exc
