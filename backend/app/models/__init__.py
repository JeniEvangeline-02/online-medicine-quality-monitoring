from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    QUALITY_INSPECTOR = "QUALITY_INSPECTOR"
    SUPPLIER = "SUPPLIER"
    HOSPITAL = "HOSPITAL"

class QualityStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    UNDER_REVIEW = "UNDER_REVIEW"

class ComplianceStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    UNDER_REVIEW = "UNDER_REVIEW"

class FinalDecision(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    QUARANTINED = "QUARANTINED"
    REJECTED = "REJECTED"

class RecallStatus(str, enum.Enum):
    NOT_RECALLED = "NOT_RECALLED"
    RECALLED = "RECALLED"

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")

class Manufacturer(Base):
    __tablename__ = "manufacturers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    registration_number = Column(String, unique=True)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    products = relationship("Product", back_populates="manufacturer")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    registration_number = Column(String, unique=True)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batches = relationship("Batch", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    generic_name = Column(String)
    category = Column(String)
    product_type = Column(String) # MEDICINE, CONSUMABLE
    dosage_form = Column(String)
    strength = Column(String)
    description = Column(Text)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False)
    registration_number = Column(String)
    storage_requirement = Column(String)
    status = Column(String, default="ACTIVE")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    manufacturer = relationship("Manufacturer", back_populates="products")
    batches = relationship("Batch", back_populates="product")
    quality_standards = relationship("QualityStandard", back_populates="product")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    manufacturing_date = Column(DateTime)
    expiry_date = Column(DateTime)
    quantity = Column(Float)
    unit = Column(String)
    storage_requirement = Column(String)
    quality_status = Column(Enum(QualityStatus), default=QualityStatus.PENDING)
    compliance_status = Column(Enum(ComplianceStatus), default=ComplianceStatus.PENDING)
    final_decision = Column(Enum(FinalDecision), default=FinalDecision.PENDING)
    recall_status = Column(Enum(RecallStatus), default=RecallStatus.NOT_RECALLED)
    qr_identifier = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", back_populates="batches")
    manufacturer = relationship("Manufacturer", foreign_keys=[manufacturer_id])
    supplier = relationship("Supplier", back_populates="batches")
    quality_tests = relationship("QualityTest", back_populates="batch")
    certificates = relationship("Certificate", back_populates="batch")
    incoming_supplies = relationship("IncomingSupply", back_populates="batch")
    storage_readings = relationship("StorageReading", back_populates="batch")
    transport_records = relationship("TransportRecord", back_populates="batch")
    recalls = relationship("Recall", back_populates="batch")
    quality_samples = relationship("QualitySample", back_populates="batch")

    @property
    def expiry_status(self):
        if not self.expiry_date:
            return "UNKNOWN"
        now = datetime.now()
        exp = self.expiry_date
        # Handle date or datetime
        exp_date = exp.date() if hasattr(exp, 'date') else exp
        now_date = now.date() if hasattr(now, 'date') else now
        days = (exp_date - now_date).days
        if days <= 0:
            return "EXPIRED"
        elif days <= 30:
            return "URGENT"
        elif days <= 90:
            return "EXPIRING_SOON"
        return "SAFE"

