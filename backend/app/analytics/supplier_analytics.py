from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import Supplier, Batch, IncomingSupply, QualityTest

class SupplierAnalytics:
    @staticmethod
    def get_supplier_performance(db: Session) -> List[Dict[str, Any]]:
        """Calculates scorecards and metrics per supplier with sample-size indicators."""
        suppliers = db.query(Supplier).all()
        results = []

        for s in suppliers:
            supplies = db.query(IncomingSupply).join(Batch).filter(Batch.supplier_id == s.id)
            total = supplies.count()
            accepted = supplies.filter(IncomingSupply.final_decision == "ACCEPTED").count()
            rejected = supplies.filter(IncomingSupply.final_decision == "REJECTED").count()
            quarantined = supplies.filter(IncomingSupply.final_decision == "QUARANTINED").count()

            pass_rate = round((accepted / total * 100), 1) if total > 0 else 100.0
            rejection_rate = round((rejected / total * 100), 1) if total > 0 else 0.0

            # Score calculation: 100 - (rejected/total * 50) - (quarantined/total * 25)
            score = 100.0
            if total > 0:
                score = max(round(100.0 - (rejection_rate * 0.5) - ((quarantined / total * 100) * 0.25), 1), 0.0)

            results.append({
                "supplier_id": s.id,
                "name": s.name,
                "registration_number": s.registration_number,
                "status": s.status,
                "total_supplies": total,
                "accepted": accepted,
                "rejected": rejected,
                "quarantined": quarantined,
                "pass_rate": pass_rate,
                "rejection_rate": rejection_rate,
                "quality_score": score,
                "sample_size_confidence": "HIGH" if total >= 10 else "MEDIUM" if total >= 3 else "LOW"
            })

        results.sort(key=lambda x: (-x["quality_score"], -x["total_supplies"]))
        return results
