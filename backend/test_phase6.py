from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.database.database import SessionLocal
from app.models import User, Role, Product, Manufacturer, Supplier, Batch, QualityStatus, ComplianceStatus, FinalDecision

client = TestClient(app)

from app.core.security import create_access_token

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


def test_phase6_full_lifecycle():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Setup valid manufacturer, supplier, product and batch
    db = SessionLocal()
    m = db.query(Manufacturer).first()
    if not m:
        m = Manufacturer(name="Apex Pharma", registration_number=f"MFR-{int(datetime.utcnow().timestamp())}")
        db.add(m)
        db.commit()
        db.refresh(m)
    s = db.query(Supplier).first()
    if not s:
        s = Supplier(name="MedSupply Global", registration_number=f"SUP-{int(datetime.utcnow().timestamp())}")
        db.add(s)
        db.commit()
        db.refresh(s)
    p = db.query(Product).first()
    if not p:
        p = Product(product_code=f"PRD-{int(datetime.utcnow().timestamp())}", name="Amoxicillin 500mg", manufacturer_id=m.id)
        db.add(p)
        db.commit()
        db.refresh(p)
    
    test_batch_num = f"BATCH-PH6-{int(datetime.utcnow().timestamp())}"
    batch = Batch(
        batch_number=test_batch_num,
        product_id=p.id,
        manufacturer_id=m.id,
        supplier_id=s.id,
        quantity=10000,
        unit="Tablets",
        quality_status=QualityStatus.PASSED,
        compliance_status=ComplianceStatus.COMPLIANT,
        final_decision=FinalDecision.ACCEPTED
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    batch_id = batch.id
    db.close()

    # 1. Verify health
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # 2. Traceability: Log Event
    trace_payload = {
        "entity_type": "BATCH",
        "entity_id": batch_id,
        "event_type": "MANUFACTURED",
        "location": "Sterile Plant Alpha",
        "reference_id": f"QR-{test_batch_num}",
        "remarks": "Manufactured under GMP standards",
        "metadata_json": '{"batch_size": 10000}'
    }
    res = client.post("/api/v1/traceability/events", json=trace_payload, headers=headers)
    assert res.status_code == 201
    event_data = res.json()
    assert event_data["event_type"] == "MANUFACTURED"
    assert event_data["entity_id"] == batch_id

    # List events
    res = client.get("/api/v1/traceability/events?entity_type=BATCH", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 3. Storage: Create Location & Record Readings
    loc_payload = {
        "name": "Central Vaccine Cold Room",
        "location_code": f"COLD-ROOM-{int(datetime.utcnow().timestamp())}",
        "minimum_temperature": 2.0,
        "maximum_temperature": 8.0,
        "minimum_humidity": 30.0,
        "maximum_humidity": 65.0,
        "status": "ACTIVE"
    }
    res = client.post("/api/v1/storage/locations", json=loc_payload, headers=headers)
    assert res.status_code == 201
    loc_id = res.json()["id"]

    # Log normal reading
    read_payload = {
        "storage_location_id": loc_id,
        "recorded_temperature": 4.5,
        "recorded_humidity": 45.0,
        "recorded_at": datetime.utcnow().isoformat(),
        "source": "MANUAL",
        "batch_id": batch_id,
        "notes": "Routine inspection"
    }
    res = client.post("/api/v1/storage/monitoring", json=read_payload, headers=headers)
    assert res.status_code == 201
    assert res.json()["overall_status"] == "NORMAL"

    # Report Storage Excursion (High Temp)
    exc_payload = {
        "storage_location_id": loc_id,
        "batch_id": batch_id,
        "parameter": "TEMPERATURE",
        "expected_min": 2.0,
        "expected_max": 8.0,
        "observed_value": 14.8,
        "severity": "CRITICAL",
        "start_time": datetime.utcnow().isoformat(),
        "notes": "Cooling unit compressor failed"
    }
    res = client.post("/api/v1/storage/excursions", json=exc_payload, headers=headers)
    assert res.status_code == 201
    exc_id = res.json()["id"]
    assert res.json()["status"] == "OPEN"

    # 4. Check that Alert was auto-generated from excursion
    res = client.get("/api/v1/alerts?severity=CRITICAL", headers=headers)
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]

    # Acknowledge Alert
    res = client.put(f"/api/v1/alerts/{alert_id}/acknowledge", headers=headers)
    assert res.status_code == 200

    # 5. Quarantine Affected Batch
    q_payload = {
        "batch_id": batch_id,
        "reason": "Exposed to 14.8°C excursion during storage",
        "reason_type": "Storage Excursion",
        "severity": "CRITICAL",
        "location": "Quarantine Cold Lock 2",
        "assigned_to": 1
    }
    res = client.post("/api/v1/quarantine", json=q_payload, headers=headers)
    assert res.status_code == 201
    q_id = res.json()["id"]
    assert res.json()["status"] == "ACTIVE"

    # 6. Corrective Action (CAPA)
    capa_payload = {
        "reference_type": "STORAGE_EXCURSION",
        "reference_id": exc_id,
        "action_type": "INVESTIGATE",
        "description": "Perform HPLC stability retest and inspect compressor",
        "batch_id": batch_id,
        "priority": "CRITICAL",
        "due_date": (datetime.utcnow() + timedelta(days=2)).isoformat()
    }
    res = client.post("/api/v1/corrective-actions", json=capa_payload, headers=headers)
    assert res.status_code == 201
    capa_id = res.json()["id"]
    assert res.json()["status"] == "OPEN"

    # Complete CAPA
    res = client.put(
        f"/api/v1/corrective-actions/{capa_id}",
        json={"status": "COMPLETED", "completion_notes": "Retest confirmed active ingredient degraded. Batch rejected."},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"

    # Resolve Excursion
    res = client.put(
        f"/api/v1/storage/excursions/{exc_id}/resolve",
        json={"resolution_notes": "Compressor serviced and batch isolated."},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "RESOLVED"

    # Update Quarantine status
    res = client.put(
        f"/api/v1/quarantine/{q_id}",
        json={"status": "DISPOSED", "resolution_notes": "Safely incinerated due to stability failure."},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "DISPOSED"

    # 7. Transport Tracking
    trans_payload = {
        "transport_id": f"TR-EXP-{int(datetime.utcnow().timestamp())}",
        "batch_id": batch_id,
        "carrier_name": "ColdLogistics Express",
        "vehicle_number": "MH-12-AB-9876",
        "source_location": "Central Warehouse",
        "destination_location": "District Hospital Pharmacy",
        "departure_time": datetime.utcnow().isoformat(),
        "temperature_min_required": 15.0,
        "temperature_max_required": 25.0,
        "notes": "Ambient shipment"
    }
    res = client.post("/api/v1/transport", json=trans_payload, headers=headers)
    assert res.status_code == 201
    trans_num_id = res.json()["id"]

    # Log Transport reading
    res = client.post(
        "/api/v1/transport/monitoring",
        json={
            "transport_id": trans_num_id,
            "recorded_temperature": 21.2,
            "recorded_humidity": 50.0,
            "recorded_at": datetime.utcnow().isoformat(),
            "location_at_time": "Highway Toll Station",
            "notes": "In transit, GPS verified"
        },
        headers=headers
    )
    assert res.status_code == 201
    assert res.json()["overall_status"] == "NORMAL"

    # Update Transport to ARRIVED
    res = client.put(
        f"/api/v1/transport/{trans_num_id}",
        json={"status": "ARRIVED", "actual_arrival": datetime.utcnow().isoformat()},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ARRIVED"

    # 8. Recall Workflow (e.g. for batches in the field)
    recall_payload = {
        "batch_id": batch_id,
        "reason": "Suspected packaging seal defect causing humidity infiltration",
        "description": "Hospital reported discoloration in 2 bottles",
        "severity": "HIGH",
        "instructions": "Quarantine on shelf, return to central dispensary immediately"
    }
    res = client.post("/api/v1/recalls", json=recall_payload, headers=headers)
    assert res.status_code == 201
    recall_id = res.json()["id"]
    assert res.json()["status"] == "ACTIVE"

    # Update Recall
    res = client.put(
        f"/api/v1/recalls/{recall_id}",
        json={"status": "COMPLETED", "affected_supplies_count": 4850},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"

    # Resolve alert
    res = client.put(
        f"/api/v1/alerts/{alert_id}/resolve?resolution_notes=All+remedial+actions+completed",
        headers=headers
    )
    assert res.status_code == 200

    print("Phase 6 End-to-End Test Passed Successfully!")


if __name__ == "__main__":
    test_phase6_full_lifecycle()
