from typing import List, Dict, Any

class DecisionMaker:
    def __init__(self):
        pass

    def evaluate_final_decision(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Determines final regulatory decision (ACCEPTED, QUARANTINED, REJECTED),
        calculates compliance score, and builds human-readable decision reasons.
        """
        if not evaluations:
            return {
                "decision": "QUARANTINED",
                "reason": "No compliance evaluations available for determination.",
                "severity": "HIGH",
                "compliance_score": 0.0,
                "triggered_rule": "NO_EVALUATIONS"
            }

        # Segregate evaluations by result & severity
        critical_fails = []
        high_fails = []
        other_fails = []
        reviews = []
        warnings = []
        passes = []

        score = 100.0

        for ev in evaluations:
            res = ev["evaluation_result"]
            sev = (ev.get("severity") or "MEDIUM").upper()
            rule_code = ev.get("rule_code", "")
            reason = ev.get("reason", "")

            if res == "FAIL":
                if sev == "CRITICAL":
                    critical_fails.append(ev)
                    score -= 50.0
                elif sev == "HIGH":
                    high_fails.append(ev)
                    score -= 30.0
                else:
                    other_fails.append(ev)
                    score -= 20.0
            elif res == "REVIEW":
                reviews.append(ev)
                score -= 15.0
            elif res == "WARNING":
                warnings.append(ev)
                score -= 8.0
            elif res == "PASS":
                passes.append(ev)

        score = max(0.0, min(100.0, score))

        # DECISION DETERMINATION BY PRIORITY: REJECTED > QUARANTINED > ACCEPTED

        # 1. REJECTED CONDITIONS
        if critical_fails:
            top_crit = critical_fails[0]
            reasons_summary = "; ".join([cf["reason"] for cf in critical_fails])
            return {
                "decision": "REJECTED",
                "reason": f"Critical compliance failure: {top_crit['reason']}",
                "severity": "CRITICAL",
                "compliance_score": score,
                "triggered_rule": top_crit["rule_code"]
            }

        if high_fails:
            top_high = high_fails[0]
            return {
                "decision": "REJECTED",
                "reason": f"High-risk compliance failure: {top_high['reason']}",
                "severity": "HIGH",
                "compliance_score": score,
                "triggered_rule": top_high["rule_code"]
            }

        if other_fails:
            top_fail = other_fails[0]
            return {
                "decision": "QUARANTINED",
                "reason": f"Compliance failure requires quarantine investigation: {top_fail['reason']}",
                "severity": "MEDIUM",
                "compliance_score": score,
                "triggered_rule": top_fail["rule_code"]
            }

        # 2. QUARANTINED CONDITIONS
        if reviews:
            top_review = reviews[0]
            return {
                "decision": "QUARANTINED",
                "reason": f"Investigation required: {top_review['reason']}",
                "severity": top_review.get("severity", "MEDIUM"),
                "compliance_score": score,
                "triggered_rule": top_review["rule_code"]
            }

        if warnings:
            top_warning = warnings[0]
            return {
                "decision": "QUARANTINED",
                "reason": f"Quarantined under warning condition: {top_warning['reason']}",
                "severity": top_warning.get("severity", "LOW"),
                "compliance_score": score,
                "triggered_rule": top_warning["rule_code"]
            }

        # 3. ACCEPTED CONDITION: All mandatory rules PASS
        return {
            "decision": "ACCEPTED",
            "reason": "All mandatory regulatory quality, batch, supplier, and pharmacopoeial compliance requirements passed.",
            "severity": "LOW",
            "compliance_score": 100.0,
            "triggered_rule": "ALL_RULES_PASSED"
        }
