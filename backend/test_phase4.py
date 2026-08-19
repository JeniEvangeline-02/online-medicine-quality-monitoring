import sys
import unittest
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import SessionLocal
from app.models import User, Role, QualityStandard, QualitySample, QualityTest, QualityTestResult, IncomingSupply, Batch, Product, AuditLog
from app.core.security import create_access_token

client = TestClient(app)

class TestPhase4QualityEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        
        # Fetch or verify test users
        cls.admin_user = cls.db.query(User).filter(User.email == "admin@pharma.com").first()
        cls.inspector_user = cls.db.query(User).filter(User.email == "inspector@pharma.com").first()
        cls.supplier_user = cls.db.query(User).filter(User.email == "supplier@pharma.com").first()
        cls.hospital_user = cls.db.query(User).filter(User.email == "hospital@pharma.com").first()
        
        cls.admin_token = create_access_token(cls.admin_user.id, cls.admin_user.role.name)
        cls.inspector_token = create_access_token(cls.inspector_user.id, cls.inspector_user.role.name)
        cls.supplier_token = create_access_token(cls.supplier_user.id, cls.supplier_user.role.name)
        cls.hospital_token = create_access_token(cls.hospital_user.id, cls.hospital_user.role.name)
        
        cls.headers_inspector = {"Authorization": f"Bearer {cls.inspector_token}"}
        cls.headers_supplier = {"Authorization": f"Bearer {cls.supplier_token}"}
        cls.headers_hospital = {"Authorization": f"Bearer {cls.hospital_token}"}
        cls.headers_admin = {"Authorization": f"Bearer {cls.admin_token}"}

        cls.product = cls.db.query(Product).first()
        cls.batch = cls.db.query(Batch).filter(Batch.product_id == cls.product.id).first()
        cls.supply = cls.db.query(IncomingSupply).filter(IncomingSupply.batch_id == cls.batch.id).first()
        if cls.supply:
            cls.supply.final_decision = "PENDING"
            cls.supply.quality_status = "PENDING"
            cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # 1. Create quality standard
    def test_01_create_quality_standard(self):
        payload = {
            "product_id": self.product.id,
            "parameter_name": "Test Assay Param",
            "parameter_type": "NUMERIC",
            "unit": "%",
            "minimum_value": 90.0,
            "maximum_value": 110.0,
            "testing_method": "HPLC Test",
            "is_critical": True,
            "standard_reference": "USP Ref",
            "is_active": True
        }
        res = client.post("/api/v1/quality-standards", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["parameter_name"], "Test Assay Param")
        self.assertEqual(data["is_critical"], True)
        self.__class__.created_standard_id = data["id"]

    # 2. Update quality standard
    def test_02_update_quality_standard(self):
        payload = {
            "parameter_name": "Test Assay Param Updated",
            "minimum_value": 92.0,
            "maximum_value": 108.0
        }
        res = client.put(f"/api/v1/quality-standards/{self.created_standard_id}", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["parameter_name"], "Test Assay Param Updated")

    # 3. Invalid minimum/maximum
    def test_03_invalid_min_max(self):
        payload = {
            "product_id": self.product.id,
            "parameter_name": "Invalid Range Param",
            "parameter_type": "NUMERIC",
            "unit": "%",
            "minimum_value": 110.0,
            "maximum_value": 90.0, # min > max
            "is_active": True
        }
        res = client.post("/api/v1/quality-standards", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 422)

    # 4. Deactivate standard
    def test_04_deactivate_standard(self):
        res = client.delete(f"/api/v1/quality-standards/{self.created_standard_id}", headers=self.headers_inspector)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["is_active"], False)

    # 5. Create sample
    def test_05_create_sample(self):
        payload = {
            "incoming_supply_id": self.supply.id,
            "batch_id": self.batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 10.0,
            "unit": "TABLETS",
            "sample_condition": "Sealed & Intact",
            "status": "COLLECTED"
        }
        res = client.post("/api/v1/quality-samples", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["sample_code"].startswith("SMP-"))
        self.__class__.sample_id = data["id"]

    # 6. Invalid sample (quantity <= 0)
    def test_06_invalid_sample(self):
        payload = {
            "incoming_supply_id": self.supply.id,
            "batch_id": self.batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": -5.0, # Invalid negative quantity
            "unit": "TABLETS"
        }
        res = client.post("/api/v1/quality-samples", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 422)

    # 7. Create quality test
    def test_07_create_quality_test(self):
        payload = {"sample_id": self.sample_id}
        res = client.post("/api/v1/quality-tests", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["overall_result"], "PENDING")
        self.assertEqual(data["is_completed"], False)
        self.__class__.test_id = data["id"]

    # 8. Retrieve standards for product
    def test_08_retrieve_standards_for_product(self):
        res = client.get(f"/api/v1/quality-standards?product_id={self.product.id}&is_active=true", headers=self.headers_inspector)
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertTrue(len(items) > 0)
        for it in items:
            self.assertEqual(it["product_id"], self.product.id)
            self.assertEqual(it["is_active"], True)

    # 9, 10. Submit numeric result & Numeric PASS
    def test_09_10_numeric_pass(self):
        # Fetch the test to see configured standards
        res = client.get(f"/api/v1/quality-tests/{self.test_id}", headers=self.headers_inspector)
        test_data = res.json()
        results = test_data["test_results"]
        
        numeric_res = next((r for r in results if r["quality_standard"]["parameter_type"] == "NUMERIC"), None)
        if numeric_res:
            std = numeric_res["quality_standard"]
            # Target a passing numeric value: (min + max) / 2
            pass_val = str((std["minimum_value"] + std["maximum_value"]) / 2)
            draft_payload = {
                "results": [{"quality_standard_id": std["id"], "observed_value": pass_val}]
            }
            draft_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=draft_payload, headers=self.headers_inspector)
            self.assertEqual(draft_res.status_code, 200)
            updated_res = next(r for r in draft_res.json()["test_results"] if r["quality_standard_id"] == std["id"])
            self.assertEqual(updated_res["result"], "PASS")

    # 11. Numeric FAIL
    def test_11_numeric_fail(self):
        res = client.get(f"/api/v1/quality-tests/{self.test_id}", headers=self.headers_inspector)
        results = res.json()["test_results"]
        numeric_res = next((r for r in results if r["quality_standard"]["parameter_type"] == "NUMERIC"), None)
        if numeric_res:
            std = numeric_res["quality_standard"]
            fail_val = str(std["maximum_value"] + 50.0) # Well outside range
            draft_payload = {
                "results": [{"quality_standard_id": std["id"], "observed_value": fail_val}]
            }
            draft_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=draft_payload, headers=self.headers_inspector)
            self.assertEqual(draft_res.status_code, 200)
            updated_res = next(r for r in draft_res.json()["test_results"] if r["quality_standard_id"] == std["id"])
            self.assertEqual(updated_res["result"], "FAIL")

    # 12, 13. Qualitative PASS & FAIL
    def test_12_13_qualitative_pass_fail(self):
        res = client.get(f"/api/v1/quality-tests/{self.test_id}", headers=self.headers_inspector)
        results = res.json()["test_results"]
        qual_res = next((r for r in results if r["quality_standard"]["parameter_type"] == "QUALITATIVE"), None)
        if qual_res:
            std = qual_res["quality_standard"]
            # PASS
            pass_payload = {"results": [{"quality_standard_id": std["id"], "observed_value": std["expected_value"]}]}
            pass_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=pass_payload, headers=self.headers_inspector)
            self.assertEqual(next(r for r in pass_res.json()["test_results"] if r["quality_standard_id"] == std["id"])["result"], "PASS")
            
            # FAIL
            fail_payload = {"results": [{"quality_standard_id": std["id"], "observed_value": "Completely wrong color/appearance"}]}
            fail_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=fail_payload, headers=self.headers_inspector)
            self.assertEqual(next(r for r in fail_res.json()["test_results"] if r["quality_standard_id"] == std["id"])["result"], "FAIL")

    # 14, 15. Boolean PASS & FAIL
    def test_14_15_boolean_pass_fail(self):
        res = client.get(f"/api/v1/quality-tests/{self.test_id}", headers=self.headers_inspector)
        results = res.json()["test_results"]
        bool_res = next((r for r in results if r["quality_standard"]["parameter_type"] == "BOOLEAN"), None)
        if bool_res:
            std = bool_res["quality_standard"]
            # PASS
            pass_payload = {"results": [{"quality_standard_id": std["id"], "observed_value": "TRUE"}]}
            pass_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=pass_payload, headers=self.headers_inspector)
            self.assertEqual(next(r for r in pass_res.json()["test_results"] if r["quality_standard_id"] == std["id"])["result"], "PASS")
            
            # FAIL
            fail_payload = {"results": [{"quality_standard_id": std["id"], "observed_value": "FALSE"}]}
            fail_res = client.put(f"/api/v1/quality-tests/{self.test_id}", json=fail_payload, headers=self.headers_inspector)
            self.assertEqual(next(r for r in fail_res.json()["test_results"] if r["quality_standard_id"] == std["id"])["result"], "FAIL")

    # 16, 18. Critical parameter failure & Overall FAIL
    def test_16_18_critical_failure_causes_overall_fail(self):
        # Create a new fresh sample and test for checking complete test with critical failure
        sample_payload = {
            "incoming_supply_id": self.supply.id,
            "batch_id": self.batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 5.0,
            "unit": "TABLETS",
            "sample_condition": "Good"
        }
        s_res = client.post("/api/v1/quality-samples", json=sample_payload, headers=self.headers_inspector)
        s_id = s_res.json()["id"]
        
        t_res = client.post("/api/v1/quality-tests", json={"sample_id": s_id}, headers=self.headers_inspector)
        t_id = t_res.json()["id"]
        
        # Prepare all parameters passing EXCEPT one critical
        results_input = []
        for r in t_res.json()["test_results"]:
            std = r["quality_standard"]
            if std["is_critical"]:
                # Make this critical one fail
                if std["parameter_type"] == "NUMERIC":
                    val = str(std["maximum_value"] + 100)
                elif std["parameter_type"] == "BOOLEAN":
                    val = "FALSE"
                else:
                    val = "Wrong appearance"
            else:
                # Passing
                if std["parameter_type"] == "NUMERIC":
                    val = str((std["minimum_value"] + std["maximum_value"]) / 2)
                elif std["parameter_type"] == "BOOLEAN":
                    val = "TRUE"
                else:
                    val = std["expected_value"]
            results_input.append({"quality_standard_id": std["id"], "observed_value": val})
            
        complete_payload = {"results": results_input, "remarks": "Automated failure test"}
        comp_res = client.post(f"/api/v1/quality-tests/{t_id}/complete", json=complete_payload, headers=self.headers_inspector)
        self.assertEqual(comp_res.status_code, 200)
        self.assertEqual(comp_res.json()["overall_result"], "FAIL")
        self.assertEqual(comp_res.json()["is_completed"], True)

    # 17, 20. Overall PASS & Complete test
    def test_17_20_complete_test_overall_pass(self):
        sample_payload = {
            "incoming_supply_id": self.supply.id,
            "batch_id": self.batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 5.0,
            "unit": "TABLETS",
            "sample_condition": "Good"
        }
        s_res = client.post("/api/v1/quality-samples", json=sample_payload, headers=self.headers_inspector)
        s_id = s_res.json()["id"]
        
        t_res = client.post("/api/v1/quality-tests", json={"sample_id": s_id}, headers=self.headers_inspector)
        t_id = t_res.json()["id"]
        
        results_input = []
        for r in t_res.json()["test_results"]:
            std = r["quality_standard"]
            if std["parameter_type"] == "NUMERIC":
                val = str((std["minimum_value"] + std["maximum_value"]) / 2)
            elif std["parameter_type"] == "BOOLEAN":
                val = "TRUE"
            else:
                val = std["expected_value"]
            results_input.append({"quality_standard_id": std["id"], "observed_value": val})
            
        complete_payload = {
            "results": results_input,
            "laboratory_report": "LAB-REP-2026-001.pdf",
            "remarks": "All parameters conform to IP/USP specifications."
        }
        comp_res = client.post(f"/api/v1/quality-tests/{t_id}/complete", json=complete_payload, headers=self.headers_inspector)
        self.assertEqual(comp_res.status_code, 200)
        self.assertEqual(comp_res.json()["overall_result"], "PASS")
        self.assertEqual(comp_res.json()["is_completed"], True)
        self.__class__.completed_pass_test_id = t_id

        # Verify incoming supply status updated to PASSED
        supply_res = client.get(f"/api/v1/incoming-supplies/{self.supply.id}", headers=self.headers_inspector)
        self.assertEqual(supply_res.json()["quality_status"], "PASSED")
        # Ensure final_decision is still PENDING
        self.assertEqual(supply_res.json()["final_decision"], "PENDING")

    # 19. Incomplete test
    def test_19_incomplete_test_cannot_complete(self):
        sample_payload = {
            "incoming_supply_id": self.supply.id,
            "batch_id": self.batch.id,
            "collection_date": datetime.now().isoformat(),
            "sample_quantity": 5.0,
            "unit": "TABLETS",
            "sample_condition": "Good"
        }
        s_res = client.post("/api/v1/quality-samples", json=sample_payload, headers=self.headers_inspector)
        s_id = s_res.json()["id"]
        t_res = client.post("/api/v1/quality-tests", json={"sample_id": s_id}, headers=self.headers_inspector)
        t_id = t_res.json()["id"]
        
        # Submit empty or missing results
        complete_payload = {"results": []}
        comp_res = client.post(f"/api/v1/quality-tests/{t_id}/complete", json=complete_payload, headers=self.headers_inspector)
        self.assertEqual(comp_res.status_code, 422)

    # 21. Completed test becomes read-only
    def test_21_completed_test_read_only(self):
        payload = {
            "results": [],
            "remarks": "Attempting to change completed test remarks"
        }
        res = client.put(f"/api/v1/quality-tests/{self.completed_pass_test_id}", json=payload, headers=self.headers_inspector)
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot be modified", res.json()["detail"])

    # 22. Retest foundation
    def test_22_retest_foundation(self):
        # Can create a new test for the same sample after previous is completed
        # Fetch sample of completed test
        comp_test = client.get(f"/api/v1/quality-tests/{self.completed_pass_test_id}", headers=self.headers_inspector).json()
        s_id = comp_test["sample_id"]
        
        # Start a re-test
        retest_res = client.post("/api/v1/quality-tests", json={"sample_id": s_id}, headers=self.headers_inspector)
        self.assertEqual(retest_res.status_code, 201)
        self.assertNotEqual(retest_res.json()["id"], self.completed_pass_test_id)
        self.assertEqual(retest_res.json()["overall_result"], "PENDING")

    # 23. Unauthorized supplier attempt
    def test_23_unauthorized_supplier_attempt(self):
        payload = {"sample_id": self.sample_id}
        res = client.post("/api/v1/quality-tests", json=payload, headers=self.headers_supplier)
        self.assertEqual(res.status_code, 403)

    # 24. Unauthorized hospital attempt
    def test_24_unauthorized_hospital_attempt(self):
        payload = {"sample_id": self.sample_id}
        res = client.post("/api/v1/quality-tests", json=payload, headers=self.headers_hospital)
        self.assertEqual(res.status_code, 403)

    # 25. Audit log creation
    def test_25_audit_logs_created(self):
        logs = self.db.query(AuditLog).filter(
            AuditLog.action.in_([
                "QUALITY_STANDARD_CREATED",
                "SAMPLE_CREATED",
                "QUALITY_TEST_CREATED",
                "QUALITY_TEST_COMPLETED"
            ])
        ).all()
        self.assertTrue(len(logs) >= 4)
        actions = [l.action for l in logs]
        self.assertIn("QUALITY_STANDARD_CREATED", actions)
        self.assertIn("SAMPLE_CREATED", actions)
        self.assertIn("QUALITY_TEST_CREATED", actions)
        self.assertIn("QUALITY_TEST_COMPLETED", actions)

if __name__ == "__main__":
    unittest.main()
