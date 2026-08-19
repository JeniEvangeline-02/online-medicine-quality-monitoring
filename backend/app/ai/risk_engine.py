from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import Batch, Supplier, Product, AIRiskAssessment, AIAnomaly
from app.ai.batch_risk import BatchRiskAnalyzer
from app.ai.supplier_risk import SupplierRiskAnalyzer
from app.ai.product_risk import ProductRiskAnalyzer
from app.ai.anomaly_detector import AnomalyDetector
from app.ai.insights import EarlyWarningIntelligence

class AIRiskEngine:
    ALGORITHM_VERSION = "risk-engine-v1"

    @classmethod
    def get_overview(cls, db: Session) -> Dict[str, Any]:
        """Assembles executive AI risk intelligence overview."""
        batches = db.query(Batch).all()
        batch_risks = [BatchRiskAnalyzer.evaluate_batch_risk(db, b.id, persist=False) for b in batches]
        
        critical_count = sum(1 for r in batch_risks if r["risk_level"] == "CRITICAL")
        high_count = sum(1 for r in batch_risks if r["risk_level"] == "HIGH")
        medium_count = sum(1 for r in batch_risks if r["risk_level"] == "MEDIUM")
        low_count = sum(1 for r in batch_risks if r["risk_level"] == "LOW")

        suppliers = db.query(Supplier).all()
        supplier_risks = [SupplierRiskAnalyzer.evaluate_supplier_risk(db, s.id, persist=False) for s in suppliers]
        high_risk_suppliers = sum(1 for s in supplier_risks if s["risk_level"] in ["HIGH", "CRITICAL"])

        anomalies = AnomalyDetector.scan_anomalies(db, persist=True)
        open_anomalies = sum(1 for a in anomalies if a["status"] in ["NEW", "ACKNOWLEDGED", "INVESTIGATING"])

        early_warnings = EarlyWarningIntelligence.generate_early_warnings(db)

        # Average Risk Score
        avg_risk = round(sum(r["risk_score"] for r in batch_risks) / len(batch_risks), 1) if batch_risks else 0.0

        return {
            "algorithm_version": cls.ALGORITHM_VERSION,
            "total_evaluated_batches": len(batch_risks),
            "critical_risk_batches": critical_count,
            "high_risk_batches": high_count,
            "medium_risk_batches": medium_count,
            "low_risk_batches": low_count,
            "high_risk_suppliers": high_risk_suppliers,
            "open_anomalies_count": open_anomalies,
            "active_early_warnings_count": len(early_warnings),
            "average_risk_score": avg_risk,
            "risk_distribution": {
                "CRITICAL": critical_count,
                "HIGH": high_count,
                "MEDIUM": medium_count,
                "LOW": low_count
            },
            "recent_anomalies": anomalies[:5],
            "early_warnings": early_warnings
        }

    @classmethod
    def get_all_batch_risks(cls, db: Session) -> List[Dict[str, Any]]:
        batches = db.query(Batch).order_by(Batch.created_at.desc()).all()
        results = [BatchRiskAnalyzer.evaluate_batch_risk(db, b.id, persist=False) for b in batches]
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        results.sort(key=lambda x: (sev_order.get(x["risk_level"], 4), -x["risk_score"]))
        return results

    @classmethod
    def get_all_supplier_risks(cls, db: Session) -> List[Dict[str, Any]]:
        suppliers = db.query(Supplier).all()
        results = [SupplierRiskAnalyzer.evaluate_supplier_risk(db, s.id, persist=False) for s in suppliers]
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        results.sort(key=lambda x: (sev_order.get(x["risk_level"], 4), -x["risk_score"]))
        return results

    @classmethod
    def get_all_product_risks(cls, db: Session) -> List[Dict[str, Any]]:
        products = db.query(Product).all()
        results = [ProductRiskAnalyzer.evaluate_product_risk(db, p.id, persist=False) for p in products]
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        results.sort(key=lambda x: (sev_order.get(x["risk_level"], 4), -x["risk_score"]))
        return results

    @classmethod
    def recalculate_all(cls, db: Session) -> Dict[str, Any]:
        """Triggers complete audit-logged recalculation across all entities."""
        batches = db.query(Batch).all()
        for b in batches:
            BatchRiskAnalyzer.evaluate_batch_risk(db, b.id, persist=True)
        
        suppliers = db.query(Supplier).all()
        for s in suppliers:
            SupplierRiskAnalyzer.evaluate_supplier_risk(db, s.id, persist=True)

        products = db.query(Product).all()
        for p in products:
            ProductRiskAnalyzer.evaluate_product_risk(db, p.id, persist=True)

        AnomalyDetector.scan_anomalies(db, persist=True)

        return {"status": "success", "message": "All AI risk assessments and anomaly scans recalculated and audit logged."}
