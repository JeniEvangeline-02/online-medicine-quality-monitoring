from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
from app.models import Product, Batch, QualityTest, Recall, QuarantineRecord, AIRiskAssessment

class ProductRiskAnalyzer:
    ALGORITHM_VERSION = "risk-engine-v1"

    @classmethod
    def evaluate_product_risk(cls, db: Session, product_id: int, persist: bool = True) -> Dict[str, Any]:
        """Calculates product risk based on test failure ratios, recalls, and storage sensitivities."""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {"product_id": product_id, "risk_score": 0.0, "risk_level": "LOW", "explanation": "Product not found."}

        batches = db.query(Batch).filter(Batch.product_id == product.id).all()
        total_batches = len(batches)

        tests = db.query(QualityTest).join(Batch).filter(Batch.product_id == product.id).all()
        total_tests = len(tests)
        failed_tests = sum(1 for t in tests if t.overall_result == "FAIL")
        fail_rate = (failed_tests / total_tests * 100) if total_tests > 0 else 0.0

        recalls = db.query(Recall).filter(Recall.product_id == product.id).count()
        quarantines = db.query(QuarantineRecord).join(Batch).filter(Batch.product_id == product.id).count()

        factors: Dict[str, float] = {}
        explanation_points: List[str] = []
        recommendations: List[str] = []

        if fail_rate > 15.0:
            factors["Elevated Lab Failure Rate"] = min(fail_rate * 1.5, 45.0)
            explanation_points.append(f"Testing failure rate of {fail_rate:.1f}% across {total_tests} lab tests")
            recommendations.append("Conduct comprehensive formulation and stability re-validation")
        elif failed_tests > 0:
            factors["Lab Test Failures"] = min(failed_tests * 10.0, 20.0)

        if recalls > 0:
            factors["Active/Past Recalls"] = min(recalls * 25.0, 40.0)
            explanation_points.append(f"{recalls} historical product recall campaign(s)")
            recommendations.append("Audit manufacturing packaging and hermetic seal integrity")

        if quarantines > 0:
            factors["Quarantine Incidents"] = min(quarantines * 10.0, 20.0)
            explanation_points.append(f"{quarantines} quarantined batch incident(s)")

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
            explanation = f"Product {product.name} ({product.product_code}) demonstrates high therapeutic quality stability with 0 defects."
            recommendations.append("Standard periodic quality surveillance")
        else:
            explanation = f"Product {product.name} identified as {risk_level} risk: " + "; ".join(explanation_points) + "."

        result = {
            "product_id": product.id,
            "product_code": product.product_code,
            "name": product.name,
            "category": product.category,
            "product_type": product.product_type,
            "total_batches": total_batches,
            "total_tests": total_tests,
            "fail_rate": round(fail_rate, 1),
            "risk_score": total_score,
            "risk_level": risk_level,
            "factors": factors,
            "explanation": explanation,
            "recommendations": recommendations,
            "algorithm_version": cls.ALGORITHM_VERSION
        }

        if persist:
            assessment = AIRiskAssessment(
                entity_type="PRODUCT",
                entity_id=product.id,
                risk_score=total_score,
                risk_level=risk_level,
                factors=json.dumps(factors),
                explanation=explanation,
                confidence_score=90.0 if total_tests >= 5 else 60.0,
                confidence_reason="HIGH" if total_tests >= 5 else "MODERATE",
                recommendations=json.dumps(recommendations),
                algorithm_version=cls.ALGORITHM_VERSION
            )
            db.add(assessment)
            db.commit()

        return result
