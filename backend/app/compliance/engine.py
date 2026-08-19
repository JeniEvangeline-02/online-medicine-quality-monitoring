from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models import (
    IncomingSupply, Batch, Product, Supplier, Manufacturer,
    QualityTest, Certificate, Recall, ComplianceRule,
    ComplianceEvaluation, ComplianceDecisionHistory,
    QuarantineRecord, Alert, AuditLog
)
from app.compliance.rules import seed_default_compliance_rules
from app.compliance.evaluator import ComplianceEvaluator
from app.compliance.decision import DecisionMaker

class ComplianceEngine:
    def __init__(self):
        self.evaluator = ComplianceEvaluator()
        self.decision_maker = DecisionMaker()

    def run_evaluations(self, db: Session, incoming_supply_id: int, user_id: int = None) -> dict:
        """
        Executes end-to-end automated compliance evaluation and regulatory decision.
        """
        # 1. Ensure rules are seeded
        seed_default_compliance_rules(db)

        # 2. Fetch Incoming Supply and all relevant context
        supply = db.query(IncomingSupply).filter(IncomingSupply.id == incoming_supply_id).first()
        if not supply:
            raise HTTPException(status_code=404, detail="Incoming supply record not found.")

        batch = db.query(Batch).filter(Batch.id == supply.batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Associated batch record not found.")

        product = db.query(Product).filter(Product.id == batch.product_id).first()
        supplier = db.query(Supplier).filter(Supplier.id == batch.supplier_id).first()
        manufacturer = db.query(Manufacturer).filter(Manufacturer.id == batch.manufacturer_id).first()
        
        # Load quality tests
        quality_tests = db.query(QualityTest).filter(QualityTest.batch_id == batch.id).all()
        
        # Load certificates (prioritize batch-specific, fallback to general product certificates)
        batch_certs = db.query(Certificate).filter(Certificate.batch_id == batch.id).all()
        if batch_certs:
            certificates = batch_certs
        else:
            certificates = db.query(Certificate).filter(
                Certificate.product_id == product.id,
                Certificate.batch_id == None
            ).all() if product else []

        # Load recalls
        recalls = db.query(Recall).filter(Recall.batch_id == batch.id).all()

        supply_context = {
            "supply": supply,
            "batch": batch,
            "product": product,
            "supplier": supplier,
            "manufacturer": manufacturer,
            "quality_tests": quality_tests,
            "certificates": certificates,
            "recalls": recalls
        }

        # 3. Load active compliance rules
        rules = db.query(ComplianceRule).filter(ComplianceRule.is_active == True).all()

        # 4. Evaluate rules
        evaluations_data = []
        for r in rules:
            res = self.evaluator.evaluate_rule(r, supply_context)
            evaluations_data.append(res)

        # 5. Store / update ComplianceEvaluation records in database
        # Clear previous evaluations for this incoming supply
        db.query(ComplianceEvaluation).filter(ComplianceEvaluation.incoming_supply_id == supply.id).delete()
        
        db_evaluations = []
        for ev in evaluations_data:
            db_eval = ComplianceEvaluation(
                incoming_supply_id=supply.id,
                rule_id=ev["rule_id"],
                input_value=ev["input_value"],
                expected_value=ev["expected_value"],
                evaluation_result=ev["evaluation_result"],
                reason=ev["reason"],
                evaluated_at=datetime.now(),
                rule_version=ev.get("rule_version", "1.0")
            )
            db.add(db_eval)
            db_evaluations.append(db_eval)

        # 6. Evaluate final decision
        decision_info = self.decision_maker.evaluate_final_decision(evaluations_data)
        final_decision = decision_info["decision"]
        reason = decision_info["reason"]
        severity = decision_info["severity"]
        score = decision_info["compliance_score"]
        triggered_rule = decision_info["triggered_rule"]

        # Determine compliance_status label
        if final_decision == "ACCEPTED":
            compliance_status = "COMPLIANT"
        elif final_decision == "REJECTED":
            compliance_status = "NON_COMPLIANT"
        else:
            compliance_status = "UNDER_REVIEW"

        # 7. Update IncomingSupply
        supply.compliance_status = compliance_status
        supply.final_decision = final_decision
        supply.decision_reason = reason
        supply.decision_severity = severity
        supply.decision_date = datetime.now()
        supply.decision_source = "AUTOMATED_COMPLIANCE_ENGINE"
        supply.compliance_score = score

        # 8. Record ComplianceDecisionHistory (with is_automated = True)
        history = ComplianceDecisionHistory(
            incoming_supply_id=supply.id,
            decision=final_decision,
            reason=reason,
            severity=severity,
            triggered_rule=triggered_rule,
            compliance_score=score,
            decided_at=datetime.now(),
            decided_by=user_id,
            is_automated=True
        )
        db.add(history)

        # 9. Handle Quarantine Record if QUARANTINED
        if final_decision == "QUARANTINED":
            existing_qr = db.query(QuarantineRecord).filter(
                QuarantineRecord.incoming_supply_id == supply.id,
                QuarantineRecord.status == "ACTIVE"
            ).first()
            if not existing_qr:
                qr = QuarantineRecord(
                    incoming_supply_id=supply.id,
                    reason=reason,
                    status="ACTIVE",
                    assigned_to=user_id,
                    created_at=datetime.now()
                )
                db.add(qr)
            else:
                existing_qr.reason = reason

        # 10. Generate Alert for REJECTED or QUARANTINED or critical severity
        if final_decision in ["REJECTED", "QUARANTINED"]:
            alert = Alert(
                alert_type=f"COMPLIANCE_{final_decision}",
                severity=severity,
                title=f"Supply {supply.receiving_id} — {final_decision}",
                message=reason,
                related_batch_id=batch.id,
                related_supply_id=supply.id,
                is_read=False,
                created_at=datetime.now()
            )
            db.add(alert)

        # 11. Create AuditLog
        audit = AuditLog(
            user_id=user_id,
            action=f"SUPPLY_{final_decision}",
            entity_type="INCOMING_SUPPLY",
            entity_id=str(supply.id),
            decision=final_decision,
            rule_code=triggered_rule,
            new_value=f"Decision: {final_decision} (Score: {score})",
            created_at=datetime.now()
        )
        db.add(audit)

        db.commit()
        db.refresh(supply)

        return {
            "incoming_supply_id": supply.id,
            "receiving_id": supply.receiving_id,
            "product_name": product.name if product else "Unknown",
            "product_code": product.product_code if product else "Unknown",
            "batch_number": batch.batch_number if batch else "Unknown",
            "supplier_name": supplier.name if supplier else "Unknown",
            "quality_result": supply.quality_status or "PENDING",
            "certificate_status": "VALID" if any(c.verification_status == "VALID" for c in certificates) else ("PENDING" if certificates else "NO_CERTIFICATE"),
            "expiry_status": str(batch.expiry_status or "UNKNOWN"),
            "registration_status": "VALID" if product and product.registration_number else "INVALID",
            "supplier_status": supplier.status if supplier else "UNKNOWN",
            "recall_status": str(batch.recall_status or "NOT_RECALLED"),
            "compliance_score": score,
            "final_decision": final_decision,
            "decision_reason": reason,
            "decision_source": "AUTOMATED_COMPLIANCE_ENGINE",
            "decision_severity": severity,
            "decision_date": supply.decision_date,
            "evaluations": evaluations_data
        }

    def manual_override(self, db: Session, incoming_supply_id: int, new_decision: str, reason: str, user_id: int) -> dict:
        """
        Controlled manual override for ADMIN only.
        """
        supply = db.query(IncomingSupply).filter(IncomingSupply.id == incoming_supply_id).first()
        if not supply:
            raise HTTPException(status_code=404, detail="Incoming supply not found.")

        if new_decision not in ["ACCEPTED", "QUARANTINED", "REJECTED"]:
            raise HTTPException(status_code=422, detail="Invalid override decision.")

        prev_decision = supply.final_decision or "PENDING"
        
        supply.final_decision = new_decision
        supply.decision_reason = f"Manual override by administrator: {reason}"
        supply.decision_source = "MANUAL_OVERRIDE"
        supply.decision_date = datetime.now()

        # Record in history with is_automated = False
        history = ComplianceDecisionHistory(
            incoming_supply_id=supply.id,
            decision=new_decision,
            reason=f"Manual Override: {reason}",
            severity="MEDIUM",
            triggered_rule="ADMIN_MANUAL_OVERRIDE",
            compliance_score=supply.compliance_score,
            decided_at=datetime.now(),
            decided_by=user_id,
            is_automated=False
        )
        db.add(history)

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="MANUAL_OVERRIDE_COMPLETED",
            entity_type="INCOMING_SUPPLY",
            entity_id=str(supply.id),
            previous_value=prev_decision,
            new_value=new_decision,
            decision=new_decision,
            rule_code="ADMIN_MANUAL_OVERRIDE",
            created_at=datetime.now()
        )
        db.add(audit)

        db.commit()
        db.refresh(supply)

        return {
            "incoming_supply_id": supply.id,
            "previous_decision": prev_decision,
            "new_decision": new_decision,
            "reason": reason,
            "decision_source": "MANUAL_OVERRIDE",
            "decision_date": supply.decision_date
        }
