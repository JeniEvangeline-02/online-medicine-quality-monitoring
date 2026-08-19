from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.models import (
    AIAnomaly, QualityTest, QualityTestResult, Batch, Product, Supplier,
    StorageExcursion, TransportExcursion, Recall, QuarantineRecord
)

class AnomalyDetector:
    @classmethod
    def scan_anomalies(cls, db: Session, persist: bool = True) -> List[Dict[str, Any]]:
        """Scans multi-domain system data for statistical and pattern anomalies."""
        detected: List[Dict[str, Any]] = []

        # 1. STORAGE_ANOMALY: Open critical storage excursions
        crit_storage = db.query(StorageExcursion).filter(
            StorageExcursion.status == "OPEN",
            StorageExcursion.severity == "CRITICAL"
        ).all()
        for se in crit_storage:
            detected.append({
                "anomaly_type": "STORAGE_ANOMALY",
                "entity_type": "STORAGE_LOCATION",
                "entity_id": str(se.storage_location_id),
                "severity": "CRITICAL",
                "description": (
                    f"Critical environmental excursion: {se.observed_value}°C recorded in storage location "
                    f"#{se.storage_location_id} (Target: {se.expected_min}-{se.expected_max}°C)"
                ),
                "evidence": f"StorageExcursion ID #{se.id} started at {se.start_time}",
            })

        # 2. TRANSPORT_ANOMALY: Open transit excursions
        trans_excs = db.query(TransportExcursion).filter(TransportExcursion.status == "OPEN").all()
        for te in trans_excs:
            detected.append({
                "anomaly_type": "TRANSPORT_ANOMALY",
                "entity_type": "TRANSPORT",
                "entity_id": str(te.transport_id),
                "severity": te.severity or "HIGH",
                "description": f"In-transit cold-chain violation: observed {te.observed_value}°C during transport #{te.transport_id}",
                "evidence": f"TransportExcursion ID #{te.id}",
            })

        # 3. RECALL_ANOMALY: Active product recalls
        recalls = db.query(Recall).filter(Recall.status == "ACTIVE").all()
        for rc in recalls:
            detected.append({
                "anomaly_type": "RECALL_ANOMALY",
                "entity_type": "BATCH",
                "entity_id": str(rc.batch_id),
                "severity": rc.severity or "HIGH",
                "description": f"Active product recall directive ({rc.recall_number}): {rc.reason}",
                "evidence": f"Recall ID #{rc.id} targeting Batch #{rc.batch_id}",
            })

        # 4. QUALITY_ANOMALY: Batches with critical lab failures
        # Join QualityTestResult -> QualityTest to get batch_id directly
        crit_results = (
            db.query(QualityTestResult.quality_test_id, QualityTest.batch_id, func.count(QualityTestResult.id))
            .join(QualityTest, QualityTestResult.quality_test_id == QualityTest.id)
            .filter(QualityTestResult.is_critical_failure == True)
            .group_by(QualityTestResult.quality_test_id, QualityTest.batch_id)
            .all()
        )
        # Aggregate by batch_id
        batch_crit_counts: Dict[int, int] = {}
        for _, batch_id, count in crit_results:
            if batch_id:
                batch_crit_counts[batch_id] = batch_crit_counts.get(batch_id, 0) + count

        for b_id, count in batch_crit_counts.items():
            if count >= 1:
                detected.append({
                    "anomaly_type": "QUALITY_ANOMALY",
                    "entity_type": "BATCH",
                    "entity_id": str(b_id),
                    "severity": "CRITICAL" if count >= 2 else "HIGH",
                    "description": (
                        f"Abnormal laboratory failure frequency: {count} critical parameter defect(s) "
                        f"detected in batch #{b_id}"
                    ),
                    "evidence": f"{count} critical QualityTestResult flag(s) in batch #{b_id}",
                })

        # 5. SUPPLIER_ANOMALY: Suppliers with batch failure rate > 30%
        suppliers = db.query(Supplier).all()
        for s in suppliers:
            total_batches = db.query(Batch).filter(Batch.supplier_id == s.id).count()
            if total_batches >= 3:
                failed_batches = db.query(Batch).filter(
                    Batch.supplier_id == s.id,
                    Batch.quality_status == "FAILED"
                ).count()
                rate = (failed_batches / total_batches) * 100
                if rate >= 30.0:
                    detected.append({
                        "anomaly_type": "SUPPLIER_ANOMALY",
                        "entity_type": "SUPPLIER",
                        "entity_id": str(s.id),
                        "severity": "HIGH",
                        "description": (
                            f"Supplier {s.name} failure rate anomaly "
                            f"({rate:.1f}% defect rate across {total_batches} batches)"
                        ),
                        "evidence": f"{failed_batches} failed batches out of {total_batches}",
                    })

        # Persist into database (skip duplicates that are still open)
        if persist:
            for an in detected:
                exists = db.query(AIAnomaly).filter(
                    AIAnomaly.anomaly_type == an["anomaly_type"],
                    AIAnomaly.entity_type == an["entity_type"],
                    AIAnomaly.entity_id == an["entity_id"],
                    AIAnomaly.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING"])
                ).first()
                if not exists:
                    anomaly_obj = AIAnomaly(
                        anomaly_type=an["anomaly_type"],
                        entity_type=an["entity_type"],
                        entity_id=an["entity_id"],
                        severity=an["severity"],
                        description=an["description"],
                        evidence=an.get("evidence"),
                        status="NEW"
                    )
                    db.add(anomaly_obj)
            db.commit()

        # Return current anomaly feed from database
        db_anomalies = db.query(AIAnomaly).order_by(AIAnomaly.detected_at.desc()).limit(50).all()
        return [
            {
                "id": a.id,
                "anomaly_type": a.anomaly_type,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "severity": a.severity,
                "description": a.description,
                "evidence": a.evidence,
                "status": a.status,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None,
                "resolution_notes": a.resolution_notes
            }
            for a in db_anomalies
        ]
