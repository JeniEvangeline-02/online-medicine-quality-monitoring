from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.models import Batch, Supplier, StorageExcursion, Recall, QualityTest, QuarantineRecord

class EarlyWarningIntelligence:
    @classmethod
    def generate_early_warnings(cls, db: Session) -> List[Dict[str, Any]]:
        """Generates predictive early warnings and actionable mitigation advisories."""
        warnings: List[Dict[str, Any]] = []

        # 1. Batches approaching expiration within 60 days
        expiry_threshold = datetime.utcnow() + timedelta(days=60)
        expiring_batches = db.query(Batch).filter(
            Batch.expiry_date != None,
            Batch.expiry_date <= expiry_threshold,
            Batch.expiry_date >= datetime.utcnow()
        ).all()

        if expiring_batches:
            warnings.append({
                "id": "ew-expiry-clustering",
                "title": f"{len(expiring_batches)} Batch(es) Approaching Expiry (<60 Days)",
                "issue": "Near-expiry shelf-life concentration detected in hospital pharmacy storage",
                "evidence": f"Batches: {', '.join(b.batch_number for b in expiring_batches[:3])}{'...' if len(expiring_batches)>3 else ''}",
                "risk_level": "HIGH" if len(expiring_batches) >= 3 else "MEDIUM",
                "recommended_action": "Prioritize FIFO dispensing schedule and notify ward pharmacists to prevent expiry wastage"
            })

        # 2. Repeated cold storage excursions
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        storage_excs = db.query(StorageExcursion).filter(
            StorageExcursion.start_time >= recent_cutoff
        ).all()

        if len(storage_excs) >= 2:
            warnings.append({
                "id": "ew-coldchain-instability",
                "title": "Cold Storage Temperature Fluctuation Pattern",
                "issue": "Multiple environmental temperature deviations recorded in the past 7 days",
                "evidence": f"{len(storage_excs)} storage excursions logged in recent monitoring cycle",
                "risk_level": "CRITICAL" if any(s.severity == "CRITICAL" for s in storage_excs) else "HIGH",
                "recommended_action": "Perform immediate HVAC compressor diagnostics and audit door seal integrity"
            })

        # 3. Active product recall containment
        active_recalls = db.query(Recall).filter(Recall.status == "ACTIVE").all()
        if active_recalls:
            warnings.append({
                "id": "ew-active-recall-containment",
                "title": f"Active Product Recall Containment in Progress ({len(active_recalls)} campaign)",
                "issue": "Field containment and inventory retrieval directives currently active",
                "evidence": f"Campaign: {active_recalls[0].recall_number} for {active_recalls[0].reason}",
                "risk_level": "CRITICAL",
                "recommended_action": "Verify all hospital wards and dispensaries have quarantined affected units"
            })

        # 4. Open quarantine investigations
        open_quarantines = db.query(QuarantineRecord).filter(
            QuarantineRecord.status.in_(["ACTIVE", "UNDER_REVIEW"])
        ).count()
        if open_quarantines >= 2:
            warnings.append({
                "id": "ew-quarantine-backlog",
                "title": f"{open_quarantines} Batches Awaiting Quarantine Resolution",
                "issue": "Elevated number of batches isolated pending investigative retests",
                "evidence": f"{open_quarantines} open quarantine records require laboratory clearance or disposal",
                "risk_level": "HIGH",
                "recommended_action": "Assign quality inspector to expedite root-cause CAPA investigations"
            })

        return warnings
