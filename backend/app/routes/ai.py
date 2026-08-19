from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, AIAnomaly
from app.ai.risk_engine import AIRiskEngine
from app.ai.batch_risk import BatchRiskAnalyzer
from app.ai.supplier_risk import SupplierRiskAnalyzer
from app.ai.product_risk import ProductRiskAnalyzer
from app.ai.anomaly_detector import AnomalyDetector
from app.ai.insights import EarlyWarningIntelligence

router = APIRouter(prefix="/ai", tags=["AI Risk Intelligence"])

@router.get("/overview")
def get_ai_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AIRiskEngine.get_overview(db)

@router.get("/batch/{batch_id}")
def get_batch_risk(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BatchRiskAnalyzer.evaluate_batch_risk(db, batch_id, persist=False)

@router.get("/batches")
def list_batch_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AIRiskEngine.get_all_batch_risks(db)

@router.get("/suppliers")
def list_supplier_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AIRiskEngine.get_all_supplier_risks(db)

@router.get("/products")
def list_product_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AIRiskEngine.get_all_product_risks(db)

@router.get("/anomalies")
def list_anomalies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AnomalyDetector.scan_anomalies(db, persist=True)

@router.put("/anomalies/{anomaly_id}/status")
def update_anomaly_status(
    anomaly_id: int,
    status: str = Query(..., regex="^(NEW|ACKNOWLEDGED|INVESTIGATING|RESOLVED)$"),
    resolution_notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    anomaly = db.query(AIAnomaly).filter(AIAnomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found")
    
    anomaly.status = status
    if status == "RESOLVED":
        anomaly.resolved_at = datetime.utcnow()
        if resolution_notes:
            anomaly.resolution_notes = resolution_notes
    elif resolution_notes:
        anomaly.resolution_notes = resolution_notes
        
    db.commit()
    db.refresh(anomaly)
    return {"id": anomaly.id, "status": anomaly.status, "resolution_notes": anomaly.resolution_notes}

@router.get("/early-warnings")
def get_early_warnings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return EarlyWarningIntelligence.generate_early_warnings(db)

@router.post("/recalculate")
def recalculate_risk_intelligence(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AIRiskEngine.recalculate_all(db)
