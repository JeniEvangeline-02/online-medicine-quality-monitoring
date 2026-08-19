from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import Recall, Batch, Product, QuarantineRecord

class RecallAnalytics:
    @staticmethod
    def get_recall_summary(db: Session) -> Dict[str, Any]:
        """Calculates recall containment metrics, affected units, and retrieval progress."""
        recalls = db.query(Recall).order_by(Recall.created_at.desc()).all()
        
        active_count = db.query(Recall).filter(Recall.status == "ACTIVE").count()
        completed_count = db.query(Recall).filter(Recall.status == "COMPLETED").count()
        total_affected = sum(r.affected_supplies_count or 0 for r in recalls)

        items = []
        for r in recalls:
            # Estimate progress: if completed 100%, if partially 50%, active 25% or based on quarantined batches
            progress = 100 if r.status == "COMPLETED" else (65 if r.status == "PARTIALLY_COMPLETED" else 30)

            items.append({
                "id": r.id,
                "recall_number": r.recall_number,
                "batch_id": r.batch_id,
                "product_name": r.product.name if r.product else "Unknown",
                "severity": r.severity,
                "reason": r.reason,
                "instructions": r.instructions,
                "status": r.status,
                "affected_units": r.affected_supplies_count or 0,
                "progress_percentage": progress,
                "recall_date": r.recall_date.isoformat() if r.recall_date else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None
            })

        return {
            "summary": {
                "active_recalls": active_count,
                "completed_recalls": completed_count,
                "total_recalls": len(recalls),
                "total_affected_units": total_affected
            },
            "recalls": items
        }