class IncomingSupply(Base):
    __tablename__ = "incoming_supplies"
    id = Column(Integer, primary_key=True, index=True)
    receiving_id = Column(String, unique=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    hospital_id = Column(Integer, nullable=False) # Simplified for Phase 1
    quantity_received = Column(Float)
    received_date = Column(DateTime)
    receiving_location = Column(String)
    transport_status = Column(String)
    storage_status = Column(String)
    quality_status = Column(String)
    compliance_status = Column(String)
    final_decision = Column(String)
    rejection_reason = Column(Text)
    decision_reason = Column(Text)
    decision_date = Column(DateTime)
    decision_source = Column(String)
    decision_severity = Column(String)
    compliance_score = Column(Float, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="incoming_supplies")
    compliance_evaluations = relationship("ComplianceEvaluation", back_populates="incoming_supply")
    quarantine_records = relationship("QuarantineRecord", back_populates="incoming_supply")
    quality_samples = relationship("QualitySample", back_populates="incoming_supply")
    decision_history = relationship("ComplianceDecisionHistory", back_populates="incoming_supply", order_by="desc(ComplianceDecisionHistory.decided_at)")

class QualityStandard(Base):
    __tablename__ = "quality_standards"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    parameter_name = Column(String, nullable=False)
    parameter_type = Column(String) # NUMERIC, QUALITATIVE, BOOLEAN
    expected_value = Column(String)
    unit = Column(String)
    minimum_value = Column(Float)
    maximum_value = Column(Float)
    testing_method = Column(String)
    is_critical = Column(Boolean, default=False)
    standard_reference = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", back_populates="quality_standards")
    test_results = relationship("QualityTestResult", back_populates="quality_standard")

class QualitySample(Base):
    __tablename__ = "quality_samples"
    id = Column(Integer, primary_key=True, index=True)
    sample_code = Column(String, unique=True, index=True, nullable=False)
    incoming_supply_id = Column(Integer, ForeignKey("incoming_supplies.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    collected_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    collection_date = Column(DateTime, nullable=False)
    sample_quantity = Column(Float, nullable=False)
    unit = Column(String)
    sample_condition = Column(String)
    status = Column(String, default="COLLECTED") # COLLECTED, UNDER_TEST, TEST_COMPLETED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="quality_samples")
    incoming_supply = relationship("IncomingSupply", back_populates="quality_samples")
    collector = relationship("User", foreign_keys=[collected_by])
    quality_tests = relationship("QualityTest", back_populates="quality_sample")

class QualityTest(Base):
    __tablename__ = "quality_tests"
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("quality_samples.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"))
    test_date = Column(DateTime)
    overall_result = Column(String, default="PENDING")
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, COMPLETED
    is_completed = Column(Boolean, default=False)
    laboratory_report = Column(String) # path or url
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="quality_tests")
    quality_sample = relationship("QualitySample", back_populates="quality_tests")
    inspector = relationship("User", foreign_keys=[inspector_id])
    test_results = relationship("QualityTestResult", back_populates="quality_test")

class QualityTestResult(Base):
    __tablename__ = "quality_test_results"
    id = Column(Integer, primary_key=True, index=True)
    quality_test_id = Column(Integer, ForeignKey("quality_tests.id"), nullable=False)
    quality_standard_id = Column(Integer, ForeignKey("quality_standards.id"), nullable=False)
    observed_value = Column(String)
    result = Column(String) # PASS, FAIL, WARNING, REVIEW
    is_critical_failure = Column(Boolean, default=False)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quality_test = relationship("QualityTest", back_populates="test_results")
    quality_standard = relationship("QualityStandard", back_populates="test_results")

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    certificate_number = Column(String, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))
    certificate_type = Column(String)
    issuer = Column(String)
    issue_date = Column(DateTime)
    expiry_date = Column(DateTime)
    document_path = Column(String)
    verification_status = Column(String) # VALID, EXPIRING, EXPIRED, INVALID, PENDING
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="certificates")

