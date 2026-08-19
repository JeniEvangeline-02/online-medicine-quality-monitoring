from datetime import datetime, timedelta
from app.database.database import SessionLocal
from app.models import (
    Role, User, UserRole, Manufacturer, Supplier, Product, Batch, IncomingSupply, QualityStandard, QualityStatus
)
from app.core.security import hash_password

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding initial data...")
        
        # 1. Roles
        roles_data = [
            ("ADMIN", "System Administrator"),
            ("QUALITY_INSPECTOR", "Quality Control & Laboratory Inspector"),
            ("SUPPLIER", "Medicine & Consumable Supplier"),
            ("HOSPITAL", "Hospital Quality Representative"),
        ]
        roles = {}
        for name, desc in roles_data:
            r = db.query(Role).filter(Role.name == name).first()
            if not r:
                r = Role(name=name, description=desc)
                db.add(r)
                db.flush()
            roles[name] = r

        # 2. Users
        users_data = [
            ("Admin User", "admin@pharma.com", "Admin@123", "ADMIN"),
            ("Dr. Sarah Inspector", "inspector@pharma.com", "Inspector@123", "QUALITY_INSPECTOR"),
            ("MediGlobal Supplier", "supplier@pharma.com", "Supplier@123", "SUPPLIER"),
            ("City Central Hospital", "hospital@pharma.com", "Hospital@123", "HOSPITAL"),
        ]
        users = {}
        for full_name, email, password, role_name in users_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    full_name=full_name,
                    email=email,
                    password_hash=hash_password(password),
                    role_id=roles[role_name].id,
                    is_active=True
                )
                db.add(u)
                db.flush()
            users[email] = u

        # 3. Manufacturers
        mfg1 = db.query(Manufacturer).filter(Manufacturer.registration_number == "MFG-IND-001").first()
        if not mfg1:
            mfg1 = Manufacturer(
                name="Apex Life Sciences",
                registration_number="MFG-IND-001",
                contact_person="Dr. Rajesh Kumar",
                email="contact@apexlifesciences.com",
                phone="+91-9876543210",
                address="Plot 45, Pharma SEZ, Hyderabad, India",
                status="ACTIVE"
            )
            db.add(mfg1)
            db.flush()

        mfg2 = db.query(Manufacturer).filter(Manufacturer.registration_number == "MFG-IND-002").first()
        if not mfg2:
            mfg2 = Manufacturer(
                name="BioCare MedTech",
                registration_number="MFG-IND-002",
                contact_person="Anita Verma",
                email="support@biocaremedtech.com",
                phone="+91-9876543211",
                address="Block C, Tech Park, Bengaluru, India",
                status="ACTIVE"
            )
            db.add(mfg2)
            db.flush()

        # 4. Suppliers
        sup1 = db.query(Supplier).filter(Supplier.registration_number == "SUP-IND-001").first()
        if not sup1:
            sup1 = Supplier(
                name="MediGlobal Logistics",
                registration_number="SUP-IND-001",
                contact_person="Vikram Seth",
                email="logistics@mediglobal.com",
                phone="+91-9876543212",
                address="Warehouse 12, Logistics Hub, Mumbai, India",
                status="ACTIVE"
            )
            db.add(sup1)
            db.flush()

        # 5. Products
        prod1 = db.query(Product).filter(Product.product_code == "MED-PCM-500").first()
        if not prod1:
            prod1 = Product(
                product_code="MED-PCM-500",
                name="Paracetamol Tablets IP 500mg",
                generic_name="Paracetamol",
                category="Analgesic / Antipyretic",
                product_type="MEDICINE",
                dosage_form="Tablet",
                strength="500mg",
                description="Standard pain relief and antipyretic formulation.",
                manufacturer_id=mfg1.id,
                registration_number="DRUG-2024-8891",
                storage_requirement="Store below 25°C in a dry place",
                status="ACTIVE"
            )
            db.add(prod1)
            db.flush()

        prod2 = db.query(Product).filter(Product.product_code == "MED-AMX-250").first()
        if not prod2:
            prod2 = Product(
                product_code="MED-AMX-250",
                name="Amoxicillin Capsules IP 250mg",
                generic_name="Amoxicillin Trihydrate",
                category="Antibiotic",
                product_type="MEDICINE",
                dosage_form="Capsule",
                strength="250mg",
                description="Broad-spectrum beta-lactam antibiotic formulation.",
                manufacturer_id=mfg1.id,
                registration_number="DRUG-2024-4412",
                storage_requirement="Store in a cool and dry place",
                status="ACTIVE"
            )
            db.add(prod2)
            db.flush()

        prod3 = db.query(Product).filter(Product.product_code == "CON-SYR-005").first()
        if not prod3:
            prod3 = Product(
                product_code="CON-SYR-005",
                name="Sterile Hypodermic Syringe 5ml",
                generic_name="Disposable Syringe with Needle",
                category="Surgical Consumable",
                product_type="CONSUMABLE",
                dosage_form="Device",
                strength="5ml",
                description="Single-use sterile hypodermic syringe 5ml with 23G needle.",
                manufacturer_id=mfg2.id,
                registration_number="DEV-2024-1109",
                storage_requirement="Room temperature, moisture free",
                status="ACTIVE"
            )
            db.add(prod3)
            db.flush()

        # 6. Quality Standards
        standards_data = [
            # Paracetamol Standards
            (prod1.id, "Assay", "NUMERIC", "%", 95.0, 105.0, None, "HPLC Assay USP <621>", True, "USP 43-NF 38"),
            (prod1.id, "pH", "NUMERIC", "pH", 5.0, 7.0, None, "Potentiometric Method USP <791>", False, "IP 2022"),
            (prod1.id, "Dissolution", "NUMERIC", "%", 80.0, 100.0, None, "Apparatus 2 (Paddle) USP <711>", True, "USP-NF"),
            (prod1.id, "Appearance", "QUALITATIVE", None, None, None, "White, circular, flat tablets", "Visual Inspection IP 2.1", False, "IP 2022"),
            (prod1.id, "Packaging Integrity", "BOOLEAN", None, None, None, "TRUE", "Vacuum Leak Test", True, "ISO 11607"),
            (prod1.id, "Sterility Confirmed", "BOOLEAN", None, None, None, "TRUE", "Membrane Filtration USP <71>", True, "USP <71>"),
            
            # Amoxicillin Standards
            (prod2.id, "Assay", "NUMERIC", "%", 90.0, 120.0, None, "HPLC USP <621>", True, "USP 43-NF 38"),
            (prod2.id, "Moisture Content", "NUMERIC", "%", 0.0, 5.0, None, "Karl Fischer Titration USP <921>", False, "USP <921>"),
            (prod2.id, "Color", "QUALITATIVE", None, None, None, "Maroon / Yellow Capsules", "Visual Comparison", False, "In-house Spec"),
            (prod2.id, "Seal Intact", "BOOLEAN", None, None, None, "TRUE", "Physical Inspection", True, "GMP Guidelines"),

            # Sterile Syringe Standards
            (prod3.id, "Volume Accuracy", "NUMERIC", "mL", 4.8, 5.2, None, "Gravimetric Capacity ISO 7886-1", True, "ISO 7886-1"),
            (prod3.id, "Particulate Matter", "QUALITATIVE", None, None, None, "Free of visible particles", "Light Obscuration USP <788>", True, "USP <788>"),
            (prod3.id, "Sterility Confirmed", "BOOLEAN", None, None, None, "TRUE", "Direct Inoculation ISO 11737", True, "ISO 11737"),
            (prod3.id, "Packaging Integrity", "BOOLEAN", None, None, None, "TRUE", "Dye Penetration Test ASTM F1929", True, "ASTM F1929"),
        ]

        for pid, pname, ptype, unit, min_v, max_v, exp_v, method, is_crit, ref in standards_data:
            std = db.query(QualityStandard).filter(
                QualityStandard.product_id == pid,
                QualityStandard.parameter_name == pname
            ).first()
            if not std:
                std = QualityStandard(
                    product_id=pid,
                    parameter_name=pname,
                    parameter_type=ptype,
                    unit=unit,
                    minimum_value=min_v,
                    maximum_value=max_v,
                    expected_value=exp_v,
                    testing_method=method,
                    is_critical=is_crit,
                    standard_reference=ref,
                    is_active=True
                )
                db.add(std)

        # 7. Batches
        batch1 = db.query(Batch).filter(Batch.batch_number == "PCM-2026-001").first()
        if not batch1:
            batch1 = Batch(
                batch_number="PCM-2026-001",
                product_id=prod1.id,
                manufacturer_id=mfg1.id,
                supplier_id=sup1.id,
                manufacturing_date=datetime.now() - timedelta(days=30),
                expiry_date=datetime.now() + timedelta(days=700),
                quantity=10000.0,
                unit="STRIPS",
                storage_requirement="Store below 25°C",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING",
                recall_status="NOT_RECALLED",
                qr_identifier="BATCH-QR-2026-PCM001"
            )
            db.add(batch1)
            db.flush()

        batch2 = db.query(Batch).filter(Batch.batch_number == "AMX-2026-002").first()
        if not batch2:
            batch2 = Batch(
                batch_number="AMX-2026-002",
                product_id=prod2.id,
                manufacturer_id=mfg1.id,
                supplier_id=sup1.id,
                manufacturing_date=datetime.now() - timedelta(days=15),
                expiry_date=datetime.now() + timedelta(days=500),
                quantity=5000.0,
                unit="BOXES",
                storage_requirement="Store below 25°C",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING",
                recall_status="NOT_RECALLED",
                qr_identifier="BATCH-QR-2026-AMX002"
            )
            db.add(batch2)
            db.flush()

        batch3 = db.query(Batch).filter(Batch.batch_number == "SYR-2026-003").first()
        if not batch3:
            batch3 = Batch(
                batch_number="SYR-2026-003",
                product_id=prod3.id,
                manufacturer_id=mfg2.id,
                supplier_id=sup1.id,
                manufacturing_date=datetime.now() - timedelta(days=10),
                expiry_date=datetime.now() + timedelta(days=1000),
                quantity=20000.0,
                unit="PIECES",
                storage_requirement="Dry storage",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING",
                recall_status="NOT_RECALLED",
                qr_identifier="BATCH-QR-2026-SYR003"
            )
            db.add(batch3)
            db.flush()

        # 8. Incoming Supplies
        sup_rec1 = db.query(IncomingSupply).filter(IncomingSupply.receiving_id == "REC-2026-0001").first()
        if not sup_rec1:
            sup_rec1 = IncomingSupply(
                receiving_id="REC-2026-0001",
                batch_id=batch1.id,
                hospital_id=users["hospital@pharma.com"].id,
                quantity_received=2500.0,
                received_date=datetime.now() - timedelta(days=2),
                receiving_location="Main Central Pharmacy Depot",
                transport_status="VERIFIED",
                storage_status="QUARANTINE_AREA",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING"
            )
            db.add(sup_rec1)

        sup_rec2 = db.query(IncomingSupply).filter(IncomingSupply.receiving_id == "REC-2026-0002").first()
        if not sup_rec2:
            sup_rec2 = IncomingSupply(
                receiving_id="REC-2026-0002",
                batch_id=batch2.id,
                hospital_id=users["hospital@pharma.com"].id,
                quantity_received=1200.0,
                received_date=datetime.now() - timedelta(days=1),
                receiving_location="Inpatient Pharmacy Bay 2",
                transport_status="VERIFIED",
                storage_status="QUARANTINE_AREA",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING"
            )
            db.add(sup_rec2)

        sup_rec3 = db.query(IncomingSupply).filter(IncomingSupply.receiving_id == "REC-2026-0003").first()
        if not sup_rec3:
            sup_rec3 = IncomingSupply(
                receiving_id="REC-2026-0003",
                batch_id=batch3.id,
                hospital_id=users["hospital@pharma.com"].id,
                quantity_received=5000.0,
                received_date=datetime.now(),
                receiving_location="Surgical Store Dock 4",
                transport_status="VERIFIED",
                storage_status="QUARANTINE_AREA",
                quality_status="PENDING",
                compliance_status="PENDING",
                final_decision="PENDING"
            )
            db.add(sup_rec3)

        # 8. Seed Compliance Rules
        from app.compliance.rules import seed_default_compliance_rules
        seed_default_compliance_rules(db)

        # 9. Seed Certificates
        from app.models import Certificate
        cert1 = db.query(Certificate).filter(Certificate.certificate_number == "COA-2026-PCM001").first()
        if not cert1 and batch1:
            cert1 = Certificate(
                certificate_number="COA-2026-PCM001",
                product_id=prod1.id,
                batch_id=batch1.id,
                certificate_type="COA",
                issuer="Apex Quality Assurance Labs",
                issue_date=datetime.now() - timedelta(days=20),
                expiry_date=datetime.now() + timedelta(days=700),
                document_path="certificates/COA-2026-PCM001.pdf",
                verification_status="VALID"
            )
            db.add(cert1)

        cert2 = db.query(Certificate).filter(Certificate.certificate_number == "GMP-2025-IND001").first()
        if not cert2 and prod1:
            cert2 = Certificate(
                certificate_number="GMP-2025-IND001",
                product_id=prod1.id,
                certificate_type="GMP",
                issuer="National Drug Regulatory Authority",
                issue_date=datetime.now() - timedelta(days=180),
                expiry_date=datetime.now() + timedelta(days=550),
                document_path="certificates/GMP-2025-IND001.pdf",
                verification_status="VALID"
            )
            db.add(cert2)

        cert3 = db.query(Certificate).filter(Certificate.certificate_number == "COA-2026-AMX002").first()
        if not cert3 and batch2:
            cert3 = Certificate(
                certificate_number="COA-2026-AMX002",
                product_id=prod2.id,
                batch_id=batch2.id,
                certificate_type="COA",
                issuer="BioGen Analytical Control",
                issue_date=datetime.now() - timedelta(days=10),
                expiry_date=datetime.now() + timedelta(days=360),
                document_path="certificates/COA-2026-AMX002.pdf",
                verification_status="VALID"
            )
            db.add(cert3)

        db.commit()
        print("Data seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
