from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.database.database import SessionLocal
from app.models import (
    User, Role, Product, Manufacturer, Supplier, Batch, IncomingSupply,
    QualityStatus, ComplianceStatus, FinalDecision, StorageExcursion,
    AIRiskAssessment, AIAnomaly
)
from app.core.security import create_access_token

client = TestClient(app)

def get_auth_token():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@pharma.com").first()
    if not admin_user:
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = Role(name="ADMIN", description="Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        from app.core.security import hash_password
        admin_user = User(
            email="admin@pharma.com",
            full_name="System Admin",
            password_hash=hash_password("adminpassword123"),
            role_id=admin_role.id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    token = create_access_token(admin_user.id, admin_user.role.name if admin_user.role else "ADMIN")
    db.close()
    return token


def test_phase8_ai_risk_intelligence_and_security():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    # Ensure test entities exist
    m = db.query(Manufacturer).first()
    if not m:
        m = Manufacturer(name="BioTech Pharma Lab", registration_number=f"MFR-PH8-{int(datetime.utcnow().timestamp())}")
        db.add(m)
        db.commit()
        db.refresh(m)
    s = db.query(Supplier).first()
    if not s:
        s = Supplier(name="Apex Global Distribution", registration_number=f"SUP-PH8-{int(datetime.utcnow().timestamp())}")
        db.add(s)
        db.commit()
        db.refresh(s)
    p = db.query(Product).first()
    if not p:
        p = Product(product_code=f"PRD-PH8-{int(datetime.utcnow().timestamp())}", name="Insulin Glargine 100IU", manufacturer_id=m.id)
        db.add(p)
        db.commit()
        db.refresh(p)
    
    # 1. Create a controlled batch with intentional excursion to test AI explainability
    batch = Batch(
        batch_number=f"BATCH-AI-TEST-{int(datetime.utcnow().timestamp())}",
        product_id=p.id,
        manufacturer_id=m.id,
        supplier_id=s.id,
        quantity=5000,
        unit="Vials",
        quality_status=QualityStatus.PASSED,
        compliance_status=ComplianceStatus.COMPLIANT,
        final_decision=FinalDecision.ACCEPTED,
        expiry_date=datetime.utcnow() + timedelta(days=20) # Near expiry factor
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    batch_id = batch.id

    # Add storage excursion for this batch
    exc = StorageExcursion(
        storage_location_id=1,
        batch_id=batch_id,
        parameter="TEMPERATURE",
        expected_min=2.0,
        expected_max=8.0,
        observed_value=12.5,
        severity="WARNING",
        status="OPEN",
        start_time=datetime.utcnow()
    )
    db.add(exc)
    db.commit()
    db.close()

    # 2. Test AI Overview
    res = client.get("/api/v1/ai/overview", headers=headers)
    assert res.status_code == 200
    ov = res.json()
    assert ov["algorithm_version"] == "risk-engine-v1"
    assert "total_evaluated_batches" in ov
    assert "critical_risk_batches" in ov
    assert "high_risk_batches" in ov
    assert "open_anomalies_count" in ov
    assert "active_early_warnings_count" in ov
    assert "risk_distribution" in ov

    # 3. Test Batch Risk Analysis
    res = client.get(f"/api/v1/ai/batch/{batch_id}", headers=headers)
    assert res.status_code == 200
    br = res.json()
    assert br["batch_id"] == batch_id
    assert 0 <= br["risk_score"] <= 100
    assert br["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "factors" in br
    assert "explanation" in br
    assert "recommendations" in br
    assert isinstance(br["recommendations"], list)
    assert br["confidence_score"] > 0
    assert "confidence_reason" in br
    assert br["algorithm_version"] == "risk-engine-v1"

    # Verify Phase 5 Non-Interference
    assert br["compliance_decision"] == "ACCEPTED"

    # 4. Test Supplier Risk Analysis
    res = client.get("/api/v1/ai/suppliers", headers=headers)
    assert res.status_code == 200
    suppliers_risk = res.json()
    assert isinstance(suppliers_risk, list)
    if len(suppliers_risk) > 0:
        first_sup = suppliers_risk[0]
        assert "risk_score" in first_sup
        assert "risk_level" in first_sup
        assert "confidence_reason" in first_sup

    # 5. Test Product Risk Analysis
    res = client.get("/api/v1/ai/products", headers=headers)
    assert res.status_code == 200
    products_risk = res.json()
    assert isinstance(products_risk, list)

    # 6. Test Quality Anomaly Detection & Status Transition
    res = client.get("/api/v1/ai/anomalies", headers=headers)
    assert res.status_code == 200
    anomalies = res.json()
    assert isinstance(anomalies, list)
    assert len(anomalies) >= 1

    first_anom_id = anomalies[0]["id"]
    # Transition status: INVESTIGATING
    res = client.put(
        f"/api/v1/ai/anomalies/{first_anom_id}/status?status=INVESTIGATING&resolution_notes=Auditor+investigating+temperature+spike",
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "INVESTIGATING"

    # Transition status: RESOLVED
    res = client.put(
        f"/api/v1/ai/anomalies/{first_anom_id}/status?status=RESOLVED&resolution_notes=HVAC+compressor+reset+and+verified",
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "RESOLVED"

    # 7. Test Early Warning System
    res = client.get("/api/v1/ai/early-warnings", headers=headers)
    assert res.status_code == 200
    warnings = res.json()
    assert isinstance(warnings, list)
    if len(warnings) > 0:
        w = warnings[0]
        assert "title" in w
        assert "issue" in w
        assert "risk_level" in w
        assert "recommended_action" in w

    # 8. Test AI Recalculate & Audit Persistence
    res = client.post("/api/v1/ai/recalculate", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Verify audit persistence in DB
    db = SessionLocal()
    audit_count = db.query(AIRiskAssessment).filter(AIRiskAssessment.entity_type == "BATCH").count()
    assert audit_count >= 1
    db.close()

    print("Phase 8 AI Risk Intelligence, Anomaly Detection & Security Tests Passed Successfully!")


if __name__ == "__main__":
    test_phase8_ai_risk_intelligence_and_security()
