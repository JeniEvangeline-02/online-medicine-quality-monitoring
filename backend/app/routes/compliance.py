from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.models import ComplianceRule, ComplianceEvaluation, ComplianceDecisionHistory, IncomingSupply, User
from app.schemas.compliance import (
    ComplianceRuleCreate, ComplianceRuleUpdate, ComplianceRuleOut,
    ComplianceEvaluationOut, ComplianceDecisionHistoryOut, ComplianceProfileOut,
    ManualOverrideRequest
)
from app.core.dependencies import get_current_user, require_roles
from app.compliance.engine import ComplianceEngine

router = APIRouter(prefix="/compliance", tags=["Compliance Engine & Regulatory Decisions"])
compliance_engine = ComplianceEngine()

# -------------------------------------------------------------
# COMPLIANCE RULES CRUD
# -------------------------------------------------------------

@router.get("/rules", response_model=dict)
def get_compliance_rules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    rule_type: Optional[str] = None,
    severity: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ComplianceRule)
    if search:
        query = query.filter(
            (ComplianceRule.rule_code.ilike(f"%{search}%")) |
            (ComplianceRule.rule_name.ilike(f"%{search}%")) |
            (ComplianceRule.description.ilike(f"%{search}%"))
        )
    if rule_type:
        query = query.filter(ComplianceRule.rule_type == rule_type)
    if severity:
        query = query.filter(ComplianceRule.severity == severity)
    if is_active is not None:
        query = query.filter(ComplianceRule.is_active == is_active)

    total = query.count()
    items = query.order_by(ComplianceRule.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [ComplianceRuleOut.model_validate(it) for it in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size or 1
    }

@router.post("/rules", response_model=ComplianceRuleOut, status_code=status.HTTP_201_CREATED)
def create_compliance_rule(
    rule_in: ComplianceRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    existing = db.query(ComplianceRule).filter(ComplianceRule.rule_code == rule_in.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule with code '{rule_in.rule_code}' already exists.")
    
    rule = ComplianceRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/rules/{rule_id}", response_model=ComplianceRuleOut)
def get_compliance_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Compliance rule not found.")
    return rule

@router.put("/rules/{rule_id}", response_model=ComplianceRuleOut)
def update_compliance_rule(
    rule_id: int,
    rule_in: ComplianceRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Compliance rule not found.")
    
    for field, val in rule_in.model_dump(exclude_unset=True).items():
        setattr(rule, field, val)
        
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}", response_model=ComplianceRuleOut)
def delete_or_deactivate_compliance_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Compliance rule not found.")
    
    # Soft deactivate to preserve historical audit evaluations
    rule.is_active = False
    db.commit()
    db.refresh(rule)
    return rule

# -------------------------------------------------------------
# EVALUATIONS & AUTOMATED DECISIONS
# -------------------------------------------------------------

@router.post("/evaluate/{incoming_supply_id}", response_model=dict)
def evaluate_incoming_supply(
    incoming_supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "QUALITY_INSPECTOR"]))
):
    """
    Executes automated compliance evaluation & generates regulatory decision.
    Frontend CANNOT inject or dictate the decision.
    """
    result = compliance_engine.run_evaluations(db, incoming_supply_id, current_user.id)
    return result

@router.get("/evaluations/{incoming_supply_id}", response_model=List[ComplianceEvaluationOut])
def get_supply_evaluations(
    incoming_supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evals = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.incoming_supply_id == incoming_supply_id
    ).all()
    return evals

@router.get("/decision/{incoming_supply_id}", response_model=dict)
def get_supply_compliance_decision(
    incoming_supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(IncomingSupply).filter(IncomingSupply.id == incoming_supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Incoming supply not found.")
    
    batch = supply.batch
    product = batch.product if batch else None
    supplier = batch.supplier if batch else None

    evals = db.query(ComplianceEvaluation).filter(
        ComplianceEvaluation.incoming_supply_id == incoming_supply_id
    ).all()

    history = db.query(ComplianceDecisionHistory).filter(
        ComplianceDecisionHistory.incoming_supply_id == incoming_supply_id
    ).order_by(ComplianceDecisionHistory.decided_at.desc()).all()

    return {
        "incoming_supply_id": supply.id,
        "receiving_id": supply.receiving_id,
        "product_name": product.name if product else "Unknown",
        "product_code": product.product_code if product else "Unknown",
        "batch_number": batch.batch_number if batch else "Unknown",
        "supplier_name": supplier.name if supplier else "Unknown",
        "quality_result": supply.quality_status or "PENDING",
        "certificate_status": "VALID" if any(c.verification_status == "VALID" for c in (batch.certificates if batch else [])) else "PENDING",
        "expiry_status": str(batch.expiry_status or "UNKNOWN") if batch else "UNKNOWN",
        "registration_status": "VALID" if product and product.registration_number else "INVALID",
        "supplier_status": supplier.status if supplier else "UNKNOWN",
        "recall_status": str(batch.recall_status or "NOT_RECALLED") if batch else "NOT_RECALLED",
        "compliance_score": supply.compliance_score if supply.compliance_score is not None else 100.0,
        "final_decision": supply.final_decision or "PENDING",
        "decision_reason": supply.decision_reason or "Pending compliance evaluation",
        "decision_source": supply.decision_source or "NONE",
        "decision_severity": supply.decision_severity or "LOW",
        "decision_date": supply.decision_date,
        "evaluations": [ComplianceEvaluationOut.model_validate(e) for e in evals],
        "decision_history": [ComplianceDecisionHistoryOut.model_validate(h) for h in history]
    }

@router.get("/history/{incoming_supply_id}", response_model=List[ComplianceDecisionHistoryOut])
def get_supply_decision_history(
    incoming_supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ComplianceDecisionHistory).filter(
        ComplianceDecisionHistory.incoming_supply_id == incoming_supply_id
    ).order_by(ComplianceDecisionHistory.decided_at.desc()).all()
    return history

@router.post("/override/{incoming_supply_id}", response_model=dict)
def manual_decision_override(
    incoming_supply_id: int,
    override_in: ManualOverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    """
    Controlled manual override by Administrator only, requiring explicit justification.
    """
    result = compliance_engine.manual_override(
        db=db,
        incoming_supply_id=incoming_supply_id,
        new_decision=override_in.new_decision,
        reason=override_in.reason,
        user_id=current_user.id
    )
    return result
