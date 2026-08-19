from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List, Optional
import io
import csv
from app.models import (
    QualityTest, QualityTestResult, QualityStandard, Batch, Product, Supplier,
    Manufacturer, IncomingSupply, ComplianceEvaluation, StorageMonitoringRecord,
    StorageExcursion, Transport, TransportMonitoringRecord, TransportExcursion,
    QuarantineRecord, Recall, CorrectiveAction, AuditLog
)

class ReportService:
    @staticmethod
    def generate_report(
        db: Session,
        report_type: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        product_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """Builds structured report datasets with metadata, summaries, and row details."""
        
        headers = []
        rows = []
        title = report_type.replace('_', ' ').title() + " Report"

        if report_type == "quality_testing":
            headers = ["Test ID", "Batch No", "Product", "Inspector", "Result", "Status", "Date"]
            q = db.query(QualityTest)
            if product_id:
                q = q.join(Batch).filter(Batch.product_id == product_id)
            if status:
                q = q.filter(QualityTest.overall_result == status)
            tests = q.order_by(QualityTest.created_at.desc()).limit(200).all()
            for t in tests:
                rows.append({
                    "test_id": t.id,
                    "batch_no": t.batch.batch_number if t.batch else "—",
                    "product": t.batch.product.name if t.batch and t.batch.product else "—",
                    "inspector": t.inspector.full_name if t.inspector else "Automated / Unassigned",
                    "result": t.overall_result,
                    "status": t.status,
                    "date": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "—"
                })

        elif report_type == "compliance":
            headers = ["Evaluation ID", "Supply Ref", "Rule Code", "Rule Type", "Result", "Reason", "Evaluated At"]
            evals = db.query(ComplianceEvaluation).order_by(ComplianceEvaluation.evaluated_at.desc()).limit(200).all()
            for e in evals:
                rows.append({
                    "evaluation_id": e.id,
                    "supply_ref": e.incoming_supply.receiving_id if e.incoming_supply else f"Supply #{e.incoming_supply_id}",
                    "rule_code": e.rule.rule_code if e.rule else "—",
                    "rule_type": e.rule.rule_type if e.rule else "—",
                    "result": e.evaluation_result,
                    "reason": e.reason or "Criteria met",
                    "evaluated_at": e.evaluated_at.strftime("%Y-%m-%d %H:%M") if e.evaluated_at else "—"
                })

        elif report_type == "incoming_supply":
            headers = ["Receiving ID", "Batch No", "Product", "Quantity", "Decision", "Compliance Score", "Received Date"]
            q = db.query(IncomingSupply)
            if status:
                q = q.filter(IncomingSupply.final_decision == status)
            supplies = q.order_by(IncomingSupply.created_at.desc()).limit(200).all()
            for s in supplies:
                rows.append({
                    "receiving_id": s.receiving_id,
                    "batch_no": s.batch.batch_number if s.batch else "—",
                    "product": s.batch.product.name if s.batch and s.batch.product else "—",
                    "quantity": s.quantity_received,
                    "decision": s.final_decision,
                    "compliance_score": s.compliance_score,
                    "received_date": s.received_date.strftime("%Y-%m-%d") if s.received_date else "—"
                })

        elif report_type == "batch_quality":
            headers = ["Batch Number", "Product", "Supplier", "Mfg Date", "Exp Date", "Quality", "Decision"]
            batches = db.query(Batch).order_by(Batch.created_at.desc()).limit(200).all()
            for b in batches:
                rows.append({
                    "batch_number": b.batch_number,
                    "product": b.product.name if b.product else "—",
                    "supplier": b.supplier.name if b.supplier else "—",
                    "mfg_date": b.manufacturing_date.strftime("%Y-%m-%d") if b.manufacturing_date else "—",
                    "exp_date": b.expiry_date.strftime("%Y-%m-%d") if b.expiry_date else "—",
                    "quality": b.quality_status.value if hasattr(b.quality_status, 'value') else str(b.quality_status),
                    "decision": b.final_decision.value if hasattr(b.final_decision, 'value') else str(b.final_decision)
                })

        elif report_type == "supplier_performance":
            headers = ["Supplier", "Registration", "Total Supplies", "Accepted", "Rejected", "Pass Rate (%)", "Score"]
            from app.analytics.supplier_analytics import SupplierAnalytics
            data = SupplierAnalytics.get_supplier_performance(db)
            for s in data:
                rows.append({
                    "supplier": s["name"],
                    "registration": s["registration_number"],
                    "total_supplies": s["total_supplies"],
                    "accepted": s["accepted"],
                    "rejected": s["rejected"],
                    "pass_rate": s["pass_rate"],
                    "score": s["quality_score"]
                })

        elif report_type == "manufacturer":
            headers = ["Manufacturer", "Registration", "Contact", "Status", "Products Count"]
            mfrs = db.query(Manufacturer).all()
            for m in mfrs:
                rows.append({
                    "manufacturer": m.name,
                    "registration": m.registration_number,
                    "contact": m.contact_person or m.email or "—",
                    "status": m.status,
                    "products_count": len(m.products) if m.products else 0
                })

        elif report_type == "storage_monitoring":
            headers = ["Record ID", "Location ID", "Temp (°C)", "Humidity (%)", "Status", "Source", "Recorded At"]
            recs = db.query(StorageMonitoringRecord).order_by(StorageMonitoringRecord.recorded_at.desc()).limit(200).all()
            for r in recs:
                rows.append({
                    "record_id": r.id,
                    "location_id": r.storage_location_id,
                    "temp": r.recorded_temperature,
                    "humidity": r.recorded_humidity,
                    "status": r.overall_status,
                    "source": r.source,
                    "recorded_at": r.recorded_at.strftime("%Y-%m-%d %H:%M") if r.recorded_at else "—"
                })

        elif report_type == "transport_monitoring":
            headers = ["Transport ID", "Carrier", "Vehicle", "Route", "Status", "Min/Max Temp (°C)"]
            trans = db.query(Transport).order_by(Transport.created_at.desc()).limit(200).all()
            for t in trans:
                rows.append({
                    "transport_id": t.transport_id,
                    "carrier": t.carrier_name or "—",
                    "vehicle": t.vehicle_number or "—",
                    "route": f"{t.source_location or '—'} → {t.destination_location or '—'}",
                    "status": t.status,
                    "temp_range": f"{t.temperature_min_required or '—'} to {t.temperature_max_required or '—'}"
                })

        elif report_type == "quarantine":
            headers = ["Q Number", "Batch ID", "Reason Type", "Reason", "Severity", "Status", "Created At"]
            qs = db.query(QuarantineRecord).order_by(QuarantineRecord.created_at.desc()).limit(200).all()
            for q in qs:
                rows.append({
                    "q_number": q.quarantine_number or f"QR-{q.id}",
                    "batch_id": q.batch_id or q.incoming_supply_id or "—",
                    "reason_type": q.reason_type or "—",
                    "reason": q.reason,
                    "severity": q.severity or "—",
                    "status": q.status,
                    "created_at": q.created_at.strftime("%Y-%m-%d %H:%M") if q.created_at else "—"
                })

        elif report_type == "recall":
            headers = ["Recall Number", "Batch ID", "Product", "Severity", "Affected Units", "Status", "Recall Date"]
            recs = db.query(Recall).order_by(Recall.created_at.desc()).limit(200).all()
            for r in recs:
                rows.append({
                    "recall_number": r.recall_number,
                    "batch_id": r.batch_id,
                    "product": r.product.name if r.product else "—",
                    "severity": r.severity,
                    "affected_units": r.affected_supplies_count or 0,
                    "status": r.status,
                    "recall_date": r.recall_date.strftime("%Y-%m-%d") if r.recall_date else "—"
                })

        elif report_type == "corrective_action":
            headers = ["Action Number", "Action Type", "Reference", "Batch ID", "Priority", "Status", "Due Date"]
            capas = db.query(CorrectiveAction).order_by(CorrectiveAction.created_at.desc()).limit(200).all()
            for c in capas:
                rows.append({
                    "action_number": c.action_number,
                    "action_type": c.action_type,
                    "reference": f"{c.reference_type} #{c.reference_id}",
                    "batch_id": c.batch_id or "—",
                    "priority": c.priority,
                    "status": c.status,
                    "due_date": c.due_date.strftime("%Y-%m-%d") if c.due_date else "—"
                })

        elif report_type == "audit":
            headers = ["Audit ID", "User ID", "Action", "Entity", "Entity ID", "New Value", "Timestamp"]
            logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
            for l in logs:
                rows.append({
                    "audit_id": l.id,
                    "user_id": l.user_id or "System",
                    "action": l.action,
                    "entity": l.entity_type,
                    "entity_id": l.entity_id,
                    "new_value": l.new_value,
                    "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else "—"
                })

        else: # quality_summary
            headers = ["Metric Category", "Total Count", "Status Assessment", "Action Required"]
            from app.analytics.dashboard_service import DashboardService
            from app.models import User
            admin = db.query(User).first()
            ov = DashboardService.get_command_center_overview(db, admin)
            rows = [
                {"category": "Overall Incoming Supplies", "count": ov["overall_status"]["total_incoming"], "status": f"Passed: {ov['overall_status']['passed']} | Rejected: {ov['overall_status']['rejected']}", "action": f"{ov['overall_status']['testing']} Pending Testing"},
                {"category": "Quality Health Score", "count": f"{ov['quality_health']['score']}%", "status": ov['quality_health']['status'], "action": "Maintain GMP standard protocols"},
                {"category": "Storage Facilities", "count": ov["storage_summary"]["total_locations"], "status": f"{ov['storage_summary']['open_excursions']} Open Excursions", "action": "Inspect cold storage locks"},
                {"category": "Quarantined Lots", "count": ov["quarantine_summary"]["active_and_review"], "status": "Under Active Containment", "action": "Complete laboratory retests"},
                {"category": "Active Recalls", "count": ov["recall_summary"]["active_recalls"], "status": "Active Campaigns", "action": "Verify complete field retrieval"},
                {"category": "Corrective Actions (CAPA)", "count": ov["capa_summary"]["open"], "status": f"{ov['capa_summary']['overdue']} Overdue", "action": "Expedite root-cause closures"}
            ]

        return {
            "title": title,
            "report_type": report_type,
            "hospital_name": "Hospital Pharmaceutical Quality & Supply Control Center",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "total_records": len(rows),
            "headers": headers,
            "rows": rows
        }

    @staticmethod
    def export_csv(report_data: Dict[str, Any]) -> str:
        """Converts report rows into standard CSV string format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Meta headers
        writer.writerow([f"# {report_data['hospital_name']}"])
        writer.writerow([f"# {report_data['title']}"])
        writer.writerow([f"# Generated At: {report_data['generated_at']}"])
        writer.writerow([])

        if report_data["rows"]:
            keys = list(report_data["rows"][0].keys())
            writer.writerow(report_data["headers"])
            for r in report_data["rows"]:
                writer.writerow([r.get(k, "") for k in keys])
        
        return output.getvalue()
