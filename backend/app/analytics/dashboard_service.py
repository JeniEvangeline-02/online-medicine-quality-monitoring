from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.models import (
    IncomingSupply, QualityTest, QualityTestResult, Batch, Product, Supplier,
    ComplianceEvaluation, StorageLocation, StorageMonitoringRecord, StorageExcursion,
    Transport, TransportMonitoringRecord, TransportExcursion,
    QuarantineRecord, Recall, CorrectiveAction, Alert, User, FinalDecision, RecallStatus
)

class DashboardService:
    @staticmethod
    def get_command_center_overview(db: Session, current_user: User) -> Dict[str, Any]:
        """Aggregates real-time command center data adhering to RBAC."""
        
        # Base filter queries
        supply_q = db.query(IncomingSupply)
        batch_q = db.query(Batch)
        test_q = db.query(QualityTest)
        alert_q = db.query(Alert)
        quarantine_q = db.query(QuarantineRecord)
        recall_q = db.query(Recall)
        capa_q = db.query(CorrectiveAction)
        storage_exc_q = db.query(StorageExcursion)
        transport_exc_q = db.query(TransportExcursion)

        # RBAC filters
        if current_user.role and current_user.role.name == "SUPPLIER":
            # Match supplier
            sup = db.query(Supplier).filter(Supplier.email == current_user.email).first()
            if sup:
                batch_q = batch_q.filter(Batch.supplier_id == sup.id)
                supply_q = supply_q.join(Batch).filter(Batch.supplier_id == sup.id)
            else:
                supply_q = supply_q.filter(IncomingSupply.id == -1)

        # 1. Overall Incoming Supplies Count & Status Breakdown
        total_supplies = supply_q.count()
        testing_count = supply_q.filter(IncomingSupply.final_decision.in_(["PENDING", None])).count()
        passed_count = supply_q.filter(IncomingSupply.final_decision == "ACCEPTED").count()
        failed_count = supply_q.filter(IncomingSupply.final_decision == "REJECTED").count()
        quarantined_count = supply_q.filter(IncomingSupply.final_decision == "QUARANTINED").count()

        # 2. Automated Phase 5 Decision Distribution
        decision_dist = {
            "ACCEPTED": passed_count,
            "QUARANTINED": quarantined_count,
            "REJECTED": failed_count,
            "PENDING": testing_count
        }

        # 3. Quality Health Indicator Calculation (Real Database Data Formula)
        # Formula:
        # Base: 100.0
        # Deductions:
        # - Rejected/Failed supply: -5% per occurrence (max -30)
        # - Quarantined batch: -3% per occurrence (max -20)
        # - Critical open alert: -4% per occurrence (max -20)
        # - Active recall: -10% per occurrence (max -30)
        # - Critical storage/transport excursion: -5% (max -20)
        active_recalls = recall_q.filter(Recall.status == "ACTIVE").count()
        open_quarantines = quarantine_q.filter(QuarantineRecord.status.in_(["ACTIVE", "UNDER_REVIEW"])).count()
        critical_alerts = alert_q.filter(Alert.severity == "CRITICAL", Alert.status != "RESOLVED").count()
        open_storage_exc = storage_exc_q.filter(StorageExcursion.status == "OPEN", StorageExcursion.severity == "CRITICAL").count()
        open_transport_exc = transport_exc_q.filter(TransportExcursion.status == "OPEN", TransportExcursion.severity == "CRITICAL").count()

        penalty = 0.0
        penalty += min(failed_count * 5.0, 30.0)
        penalty += min(open_quarantines * 3.0, 20.0)
        penalty += min(critical_alerts * 4.0, 20.0)
        penalty += min(active_recalls * 10.0, 30.0)
        penalty += min((open_storage_exc + open_transport_exc) * 5.0, 20.0)

        quality_health_score = max(round(100.0 - penalty, 1), 0.0)

        # 4. Storage & Transport Telemetry
        total_storage_locs = db.query(StorageLocation).count()
        open_storage_excursions = storage_exc_q.filter(StorageExcursion.status == "OPEN").count()
        total_active_transports = db.query(Transport).filter(Transport.status == "IN_TRANSIT").count()
        open_transport_excursions = transport_exc_q.filter(TransportExcursion.status == "OPEN").count()

        # 5. Corrective Actions (CAPA) Stats
        open_capa = capa_q.filter(CorrectiveAction.status == "OPEN").count()
        in_prog_capa = capa_q.filter(CorrectiveAction.status == "IN_PROGRESS").count()
        overdue_capa = capa_q.filter(
            CorrectiveAction.status.in_(["OPEN", "IN_PROGRESS"]),
            CorrectiveAction.due_date < datetime.utcnow()
        ).count()

        # 6. Action Required Priority Queue
        action_required = []
        
        # Critical Unresolved Alerts
        crit_alerts = alert_q.filter(Alert.severity == "CRITICAL", Alert.status != "RESOLVED").order_by(Alert.created_at.desc()).limit(5).all()
        for ca in crit_alerts:
            action_required.append({
                "id": f"alert-{ca.id}",
                "category": "ALERT",
                "severity": ca.severity,
                "title": ca.title,
                "description": ca.message,
                "link": "/alerts",
                "timestamp": ca.created_at.isoformat() if ca.created_at else None
            })

        # Active Recalls
        act_recalls = recall_q.filter(Recall.status == "ACTIVE").order_by(Recall.created_at.desc()).limit(5).all()
        for rc in act_recalls:
            action_required.append({
                "id": f"recall-{rc.id}",
                "category": "RECALL",
                "severity": rc.severity or "HIGH",
                "title": f"Recall {rc.recall_number}",
                "description": rc.reason,
                "link": "/recalls",
                "timestamp": rc.created_at.isoformat() if rc.created_at else None
            })

        # Overdue CAPAs
        overdue_items = capa_q.filter(
            CorrectiveAction.status.in_(["OPEN", "IN_PROGRESS"]),
            CorrectiveAction.due_date < datetime.utcnow()
        ).order_by(CorrectiveAction.due_date.asc()).limit(5).all()
        for ci in overdue_items:
            action_required.append({
                "id": f"capa-{ci.id}",
                "category": "CAPA_OVERDUE",
                "severity": ci.priority or "HIGH",
                "title": f"Overdue Action: {ci.action_number}",
                "description": f"{ci.action_type} for {ci.reference_type} #{ci.reference_id}",
                "link": "/corrective-actions",
                "timestamp": ci.due_date.isoformat() if ci.due_date else None
            })

        # Open Critical Storage Excursions
        crit_storage = storage_exc_q.filter(StorageExcursion.status == "OPEN", StorageExcursion.severity == "CRITICAL").limit(5).all()
        for se in crit_storage:
            action_required.append({
                "id": f"storage-exc-{se.id}",
                "category": "STORAGE_EXCURSION",
                "severity": "CRITICAL",
                "title": f"Critical Temp Violation in Storage #{se.storage_location_id}",
                "description": f"Observed {se.observed_value}°C (Target: {se.expected_min}-{se.expected_max}°C)",
                "link": "/storage",
                "timestamp": se.start_time.isoformat() if se.start_time else None
            })

        # Sort action_required by severity priority
        sev_weight = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        action_required.sort(key=lambda x: sev_weight.get(x["severity"], 0), reverse=True)

        # 7. Recent Critical Quality Events Feed (Top 10)
        recent_alerts = alert_q.order_by(Alert.created_at.desc()).limit(8).all()
        alert_stream = [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "status": a.status,
                "is_read": a.is_read,
                "batch_id": a.related_batch_id,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in recent_alerts
        ]

        return {
            "system_status": "OPERATIONAL",
            "last_synced": datetime.utcnow().isoformat(),
            "quality_health": {
                "score": quality_health_score,
                "status": "EXCELLENT" if quality_health_score >= 90 else "GOOD" if quality_health_score >= 75 else "NEEDS_ATTENTION" if quality_health_score >= 50 else "CRITICAL",
                "formula_notes": f"Base 100 - Active Recalls ({active_recalls}x10) - Critical Alerts ({critical_alerts}x4) - Open Quarantines ({open_quarantines}x3) - Excursions ({open_storage_exc + open_transport_exc}x5) - Rejected ({failed_count}x5)"
            },
            "overall_status": {
                "total_incoming": total_supplies,
                "testing": testing_count,
                "passed": passed_count,
                "failed": failed_count,
                "quarantined": quarantined_count,
                "rejected": failed_count
            },
            "decision_distribution": decision_dist,
            "storage_summary": {
                "total_locations": total_storage_locs,
                "open_excursions": open_storage_excursions
            },
            "transport_summary": {
                "in_transit": total_active_transports,
                "open_excursions": open_transport_excursions
            },
            "quarantine_summary": {
                "active_and_review": open_quarantines,
                "total_records": quarantine_q.count()
            },
            "recall_summary": {
                "active_recalls": active_recalls,
                "total_recalls": recall_q.count()
            },
            "capa_summary": {
                "open": open_capa,
                "in_progress": in_prog_capa,
                "overdue": overdue_capa,
                "total": capa_q.count()
            },
            "action_required": action_required[:10],
            "alert_stream": alert_stream
        }

    @staticmethod
    def get_risk_matrix(db: Session) -> Dict[str, Any]:
        """
        Derives an authentic Likelihood vs Impact Quality Risk Matrix from active batches.
        Likelihood (1-4: Rare, Unlikely, Possible, Likely)
        Impact (1-4: Minor, Moderate, Major, Catastrophic)
        """
        batches = db.query(Batch).order_by(Batch.created_at.desc()).limit(50).all()
        risk_points = []
        matrix_counts = {
            "CRITICAL": 0,
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0
        }

        for b in batches:
            # Calculate Likelihood based on excursions, test warnings & supplier defect history
            test_failures = db.query(QualityTestResult).join(QualityTest).filter(
                QualityTest.batch_id == b.id, QualityTestResult.result == "FAIL"
            ).count()

            excursions = db.query(StorageExcursion).filter(StorageExcursion.batch_id == b.id).count() + \
                         db.query(TransportExcursion).filter(TransportExcursion.batch_id == b.id).count()
            
            is_recalled = db.query(Recall).filter(Recall.batch_id == b.id, Recall.status == "ACTIVE").count() > 0
            is_quarantined = db.query(QuarantineRecord).filter(QuarantineRecord.batch_id == b.id, QuarantineRecord.status == "ACTIVE").count() > 0

            # Likelihood (1-4)
            likelihood = 1
            if test_failures > 0 or excursions > 0:
                likelihood = 3 if (test_failures + excursions) > 2 else 2
            if is_recalled or is_quarantined:
                likelihood = 4

            # Impact (1-4)
            impact = 2 # default moderate
            if b.product and b.product.product_type == "MEDICINE":
                impact = 3
            if is_recalled or (b.quality_status == "FAILED"):
                impact = 4

            composite_score = likelihood * impact
            if composite_score >= 12 or is_recalled:
                risk_level = "CRITICAL"
            elif composite_score >= 8:
                risk_level = "HIGH"
            elif composite_score >= 4:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            matrix_counts[risk_level] += 1

            risk_points.append({
                "batch_id": b.id,
                "batch_number": b.batch_number,
                "product_name": b.product.name if b.product else "Unknown",
                "supplier_name": b.supplier.name if b.supplier else "Unknown",
                "likelihood": likelihood,
                "impact": impact,
                "risk_level": risk_level,
                "composite_score": composite_score,
                "quality_status": b.quality_status.value if hasattr(b.quality_status, 'value') else str(b.quality_status),
                "compliance_status": b.compliance_status.value if hasattr(b.compliance_status, 'value') else str(b.compliance_status),
                "final_decision": b.final_decision.value if hasattr(b.final_decision, 'value') else str(b.final_decision),
                "has_excursions": excursions > 0,
                "is_recalled": is_recalled,
                "is_quarantined": is_quarantined
            })

        # Sort with CRITICAL first
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        risk_points.sort(key=lambda x: (sev_order.get(x["risk_level"], 4), -x["composite_score"]))

        return {
            "matrix_counts": matrix_counts,
            "batches": risk_points
        }