class StorageLocation(Base):
    __tablename__ = "storage_locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location_code = Column(String, unique=True)
    hospital_id = Column(Integer)
    minimum_temperature = Column(Float)
    maximum_temperature = Column(Float)
    minimum_humidity = Column(Float)
    maximum_humidity = Column(Float)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StorageReading(Base):
    __tablename__ = "storage_readings"
    id = Column(Integer, primary_key=True, index=True)
    storage_location_id = Column(Integer, ForeignKey("storage_locations.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    recorded_at = Column(DateTime)
    temperature_status = Column(String)
    humidity_status = Column(String)

    batch = relationship("Batch", back_populates="storage_readings")
    location = relationship("StorageLocation")

class TransportRecord(Base):
    __tablename__ = "transport_records"
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(String, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    dispatch_time = Column(DateTime)
    arrival_time = Column(DateTime)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="transport_records")

class TransportReading(Base):
    __tablename__ = "transport_readings"
    id = Column(Integer, primary_key=True, index=True)
    transport_record_id = Column(Integer, ForeignKey("transport_records.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    recorded_at = Column(DateTime)
    status = Column(String)

    transport_record = relationship("TransportRecord")

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String, unique=True, index=True)
    rule_name = Column(String)
    description = Column(Text)
    rule_type = Column(String)
    severity = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    evaluations = relationship("ComplianceEvaluation", back_populates="rule")

class ComplianceEvaluation(Base):
    __tablename__ = "compliance_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    incoming_supply_id = Column(Integer, ForeignKey("incoming_supplies.id"))
    rule_id = Column(Integer, ForeignKey("compliance_rules.id"))
    input_value = Column(String)
    expected_value = Column(String)
    evaluation_result = Column(String) # PASS, FAIL, WARNING, REVIEW
    reason = Column(Text)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    rule_version = Column(String)

    incoming_supply = relationship("IncomingSupply", back_populates="compliance_evaluations")
    rule = relationship("ComplianceRule", back_populates="evaluations")

class ComplianceDecisionHistory(Base):
    __tablename__ = "compliance_decision_history"
    id = Column(Integer, primary_key=True, index=True)
    incoming_supply_id = Column(Integer, ForeignKey("incoming_supplies.id"), nullable=False)
    decision = Column(String, nullable=False) # ACCEPTED, QUARANTINED, REJECTED, PENDING
    reason = Column(Text)
    severity = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    triggered_rule = Column(String)
    compliance_score = Column(Float, default=100.0)
    decided_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for automated decisions
    is_automated = Column(Boolean, default=True)

    incoming_supply = relationship("IncomingSupply", back_populates="decision_history")
    user = relationship("User", foreign_keys=[decided_by])

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String)
    severity = Column(String)
    title = Column(String)
    message = Column(Text)
    related_batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    related_supply_id = Column(Integer, ForeignKey("incoming_supplies.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Phase 6 extended fields
    status = Column(String, default="UNREAD")  # UNREAD, ACKNOWLEDGED, IN_PROGRESS, RESOLVED
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"
    id = Column(Integer, primary_key=True, index=True)
    incoming_supply_id = Column(Integer, ForeignKey("incoming_supplies.id"))
    reason = Column(Text)
    status = Column(String)  # ACTIVE, UNDER_REVIEW, RELEASED, REJECTED, DISPOSED
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    # Phase 6 extended fields
    quarantine_number = Column(String, nullable=True, index=True)
    reason_type = Column(String, nullable=True)  # Quality Failure, Compliance Failure, Storage Excursion, etc.
    severity = Column(String, nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    location = Column(String, nullable=True)

    incoming_supply = relationship("IncomingSupply", back_populates="quarantine_records")
    batch = relationship("Batch", foreign_keys=[batch_id])
    assigned_officer = relationship("User", foreign_keys=[assigned_to])

class Recall(Base):
    __tablename__ = "recalls"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"))
    recall_number = Column(String, unique=True, index=True)
    reason = Column(Text)
    severity = Column(String)
    recall_date = Column(DateTime)
    instructions = Column(Text)
    status = Column(String)  # DRAFT, ACTIVE, PARTIALLY_COMPLETED, COMPLETED, CANCELLED / legacy: NOT_RECALLED, RECALLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Phase 6 extended fields
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(Text, nullable=True)
    affected_supplies_count = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    batch = relationship("Batch", back_populates="recalls")
    product = relationship("Product", foreign_keys=[product_id])
    issuer = relationship("User", foreign_keys=[issued_by])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    previous_value = Column(Text)
    new_value = Column(Text)
    rule_code = Column(String)
    decision = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")

# ============================================================
# PHASE 6 — NEW MODELS
# ============================================================

class TraceabilityEvent(Base):
    __tablename__ = "traceability_events"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # BATCH, SUPPLY, SAMPLE, TRANSPORT
    entity_id = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False)
    # MANUFACTURED, DISPATCHED, RECEIVED, SAMPLED, TESTED, COMPLIANCE_CHECKED,
    # ACCEPTED, QUARANTINED, REJECTED, STORED, MOVED, TRANSPORT_STARTED,
    # TRANSPORT_COMPLETED, RECALLED, CORRECTIVE_ACTION, DISPOSED
    location = Column(String, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    reference_id = Column(String, nullable=True)  # QR, batch_number, transport_id
    remarks = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string for extra data

    performer = relationship("User", foreign_keys=[performed_by])

class StorageMonitoringRecord(Base):
    __tablename__ = "storage_monitoring_records"
    id = Column(Integer, primary_key=True, index=True)
    storage_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=False)
    recorded_temperature = Column(Float, nullable=True)
    recorded_humidity = Column(Float, nullable=True)
    recorded_at = Column(DateTime, nullable=False)
    source = Column(String, default="MANUAL")  # MANUAL, SENSOR
    temperature_status = Column(String, default="NORMAL")  # NORMAL, WARNING, CRITICAL
    humidity_status = Column(String, default="NORMAL")
    overall_status = Column(String, default="NORMAL")
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    storage_location = relationship("StorageLocation")
    recorder = relationship("User", foreign_keys=[recorded_by])

class StorageExcursion(Base):
    __tablename__ = "storage_excursions"
    id = Column(Integer, primary_key=True, index=True)
    storage_location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    parameter = Column(String, nullable=False)  # TEMPERATURE, HUMIDITY
    expected_min = Column(Float, nullable=True)
    expected_max = Column(Float, nullable=True)
    observed_value = Column(Float, nullable=False)
    severity = Column(String, nullable=False)  # WARNING, CRITICAL
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="OPEN")  # OPEN, UNDER_REVIEW, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    storage_location = relationship("StorageLocation")
    batch = relationship("Batch")

class Transport(Base):
    __tablename__ = "transports"
    id = Column(Integer, primary_key=True, index=True)
    transport_id = Column(String, unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    source_location = Column(String, nullable=True)
    destination_location = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    carrier_name = Column(String, nullable=True)
    departure_time = Column(DateTime, nullable=True)
    expected_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    temperature_min_required = Column(Float, nullable=True)
    temperature_max_required = Column(Float, nullable=True)
    status = Column(String, default="PLANNED")  # PLANNED, IN_TRANSIT, ARRIVED, DELAYED, CANCELLED
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text, nullable=True)

    supplier = relationship("Supplier")
    batch = relationship("Batch")
    creator = relationship("User", foreign_keys=[created_by])
    monitoring_records = relationship("TransportMonitoringRecord", back_populates="transport")
    excursions = relationship("TransportExcursion", back_populates="transport")

class TransportMonitoringRecord(Base):
    __tablename__ = "transport_monitoring_records"
    id = Column(Integer, primary_key=True, index=True)
    transport_id = Column(Integer, ForeignKey("transports.id"), nullable=False)
    recorded_temperature = Column(Float, nullable=True)
    recorded_humidity = Column(Float, nullable=True)
    recorded_at = Column(DateTime, nullable=False)
    source = Column(String, default="MANUAL")  # MANUAL, SENSOR
    temperature_status = Column(String, default="NORMAL")
    humidity_status = Column(String, default="NORMAL")
    overall_status = Column(String, default="NORMAL")
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    location_at_time = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transport = relationship("Transport", back_populates="monitoring_records")
    recorder = relationship("User", foreign_keys=[recorded_by])

class TransportExcursion(Base):
    __tablename__ = "transport_excursions"
    id = Column(Integer, primary_key=True, index=True)
    transport_id = Column(Integer, ForeignKey("transports.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    parameter = Column(String, nullable=False)  # TEMPERATURE, HUMIDITY
    expected_min = Column(Float, nullable=True)
    expected_max = Column(Float, nullable=True)
    observed_value = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="OPEN")
    resolution_notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transport = relationship("Transport", back_populates="excursions")
    batch = relationship("Batch")

class BatchMovement(Base):
    __tablename__ = "batch_movements"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    from_location = Column(String, nullable=True)
    to_location = Column(String, nullable=False)
    movement_type = Column(String, nullable=False)
    # RECEIVED, TRANSFERRED, STORED, DISPATCHED, RETURNED, QUARANTINED, RECALLED, DISPOSED
    moved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    movement_date = Column(DateTime, nullable=False)
    remarks = Column(Text, nullable=True)
    reference_id = Column(String, nullable=True)  # transport_id, recall_number etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch")
    mover = relationship("User", foreign_keys=[moved_by])

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"
    id = Column(Integer, primary_key=True, index=True)
    action_number = Column(String, unique=True, index=True, nullable=False)
    reference_type = Column(String, nullable=False)  # STORAGE_EXCURSION, TRANSPORT_EXCURSION, RECALL, QUARANTINE
    reference_id = Column(Integer, nullable=False)
    action_type = Column(String, nullable=False)
    # INVESTIGATE, QUARANTINE, RETEST, RETURN_TO_SUPPLIER, RECALL, DISPOSE, REPLACE, RELEASE
    description = Column(Text, nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    supply_id = Column(Integer, ForeignKey("incoming_supplies.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="OPEN")  # OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch")
    supply = relationship("IncomingSupply")
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])


# ============================================================
# PHASE 8 — AI RISK INTELLIGENCE & ANOMALY DETECTION MODELS
# ============================================================

class AIRiskAssessment(Base):
    __tablename__ = "ai_risk_assessments"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False, index=True)  # BATCH, SUPPLIER, PRODUCT
    entity_id = Column(Integer, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)  # 0.0 - 100.0
    risk_level = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    factors = Column(Text, nullable=True)  # JSON-encoded factor contributions
    explanation = Column(Text, nullable=True)  # Natural language explainable justification
    confidence_score = Column(Float, default=100.0)  # Statistical confidence %
    confidence_reason = Column(String, nullable=True)  # E.g. "HIGH", "Insufficient historical data"
    recommendations = Column(Text, nullable=True)  # JSON-encoded advisory recommendations
    algorithm_version = Column(String, default="risk-engine-v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AIAnomaly(Base):
    __tablename__ = "ai_anomalies"
    id = Column(Integer, primary_key=True, index=True)
    anomaly_type = Column(String, nullable=False, index=True)
    # QUALITY_ANOMALY, SUPPLIER_ANOMALY, STORAGE_ANOMALY, TRANSPORT_ANOMALY, COMPLIANCE_ANOMALY, RECALL_ANOMALY
    entity_type = Column(String, nullable=False)  # BATCH, SUPPLIER, STORAGE_LOCATION, TRANSPORT, PRODUCT
    entity_id = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    status = Column(String, default="NEW")  # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)


