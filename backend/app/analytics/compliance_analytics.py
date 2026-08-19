from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.models import ComplianceRule, ComplianceEvaluation, ComplianceDecisionHistory, Certificate

class ComplianceAnalytics:
    @staticmethod
    def get_compliance_overview(db: Session, days: int = 30) -> Dict[str, Any]:
        """Aggregates compliance pass/fail/warning rates and rule failure rankings."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        eval_q = db.query(ComplianceEvaluation).filter(ComplianceEvaluation.evaluated_at >= start_date)
        total_evals = eval_q.count()
        passed_evals = eval_q.filter(ComplianceEvaluation.evaluation_result == "PASS").count()
        failed_evals = eval_q.filter(ComplianceEvaluation.evaluation_result == "FAIL").count()
        warning_evals = eval_q.filter(ComplianceEvaluation.evaluation_result == "WARNING").count()
        review_evals = eval_q.filter(ComplianceEvaluation.evaluation_result == "REVIEW").count()

        compliance_rate = round((passed_evals / total_evals * 100), 1) if total_evals > 0 else 100.0

        # Top Failed Rules
        rules = db.query(ComplianceRule).all()
        top_failed_rules = []
        for r in rules:
            f_count = db.query(ComplianceEvaluation).filter(
                ComplianceEvaluation.rule_id == r.id,
                ComplianceEvaluation.evaluation_result == "FAIL",
                ComplianceEvaluation.evaluated_at >= start_date
            ).count()
            if f_count > 0:
                top_failed_rules.append({
                    "rule_code": r.rule_code,
                    "rule_name": r.rule_name,
                    "rule_type": r.rule_type,
                    "severity": r.severity,
                    "failure_count": f_count
                })

        top_failed_rules.sort(key=lambda x: x["failure_count"], reverse=True)

        # Certificate status breakdown
        total_certs = db.query(Certificate).count()
        valid_certs = db.query(Certificate).filter(Certificate.verification_status == "VALID").count()
        expired_certs = db.query(Certificate).filter(Certificate.verification_status == "EXPIRED").count()
        expiring_certs = db.query(Certificate).filter(Certificate.verification_status == "EXPIRING").count()

        return {
            "summary": {
                "total_evaluations": total_evals,
                "passed": passed_evals,
                "failed": failed_evals,
                "warnings": warning_evals,
                "reviews": review_evals,
                "compliance_rate": compliance_rate
            },
            "certificates": {
                "total": total_certs,
                "valid": valid_certs,
                "expired": expired_certs,
                "expiring_soon": expiring_certs
            },
            "top_failed_rules": top_failed_rules[:5]
        }
