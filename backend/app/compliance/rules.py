from app.models import ComplianceRule

RULE_PRODUCT_REGISTRATION = "PRODUCT_REGISTRATION"
RULE_BATCH_VALIDATION = "BATCH_VALIDATION"
RULE_EXPIRY_VALIDATION = "EXPIRY_VALIDATION"
RULE_CERTIFICATE_VALIDATION = "CERTIFICATE_VALIDATION"
RULE_QUALITY_VALIDATION = "QUALITY_VALIDATION"
RULE_SUPPLIER_VALIDATION = "SUPPLIER_VALIDATION"
RULE_RECALL_VALIDATION = "RECALL_VALIDATION"
RULE_STORAGE_VALIDATION = "STORAGE_VALIDATION"
RULE_TRANSPORT_VALIDATION = "TRANSPORT_VALIDATION"

DEFAULT_COMPLIANCE_RULES = [
    {
        "rule_code": "R-PROD-01",
        "rule_name": "Product Regulatory Registration",
        "description": "Validates that the received product has a valid drug regulatory registration and is in ACTIVE status.",
        "rule_type": RULE_PRODUCT_REGISTRATION,
        "severity": "CRITICAL",
        "is_active": True
    },
    {
        "rule_code": "R-BATCH-01",
        "rule_name": "Batch Consistency & Identification",
        "description": "Verifies batch integrity, manufacturer-product linkage, supplier association, and positive quantity.",
        "rule_type": RULE_BATCH_VALIDATION,
        "severity": "HIGH",
        "is_active": True
    },
    {
        "rule_code": "R-EXP-01",
        "rule_name": "Product Expiry Compliance",
        "description": "Validates that the batch is not expired. Rejects expired products immediately; flags near-expiry batches.",
        "rule_type": RULE_EXPIRY_VALIDATION,
        "severity": "CRITICAL",
        "is_active": True
    },
    {
        "rule_code": "R-CERT-01",
        "rule_name": "Regulatory Certificate & COA Verification",
        "description": "Ensures valid certificate of analysis (COA), GMP, or regulatory certificates are on file and unexpired.",
        "rule_type": RULE_CERTIFICATE_VALIDATION,
        "severity": "HIGH",
        "is_active": True
    },
    {
        "rule_code": "R-QUAL-01",
        "rule_name": "Laboratory Quality Testing Conformance",
        "description": "Validates that laboratory testing is fully completed and all critical quality parameters pass pharmacopoeial limits.",
        "rule_type": RULE_QUALITY_VALIDATION,
        "severity": "CRITICAL",
        "is_active": True
    },
    {
        "rule_code": "R-SUPP-01",
        "rule_name": "Supplier Regulatory Authorization",
        "description": "Ensures the distributor/supplier has an ACTIVE authorization and is not SUSPENDED or INACTIVE.",
        "rule_type": RULE_SUPPLIER_VALIDATION,
        "severity": "HIGH",
        "is_active": True
    },
    {
        "rule_code": "R-REC-01",
        "rule_name": "Recall & Safety Alert Check",
        "description": "Validates that the batch is not subject to any active regulatory safety recall or market withdrawal.",
        "rule_type": RULE_RECALL_VALIDATION,
        "severity": "CRITICAL",
        "is_active": True
    },
    {
        "rule_code": "R-STOR-01",
        "rule_name": "Storage Condition Compatibility",
        "description": "Architectural check for temperature/humidity condition compatibility.",
        "rule_type": RULE_STORAGE_VALIDATION,
        "severity": "MEDIUM",
        "is_active": True
    },
    {
        "rule_code": "R-TRAN-01",
        "rule_name": "Transport & Cold-Chain Integrity",
        "description": "Architectural check for shipping transport condition and package tamper verification.",
        "rule_type": RULE_TRANSPORT_VALIDATION,
        "severity": "MEDIUM",
        "is_active": True
    }
]

def seed_default_compliance_rules(db):
    """Seed standard regulatory compliance rules if not already present."""
    count = 0
    for r_data in DEFAULT_COMPLIANCE_RULES:
        existing = db.query(ComplianceRule).filter(ComplianceRule.rule_code == r_data["rule_code"]).first()
        if not existing:
            rule = ComplianceRule(**r_data)
            db.add(rule)
            count += 1
    if count > 0:
        db.commit()
        print(f"Seeded {count} compliance rules.")
