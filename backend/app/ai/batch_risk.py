from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json
from app.models import (
    Batch, Product, Supplier, QualityTest, QualityTestResult, ComplianceEvaluation,
    StorageExcursion, TransportExcursion, Recall, QuarantineRecord, AIRiskAssessment
)

class BatchRiskAnalyzer:
    ALGORITHM_VERSION = "risk-engine-v1"

    @classmethod
    def evaluate_batch_risk(cls, db: Session, batch_id: int, persist: bool = True) -> Dict[str, Any]:
        """Calculates an explainable 0-100 risk score and factor contributions for a batch."""
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if not batch:
            return {
                "batch_id": batch_id,
                "risk_score": 0.0,
                "risk_level": "LOW",
                "factors": {},
                "explanation": "Batch record not found.",
                "confidence_score": 0.0,
                "confidence_reason": "No data",
                "recommendations": []
            }

        factors: Dict[str, float] = {}
        explanation_points: List[str] = []
        recommendations: List[str] = []

        # 1. Quality Testing Factors
        tests = db.query(QualityTest).filter(QualityTest.batch_id == batch.id).all()
        test_failures = sum(1 for t in tests if t.overall_result == "FAIL")

        crit_failures = (
            db.query(QualityTestResult)
            .join(QualityTest, QualityTestResult.quality_test_id == QualityTest.id)
            .filter(QualityTest.batch_id == batch.id, QualityTestResult.is_critical_failure == True)
            .count()
        )

        if crit_failures > 0:
            factors["Critical Lab Defects"] = min(crit_failures * 35.0, 45.0)
            explanation_points.append(f"{crit_failures} critical laboratory test failure(s) recorded")
            recommendations.append("Immediate laboratory retest protocol required with supervisor sign-off")
        elif test_failures > 0:
            factors["Quality Test Failures"] = min(test_failures * 20.0, 30.0)
            explanation_points.append(f"{test_failures} non-critical quality test parameter failure(s)")
            recommendations.append("Schedule secondary parameter re-verification")

        # 2. Environmental Storage Excursions
        storage_excs = db.query(StorageExcursion).filter(StorageExcursion.batch_id == batch.id).all()
        crit_storage = sum(1 for s in storage_excs if s.severity == "CRITICAL" and s.status == "OPEN")
        warn_storage = sum(1 for s in storage_excs if s.severity == "WARNING" or s.status == "OPEN")

        if crit_storage > 0:
            factors["Critical Storage Excursions"] = min(crit_storage * 25.0, 35.0)
            explanation_points.append(f"{crit_storage} open critical cold-room temperature excursion(s)")
            recommendations.append("Isolate batch in secondary validated cold storage facility")
        elif warn_storage > 0:
            factors["Storage Excursions"] = min(warn_storage * 12.0, 20.0)
            explanation_points.append(f"{warn_storage} storage environmental threshold warning(s)")

        # 3. Transport In-Transit Integrity
        trans_excs = db.query(TransportExcursion).filter(TransportExcursion.batch_id == batch.id).all()
        if len(trans_excs) > 0:
            factors["Transport Excursions"] = min(len(trans_excs) * 15.0, 25.0)
            explanation_points.append(f"{len(trans_excs)} shipping temperature excursion(s) logged in transit")
            recommendations.append("Inspect thermal packaging and data logger integrity")

        # 4. Recall & Quarantine History
        active_recalls = db.query(Recall).filter(Recall.batch_id == batch.id, Recall.status == "ACTIVE").count()
        if active_recalls > 0:
            factors["Active Recall Directive"] = 40.0
            explanation_points.append("Batch is subject to an ACTIVE product recall campaign")
            recommendations.append("Enforce immediate physical lock and hospital pharmacy retrieval")

        quarantines = db.query(QuarantineRecord).filter(
            QuarantineRecord.batch_id == batch.id,
            QuarantineRecord.status.in_(["ACTIVE", "UNDER_REVIEW"])
        ).count()
        if quarantines > 0:
            factors["Quarantine Containment"] = 25.0
            explanation_points.append("Active quarantine containment protocol in progress")

        # 5. Expiry Proximity
        if batch.expiry_date:
            days_to_expiry = (batch.expiry_date - datetime.utcnow()).days
            if days_to_expiry < 0:
                factors["Expired Shelf-Life"] = 35.0
                explanation_points.append(f"Batch expired {abs(days_to_expiry)} days ago")
                recommendations.append("Dispose of batch in compliance with biohazard destruction protocols")
            elif days_to_expiry <= 30:
                factors["Near Expiry (<30 days)"] = 15.0
                explanation_points.append(f"Batch expires soon in {days_to_expiry} days")
                recommendations.append("Prioritize dispensing or return to manufacturer prior to expiry")
            elif days_to_expiry <= 90:
                factors["Approaching Expiry (<90 days)"] = 5.0

        # 6. Supplier Defect History Weight
        if batch.supplier_id:
            supplier_fails = db.query(Batch).filter(
                Batch.supplier_id == batch.supplier_id,
                Batch.quality_status == "FAILED"
            ).count()
            if supplier_fails >= 3:
                factors["Vendor Defect History"] = 12.0
                explanation_points.append(f"Supplier has {supplier_fails} historical batch failures")
                recommendations.append("Increase incoming sampling frequency for this vendor")

        # Compute Total Risk Score (Bounded 0-100)
        total_score = min(round(sum(factors.values()), 1), 100.0)

        # Categorize Risk Level
        if total_score >= 75.0 or active_recalls > 0:
            risk_level = "CRITICAL"
        elif total_score >= 50.0:
            risk_level = "HIGH"
        elif total_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate Explainable Narrative
        if len(explanation_points) == 0:
            explanation = f"Batch {batch.batch_number} exhibits a LOW risk profile with no laboratory defects, zero environmental excursions, and compliant supplier history."
            recommendations.append("Continue routine good manufacturing and storage practices")
        else:
            explanation = f"Batch {batch.batch_number} has been classified as {risk_level} risk (score: {total_score}/100) primarily due to: " + "; ".join(explanation_points) + "."

        # Confidence Score calculation
        # If batch has tests and storage telemetry -> 95-100% confidence
        # If new batch without tests -> 65% with insufficient data reason
        if len(tests) > 0:
            confidence = 96.0
            conf_reason = "HIGH (Verified lab tests and supply chain history available)"
        else:
            confidence = 70.0
            conf_reason = "MODERATE (Preliminary assessment pending full laboratory test results)"

        result = {
            "batch_id": batch.id,
            "batch_number": batch.batch_number,
            "product_name": batch.product.name if batch.product else "Unknown",
            "product_code": batch.product.product_code if batch.product else "—",
            "supplier_name": batch.supplier.name if batch.supplier else "Unknown",
            "risk_score": total_score,
            "risk_level": risk_level,
            "factors": factors,
            "explanation": explanation,
            "confidence_score": confidence,
            "confidence_reason": conf_reason,
            "recommendations": recommendations,
            "algorithm_version": cls.ALGORITHM_VERSION,
            "compliance_decision": batch.final_decision.value if hasattr(batch.final_decision, 'value') else str(batch.final_decision),
            "quality_status": batch.quality_status.value if hasattr(batch.quality_status, 'value') else str(batch.quality_status)
        }

        # Persist audit assessment in database
        if persist:
            assessment = AIRiskAssessment(
                entity_type="BATCH",
                entity_id=batch.id,
                risk_score=total_score,
                risk_level=risk_level,
                factors=json.dumps(factors),
                explanation=explanation,
                confidence_score=confidence,
                confidence_reason=conf_reason,
                recommendations=json.dumps(recommendations),
                algorithm_version=cls.ALGORITHM_VERSION
            )
            db.add(assessment)
            db.commit()

        return result
