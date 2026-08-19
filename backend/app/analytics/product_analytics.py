from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import Product, Batch, QualityTest, Recall, QuarantineRecord

class ProductAnalytics:
    @staticmethod
    def get_product_performance(db: Session) -> List[Dict[str, Any]]:
        """Calculates product defect rates, recall frequency, and quality performance."""
        products = db.query(Product).all()
        results = []

        for p in products:
            batches = db.query(Batch).filter(Batch.product_id == p.id)
            total_batches = batches.count()
            
            tests = db.query(QualityTest).join(Batch).filter(Batch.product_id == p.id)
            total_tests = tests.count()
            passed_tests = tests.filter(QualityTest.overall_result == "PASS").count()
            failed_tests = tests.filter(QualityTest.overall_result == "FAIL").count()

            pass_rate = round((passed_tests / total_tests * 100), 1) if total_tests > 0 else 100.0
            fail_rate = round((failed_tests / total_tests * 100), 1) if total_tests > 0 else 0.0

            recalls = db.query(Recall).filter(Recall.product_id == p.id).count()
            quarantines = db.query(QuarantineRecord).join(Batch).filter(Batch.product_id == p.id).count()

            # Risk level
            if recalls > 0 or fail_rate > 20:
                risk = "CRITICAL"
            elif fail_rate > 10 or quarantines > 1:
                risk = "HIGH"
            elif fail_rate > 0 or quarantines > 0:
                risk = "MEDIUM"
            else:
                risk = "LOW"

            results.append({
                "product_id": p.id,
                "product_code": p.product_code,
                "name": p.name,
                "category": p.category,
                "product_type": p.product_type,
                "total_batches": total_batches,
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "pass_rate": pass_rate,
                "fail_rate": fail_rate,
                "recalls_count": recalls,
                "quarantines_count": quarantines,
                "risk_level": risk
            })

        results.sort(key=lambda x: (-x["fail_rate"], -x["total_batches"]))
        return results
