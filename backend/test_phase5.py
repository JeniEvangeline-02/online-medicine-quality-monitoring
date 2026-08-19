import sys
import unittest
import uuid
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import SessionLocal
from app.models import (
    User, Role, Product, Batch, IncomingSupply, QualityStandard,
    QualitySample, QualityTest, QualityTestResult, Certificate,
    ComplianceRule, ComplianceEvaluation, ComplianceDecisionHistory,
    Recall, Alert, AuditLog, QuarantineRecord
)
from app.core.security import create_access_token

client = TestClient(app)

class TestPhase5ComplianceEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

        cls.admin_user = cls.db.query(User).filter(User.email == "admin@pharma.com").first()
        cls.inspector_user = cls.db.query(User).filter(User.email == "inspector@pharma.com").first()
        cls.supplier_user = cls.db.query(User).filter(User.email == "supplier@pharma.com").first()
        cls.hospital_user = cls.db.query(User).filter(User.email == "hospital@pharma.com").first()

        cls.admin_token = create_access_token(cls.admin_user.id, cls.admin_user.role.name)
        cls.inspector_token = create_access_token(cls.inspector_user.id, cls.inspector_user.role.name)
        cls.supplier_token = create_access_token(cls.supplier_user.id, cls.supplier_user.role.name)
        cls.hospital_token = create_access_token(cls.hospital_user.id, cls.hospital_user.role.name)

        cls.headers_admin = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.headers_inspector = {"Authorization": f"Bearer {cls.inspector_token}"}
        cls.headers_supplier = {"Authorization": f"Bearer {cls.supplier_token}"}
        cls.headers_hospital = {"Authorization": f"Bearer {cls.hospital_token}"}

        cls.product = cls.db.query(Product).filter(Product.product_code == "MED-PCM-500").first()
        cls.supplier = cls.db.query(User).filter(User.email == "supplier@pharma.com").first()
        cls.hospital = cls.db.query(User).filter(User.email == "hospital@pharma.com").first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        self.db.rollback()

    def _create_full_supply_chain(self, suffix: str, expiry_date: datetime = None, is_recalled: bool = False, supplier_status: str = "ACTIVE"):
        """Helper to create an isolated test supply chain."""
        u_tag = uuid.uuid4().hex[:6]
        if expiry_date is None:
            expiry_date = datetime.now() + timedelta(days=500)

        # Batch
        batch = Batch(
            batch_number=f"BATCH-T5-{suffix}-{u_tag}",
            product_id=self.product.id,
            manufacturer_id=self.product.manufacturer_id,
            supplier_id=1,
            manufacturing_date=datetime.now() - timedelta(days=30),
            expiry_date=expiry_date,
            quantity=1000.0,
            unit="tablets",
            storage_requirement="Store below 25°C",
            quality_status="PENDING",
            compliance_status="PENDING",
            final_decision="PENDING",
            recall_status="RECALLED" if is_recalled else "NOT_RECALLED",
            qr_identifier=f"QR-T5-{suffix}-{u_tag}"
        )
        self.db.add(batch)
        self.db.flush()

        if is_recalled:
            rec = Recall(
                batch_id=batch.id,
                recall_number=f"REC-T5-{suffix}-{u_tag}",
                reason="Safety recall test trigger",
                severity="CRITICAL",
                recall_date=datetime.now(),
                status="ACTIVE"
            )
            self.db.add(rec)
            self.db.flush()

        # Supply
        supply = IncomingSupply(
            receiving_id=f"REC-T5-{suffix}-{u_tag}",
            batch_id=batch.id,
            hospital_id=self.hospital.id,
            quantity_received=1000.0,
            received_date=datetime.now(),
            receiving_location="Pharmacy Depot",
            transport_status="GOOD",
            storage_status="ADEQUATE",
            quality_status="PENDING",
            compliance_status="PENDING",
            final_decision="PENDING"
        )
        self.db.add(supply)
        self.db.flush()

        self.db.commit()
        return supply, batch

    # TEST 1 — FULL PASS -> ACCEPTED
    def test_01_full_pass_scenario_accepted(self):
        supply, batch = self._create_full_supply_chain("PASS01")
        
        # 1. Valid certificate
        cert = Certificate(
            certificate_number=f"CERT-PASS-{batch.id}",
            product_id=self.product.id,
            batch_id=batch.id,
            certificate_type="COA",
            issuer="Regulatory Lab",
            issue_date=datetime.now() - timedelta(days=10),
            expiry_date=datetime.now() + timedelta(days=400),
            verification_status="VALID"
        )
        self.db.add(cert)
        self.db.commit()

        # 2. Complete Quality Test with PASS
        sample_res = client.post("/api/v1/quality-samples", json={
            "incoming_supply_id": supply.id,
            "batch_id": batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 10.0,
            "unit": "TABLETS"
        }, headers=self.headers_inspector)
        sample_id = sample_res.json()["id"]

        test_res = client.post("/api/v1/quality-tests", json={"sample_id": sample_id}, headers=self.headers_inspector)
        test_id = test_res.json()["id"]

        # Submit all passing results
        results_input = []
        for r in test_res.json()["test_results"]:
            std = r["quality_standard"]
            if std["parameter_type"] == "NUMERIC":
                val = str((std["minimum_value"] + std["maximum_value"]) / 2)
            elif std["parameter_type"] == "BOOLEAN":
                val = "TRUE"
            else:
                val = std["expected_value"]
            results_input.append({"quality_standard_id": std["id"], "observed_value": val})

        client.post(f"/api/v1/quality-tests/{test_id}/complete", json={"results": results_input}, headers=self.headers_inspector)

        # 3. Evaluate Compliance
        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "ACCEPTED")
        self.assertEqual(data["compliance_score"], 100.0)

        # Verify DB persisted
        self.db.expire_all()
        updated_supply = self.db.query(IncomingSupply).filter(IncomingSupply.id == supply.id).first()
        self.assertEqual(updated_supply.final_decision, "ACCEPTED")
        self.assertEqual(updated_supply.compliance_status, "COMPLIANT")
        self.assertEqual(updated_supply.decision_source, "AUTOMATED_COMPLIANCE_ENGINE")

    # TEST 2 — CRITICAL QUALITY FAILURE -> REJECTED
    def test_02_critical_quality_failure_rejected(self):
        supply, batch = self._create_full_supply_chain("CRITFAIL02")
        
        cert = Certificate(
            certificate_number=f"CERT-FAIL-{batch.id}",
            product_id=self.product.id,
            batch_id=batch.id,
            certificate_type="COA",
            verification_status="VALID"
        )
        self.db.add(cert)
        self.db.commit()

        sample_res = client.post("/api/v1/quality-samples", json={
            "incoming_supply_id": supply.id,
            "batch_id": batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 10.0,
            "unit": "TABLETS"
        }, headers=self.headers_inspector)
        sample_id = sample_res.json()["id"]

        test_res = client.post("/api/v1/quality-tests", json={"sample_id": sample_id}, headers=self.headers_inspector)
        test_id = test_res.json()["id"]

        results_input = []
        for r in test_res.json()["test_results"]:
            std = r["quality_standard"]
            if std["is_critical"]:
                # Force failure
                val = str(std["maximum_value"] + 999.0) if std["parameter_type"] == "NUMERIC" else "FAILED_VAL"
            else:
                val = str((std["minimum_value"] + std["maximum_value"]) / 2) if std["parameter_type"] == "NUMERIC" else std.get("expected_value", "TRUE")
            results_input.append({"quality_standard_id": std["id"], "observed_value": val})

        client.post(f"/api/v1/quality-tests/{test_id}/complete", json={"results": results_input}, headers=self.headers_inspector)

        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "REJECTED")
        self.assertEqual(data["decision_severity"], "CRITICAL")
        self.assertIn("Critical", data["decision_reason"])

    # TEST 3 — EXPIRED BATCH -> REJECTED
    def test_03_expired_batch_rejected(self):
        expired_date = datetime.now() - timedelta(days=15)
        supply, batch = self._create_full_supply_chain("EXP03", expiry_date=expired_date)

        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "REJECTED")
        self.assertEqual(data["decision_severity"], "CRITICAL")
        self.assertIn("expired", data["decision_reason"].lower())

    # TEST 4 — CERTIFICATE PENDING -> QUARANTINED
    def test_04_certificate_pending_quarantined(self):
        supply, batch = self._create_full_supply_chain("CERTPEND04")
        
        cert = Certificate(
            certificate_number=f"CERT-PEND-{batch.id}",
            product_id=self.product.id,
            batch_id=batch.id,
            certificate_type="COA",
            verification_status="PENDING" # Pending verification
        )
        self.db.add(cert)
        self.db.commit()

        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "QUARANTINED")
        self.assertIn("pending", data["decision_reason"].lower())

        # Verify quarantine record was created
        qr = self.db.query(QuarantineRecord).filter(QuarantineRecord.incoming_supply_id == supply.id).first()
        self.assertIsNotNone(qr)
        self.assertEqual(qr.status, "ACTIVE")

    # TEST 5 — ACTIVE RECALL -> REJECTED
    def test_05_active_recall_rejected(self):
        supply, batch = self._create_full_supply_chain("REC05", is_recalled=True)

        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "REJECTED")
        self.assertIn("recall", data["decision_reason"].lower())

    # TEST 6 — INCOMPLETE QUALITY TEST -> QUARANTINED
    def test_06_incomplete_quality_test_quarantined(self):
        supply, batch = self._create_full_supply_chain("INCOMP06")

        # No quality test completed yet
        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "QUARANTINED")
        self.assertIn("Quality testing", data["decision_reason"])

    # TEST 7 — MULTIPLE WARNINGS -> QUARANTINED
    def test_07_multiple_warnings_quarantined(self):
        # Expiry soon (60 days)
        near_expiry = datetime.now() + timedelta(days=60)
        supply, batch = self._create_full_supply_chain("WARN07", expiry_date=near_expiry)

        cert = Certificate(
            certificate_number=f"CERT-EXPIRING-{batch.id}",
            product_id=self.product.id,
            batch_id=batch.id,
            certificate_type="COA",
            verification_status="EXPIRING"
        )
        self.db.add(cert)
        self.db.commit()

        eval_res = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(eval_res.status_code, 200)
        data = eval_res.json()
        self.assertEqual(data["final_decision"], "QUARANTINED")
        self.assertTrue(data["compliance_score"] < 100.0)

    # TEST 8 — COMPLIANCE RULES CRUD
    def test_08_compliance_rules_crud(self):
        u_code = f"R-TEST-{uuid.uuid4().hex[:6]}"
        # 1. Create rule (Admin)
        rule_payload = {
            "rule_code": u_code,
            "rule_name": "Custom Temperature Validation",
            "description": "Validates cold storage threshold",
            "rule_type": "STORAGE_VALIDATION",
            "severity": "HIGH",
            "is_active": True
        }
        res = client.post("/api/v1/compliance/rules", json=rule_payload, headers=self.headers_admin)
        self.assertEqual(res.status_code, 201)
        r_id = res.json()["id"]

        # 2. Update rule
        up_res = client.put(f"/api/v1/compliance/rules/{r_id}", json={"severity": "CRITICAL"}, headers=self.headers_admin)
        self.assertEqual(up_res.status_code, 200)
        self.assertEqual(up_res.json()["severity"], "CRITICAL")

        # 3. Deactivate rule
        del_res = client.delete(f"/api/v1/compliance/rules/{r_id}", headers=self.headers_admin)
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["is_active"], False)

    # TEST 9 — CERTIFICATE REGISTRATION & VERIFICATION
    def test_09_certificate_api_lifecycle(self):
        u_cert = f"CERT-API-{uuid.uuid4().hex[:6]}"
        cert_payload = {
            "certificate_number": u_cert,
            "product_id": self.product.id,
            "certificate_type": "GMP",
            "issuer": "World Health Organization",
            "verification_status": "PENDING"
        }
        res = client.post("/api/v1/certificates", json=cert_payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 201)
        c_id = res.json()["id"]

        # Verify certificate
        v_res = client.put(f"/api/v1/certificates/{c_id}", json={"verification_status": "VALID"}, headers=self.headers_inspector)
        self.assertEqual(v_res.status_code, 200)
        self.assertEqual(v_res.json()["verification_status"], "VALID")

    # TEST 10 — DECISION HISTORY & PERSISTENCE
    def test_10_decision_history_retrieval(self):
        supply, batch = self._create_full_supply_chain("HIST10")
        client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)

        h_res = client.get(f"/api/v1/compliance/history/{supply.id}", headers=self.headers_inspector)
        self.assertEqual(h_res.status_code, 200)
        history = h_res.json()
        self.assertTrue(len(history) >= 1)
        self.assertEqual(history[0]["is_automated"], True)

    # TEST 11 — MANUAL OVERRIDE BY ADMIN ONLY
    def test_11_manual_override_by_admin(self):
        supply, batch = self._create_full_supply_chain("OVERRIDE11")
        # Evaluate to QUARANTINED
        client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)

        # Non-admin attempt -> 403
        no_auth = client.post(f"/api/v1/compliance/override/{supply.id}", json={
            "new_decision": "ACCEPTED",
            "reason": "Inspector trying to override"
        }, headers=self.headers_inspector)
        self.assertEqual(no_auth.status_code, 403)

        # Admin override
        override_res = client.post(f"/api/v1/compliance/override/{supply.id}", json={
            "new_decision": "ACCEPTED",
            "reason": "Emergency Ministry of Health special dispensation approved"
        }, headers=self.headers_admin)
        self.assertEqual(override_res.status_code, 200)
        self.assertEqual(override_res.json()["new_decision"], "ACCEPTED")

        # Verify history reflects manual override with is_automated = False
        h_res = client.get(f"/api/v1/compliance/history/{supply.id}", headers=self.headers_admin)
        latest = h_res.json()[0]
        self.assertEqual(latest["is_automated"], False)
        self.assertEqual(latest["decision"], "ACCEPTED")

    # TEST 12 — UNAUTHORIZED ROLE RESTRICTIONS
    def test_12_unauthorized_role_restrictions(self):
        supply, batch = self._create_full_supply_chain("UNAUTH12")

        # Supplier cannot evaluate compliance
        res_supp = client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_supplier)
        self.assertEqual(res_supp.status_code, 403)

        # Hospital cannot create rules
        res_hosp = client.post("/api/v1/compliance/rules", json={
            "rule_code": "R-HOSP", "rule_name": "Hosp", "rule_type": "BATCH_VALIDATION", "severity": "LOW"
        }, headers=self.headers_hospital)
        self.assertEqual(res_hosp.status_code, 403)

    # TEST 13 — ALERTS & AUDIT LOGS
    def test_13_alerts_and_audit_logs(self):
        expired_date = datetime.now() - timedelta(days=20)
        supply, batch = self._create_full_supply_chain("ALERT13", expiry_date=expired_date)
        client.post(f"/api/v1/compliance/evaluate/{supply.id}", headers=self.headers_inspector)

        # Check alert
        alert = self.db.query(Alert).filter(Alert.related_supply_id == supply.id).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.alert_type, "COMPLIANCE_REJECTED")

        # Check audit log
        audit = self.db.query(AuditLog).filter(
            AuditLog.entity_type == "INCOMING_SUPPLY",
            AuditLog.entity_id == str(supply.id)
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.decision, "REJECTED")

if __name__ == "__main__":
    unittest.main()
