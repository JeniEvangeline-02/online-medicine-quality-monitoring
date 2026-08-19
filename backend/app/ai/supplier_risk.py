from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
from app.models import Supplier, Batch, IncomingSupply, QualityTest, Recall, Certificate, AIRiskAssessment

class SupplierRiskAnalyzer:
    ALGORITHM_VERSION = "risk-engine-v1"

    @classmethod
    def evaluate_supplier_risk(cls, db: Session, supplier_id: int, persist: bool = True) -> Dict[str, Any]:
        """Calculates supplier risk score with sample-size awareness and explainable factors."""
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return {
                "supplier_id": supplier_id,
                "risk_score": 0.0,
                "risk_level": "LOW",
                "explanation": "Supplier not found."
            }

        supplies = db.query(IncomingSupply).join(Batch).filter(Batch.supplier_id == supplier.id).all()
        total_supplies = len(supplies)
        
        # Sample size sufficiency check
        if total_supplies < 2:
            explanation = "Insufficient historical data for reliable supplier risk assessment (fewer than 2 historical shipments recorded)."
            result = {
                "supplier_id": supplier.id,
                "name": supplier.name,
                "registration_number": supplier.registration_number,
                "total_supplies": total_supplies,
                "risk_score": 10.0,
                "risk_level": "LOW",
                "factors": {"New Supplier Baseline": 10.0},
                "explanation": explanation,
                "confidence_score": 35.0,
                "confidence_reason": "Insufficient historical data",
                "recommendations": ["Perform thorough inspection on incoming shipments until profile baseline is established"],
                "algorithm_version": cls.ALGORITHM_VERSION
            }
            return result

        rejections = sum(1 for s in supplies if s.final_decision == "REJECTED")
        quarantines = sum(1 for s in supplies if s.final_decision == "QUARANTINED")
        rejection_rate = (rejections / total_supplies) * 100
        quarantine_rate = (quarantines / total_supplies) * 100

        # Certificate status — certificates are linked through batches
        supplier_batch_ids = [b.id for b in db.query(Batch).filter(Batch.supplier_id == supplier.id).all()]
        certs = db.query(Certificate).filter(Certificate.batch_id.in_(supplier_batch_ids)).all() if supplier_batch_ids else []
        expired_certs = sum(1 for c in certs if c.verification_status == "EXPIRED")
        
        # Recall involvement
        recall_count = db.query(Recall).join(Batch).filter(Batch.supplier_id == supplier.id).count()

        factors: Dict[str, float] = {}
        explanation_points: List[str] = []
        recommendations: List[str] = []

        if rejection_rate > 20.0:
            factors["Elevated Rejection Rate"] = min(rejection_rate * 0.8, 40.0)
            explanation_points.append(f"High rejection rate of {rejection_rate:.1f}% across {total_supplies} deliveries")
            recommendations.append("Issue formal Corrective Action Request (CAPA) to vendor management")
        elif rejection_rate > 0:
            factors["Shipment Rejections"] = min(rejection_rate * 0.5, 20.0)
            explanation_points.append(f"{rejections} rejected supply delivery recorded")

        if quarantine_rate > 20.0:
            factors["Frequent Quarantines"] = min(quarantine_rate * 0.5, 25.0)
            explanation_points.append(f"Quarantine rate of {quarantine_rate:.1f}%")

        if expired_certs > 0:
            factors["Expired Compliance Certificates"] = min(expired_certs * 15.0, 30.0)
            explanation_points.append(f"{expired_certs} expired GMP/Quality certificate(s) on file")
            recommendations.append("Suspend new procurement orders pending valid certificate renewal")

        if recall_count > 0:
            factors["Product Recall Association"] = min(recall_count * 20.0, 35.0)
            explanation_points.append(f"Associated with {recall_count} product recall event(s)")

        total_score = min(round(sum(factors.values()), 1), 100.0)

        if total_score >= 70.0:
            risk_level = "CRITICAL"
        elif total_score >= 45.0:
            risk_level = "HIGH"
        elif total_score >= 20.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if not explanation_points:
            explanation = f"Supplier {supplier.name} maintains a robust compliance track record with 0 rejections across {total_supplies} shipments."
            recommendations.append("Maintain preferred vendor procurement status")
        else:
            explanation = f"Supplier {supplier.name} classified as {risk_level} risk due to: " + "; ".join(explanation_points) + "."

        confidence = 92.0 if total_supplies >= 10 else 75.0
        conf_reason = "HIGH (Large dataset)" if total_supplies >= 10 else "MODERATE (Moderate dataset)"

        result = {
            "supplier_id": supplier.id,
            "name": supplier.name,
            "registration_number": supplier.registration_number,
            "total_supplies": total_supplies,
            "rejections": rejections,
            "quarantines": quarantines,
            "rejection_rate": round(rejection_rate, 1),
            "risk_score": total_score,
            "risk_level": risk_level,
            "factors": factors,
            "explanation": explanation,
            "confidence_score": confidence,
            "confidence_reason": conf_reason,
            "recommendations": recommendations,
            "algorithm_version": cls.ALGORITHM_VERSION
        }

        if persist:
            assessment = AIRiskAssessment(
                entity_type="SUPPLIER",
                entity_id=supplier.id,
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
