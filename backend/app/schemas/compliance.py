from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class ComplianceRuleBase(BaseModel):
    rule_code: str
    rule_name: str
    description: Optional[str] = None
    rule_type: str # PRODUCT_REGISTRATION, BATCH_VALIDATION, EXPIRY_VALIDATION, CERTIFICATE_VALIDATION, QUALITY_VALIDATION, SUPPLIER_VALIDATION, RECALL_VALIDATION, STORAGE_VALIDATION, TRANSPORT_VALIDATION
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    is_active: bool = True

class ComplianceRuleCreate(ComplianceRuleBase):
    pass

class ComplianceRuleUpdate(BaseModel):
    rule_code: Optional[str] = None
    rule_name: Optional[str] = None
    description: Optional[str] = None
    rule_type: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None

class ComplianceRuleOut(ComplianceRuleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ComplianceEvaluationOut(BaseModel):
    id: int
    incoming_supply_id: int
    rule_id: int
    input_value: Optional[str] = None
    expected_value: Optional[str] = None
    evaluation_result: str # PASS, FAIL, WARNING, REVIEW
    reason: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    rule_version: Optional[str] = None
    rule: Optional[ComplianceRuleOut] = None

    model_config = ConfigDict(from_attributes=True)

class UserShortOut(BaseModel):
    id: int
    full_name: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class ComplianceDecisionHistoryOut(BaseModel):
    id: int
    incoming_supply_id: int
    decision: str
    reason: Optional[str] = None
    severity: Optional[str] = None
    triggered_rule: Optional[str] = None
    compliance_score: Optional[float] = 100.0
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None
    is_automated: bool = True
    user: Optional[UserShortOut] = None

    model_config = ConfigDict(from_attributes=True)

class ComplianceProfileOut(BaseModel):
    incoming_supply_id: int
    receiving_id: str
    product_name: str
    product_code: str
    batch_number: str
    supplier_name: str
    quality_result: str
    certificate_status: str
    expiry_status: str
    registration_status: str
    supplier_status: str
    recall_status: str
    compliance_score: float
    final_decision: str
    decision_reason: Optional[str] = None
    decision_source: Optional[str] = None
    decision_severity: Optional[str] = None
    decision_date: Optional[datetime] = None
    evaluations: List[ComplianceEvaluationOut] = []
    decision_history: List[ComplianceDecisionHistoryOut] = []

    model_config = ConfigDict(from_attributes=True)

class ManualOverrideRequest(BaseModel):
    new_decision: str # ACCEPTED, QUARANTINED, REJECTED
    reason: str
