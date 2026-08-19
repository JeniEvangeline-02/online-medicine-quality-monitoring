from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.database.database import SessionLocal
from app.models import User, Role, Product, Manufacturer, Supplier, Batch, IncomingSupply, QualityStatus, ComplianceStatus, FinalDecision
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


def test_phase7_quality_command_center_and_analytics():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test Command Center Overview API
    res = client.get("/api/v1/dashboard/command-center", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["system_status"] == "OPERATIONAL"
    assert "last_synced" in data
    assert "quality_health" in data
    assert 0 <= data["quality_health"]["score"] <= 100
    assert data["quality_health"]["status"] in ["EXCELLENT", "GOOD", "NEEDS_ATTENTION", "CRITICAL"]

    assert "overall_status" in data
    assert data["overall_status"]["total_incoming"] >= 0
    assert "decision_distribution" in data
    assert "ACCEPTED" in data["decision_distribution"]
    assert "QUARANTINED" in data["decision_distribution"]
    assert "REJECTED" in data["decision_distribution"]
    assert "PENDING" in data["decision_distribution"]

    assert "action_required" in data
    assert isinstance(data["action_required"], list)
    assert "alert_stream" in data
    assert isinstance(data["alert_stream"], list)

    # 2. Test Risk Matrix API
    res = client.get("/api/v1/dashboard/risk-matrix", headers=headers)
    assert res.status_code == 200
    risk = res.json()
    assert "matrix_counts" in risk
    assert "CRITICAL" in risk["matrix_counts"]
    assert "HIGH" in risk["matrix_counts"]
    assert "MEDIUM" in risk["matrix_counts"]
    assert "LOW" in risk["matrix_counts"]
    assert "batches" in risk
    assert isinstance(risk["batches"], list)

    # 3. Test Analytics Endpoints
    # Quality Analytics
    res = client.get("/api/v1/analytics/quality?days=30", headers=headers)
    assert res.status_code == 200
    q_data = res.json()
    assert "summary" in q_data
    assert "pass_rate" in q_data["summary"]
    assert "trend" in q_data

    # Compliance Analytics
    res = client.get("/api/v1/analytics/compliance?days=30", headers=headers)
    assert res.status_code == 200
    c_data = res.json()
    assert "summary" in c_data
    assert "compliance_rate" in c_data["summary"]
    assert "top_failed_rules" in c_data

    # Supplier Analytics
    res = client.get("/api/v1/analytics/suppliers", headers=headers)
    assert res.status_code == 200
    s_data = res.json()
    assert isinstance(s_data, list)

    # Product Analytics
    res = client.get("/api/v1/analytics/products", headers=headers)
    assert res.status_code == 200
    p_data = res.json()
    assert isinstance(p_data, list)

    # Storage Analytics
    res = client.get("/api/v1/analytics/storage", headers=headers)
    assert res.status_code == 200
    st_data = res.json()
    assert "total_locations" in st_data

    # Transport Analytics
    res = client.get("/api/v1/analytics/transport", headers=headers)
    assert res.status_code == 200
    tr_data = res.json()
    assert "summary" in tr_data

    # Recall Analytics
    res = client.get("/api/v1/analytics/recalls", headers=headers)
    assert res.status_code == 200
    rc_data = res.json()
    assert "summary" in rc_data

    # 4. Test Report Previews for all 13 Report Types
    report_types = [
        "quality_summary", "quality_testing", "compliance", "incoming_supply",
        "batch_quality", "supplier_performance", "manufacturer", "storage_monitoring",
        "transport_monitoring", "quarantine", "recall", "corrective_action", "audit"
    ]

    for rt in report_types:
        res = client.get(f"/api/v1/reports/{rt}/preview", headers=headers)
        assert res.status_code == 200, f"Failed for report {rt}"
        rep = res.json()
        assert rep["report_type"] == rt
        assert "headers" in rep
        assert "rows" in rep
        assert "total_records" in rep

    # 5. Test CSV Export
    res = client.get("/api/v1/reports/quality_summary/export/csv", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "Hospital Pharmaceutical Quality" in res.text

    # 6. Test Global Search Endpoint
    res = client.get("/api/v1/search/global?q=BATCH", headers=headers)
    assert res.status_code == 200
    search_data = res.json()
    assert "products" in search_data
    assert "batches" in search_data
    assert "suppliers" in search_data
    assert "incoming_supplies" in search_data
    assert "recalls" in search_data
    assert "alerts" in search_data

    print("Phase 7 Command Center, Analytics, Reports & Search Test Passed Successfully!")


if __name__ == "__main__":
    test_phase7_quality_command_center_and_analytics()
