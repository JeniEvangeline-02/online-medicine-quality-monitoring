from datetime import datetime
from app.models import ComplianceRule, IncomingSupply, Batch, Product, Supplier, Manufacturer, QualityTest, Certificate, Recall
from app.compliance.rules import (
    RULE_PRODUCT_REGISTRATION, RULE_BATCH_VALIDATION, RULE_EXPIRY_VALIDATION,
    RULE_CERTIFICATE_VALIDATION, RULE_QUALITY_VALIDATION, RULE_SUPPLIER_VALIDATION,
    RULE_RECALL_VALIDATION, RULE_STORAGE_VALIDATION, RULE_TRANSPORT_VALIDATION
)

class ComplianceEvaluator:
    def __init__(self):
        pass

    def evaluate_rule(self, rule: ComplianceRule, supply_context: dict) -> dict:
        """
        Evaluates a single compliance rule against the loaded supply context.
        Returns evaluation result dictionary.
        """
        rtype = rule.rule_type

        if rtype == RULE_PRODUCT_REGISTRATION:
            return self._eval_product_registration(rule, supply_context)
        elif rtype == RULE_BATCH_VALIDATION:
            return self._eval_batch_validation(rule, supply_context)
        elif rtype == RULE_EXPIRY_VALIDATION:
            return self._eval_expiry_validation(rule, supply_context)
        elif rtype == RULE_CERTIFICATE_VALIDATION:
            return self._eval_certificate_validation(rule, supply_context)
        elif rtype == RULE_QUALITY_VALIDATION:
            return self._eval_quality_validation(rule, supply_context)
        elif rtype == RULE_SUPPLIER_VALIDATION:
            return self._eval_supplier_validation(rule, supply_context)
        elif rtype == RULE_RECALL_VALIDATION:
            return self._eval_recall_validation(rule, supply_context)
        elif rtype == RULE_STORAGE_VALIDATION:
            return self._eval_storage_validation(rule, supply_context)
        elif rtype == RULE_TRANSPORT_VALIDATION:
            return self._eval_transport_validation(rule, supply_context)
        else:
            # Generic fallback for custom rules
            return {
                "rule_id": rule.id,
                "rule_code": rule.rule_code,
                "rule_name": rule.rule_name,
                "rule_type": rule.rule_type,
                "severity": rule.severity,
                "input_value": "UNSPECIFIED",
                "expected_value": "ACTIVE",
                "evaluation_result": "PASS" if rule.is_active else "REVIEW",
                "reason": f"Rule {rule.rule_code} evaluated.",
                "rule_version": "1.0"
            }

    def _eval_product_registration(self, rule: ComplianceRule, ctx: dict) -> dict:
        product: Product = ctx.get("product")
        if not product:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "MISSING_PRODUCT", "expected_value": "VALID_REGISTRATION",
                "evaluation_result": "FAIL",
                "reason": "Associated product catalog record was not found.",
                "rule_version": "1.0"
            }
        
        reg_num = (product.registration_number or "").strip()
        status = product.status or "ACTIVE"

        if status != "ACTIVE":
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"Status: {status}", "expected_value": "ACTIVE",
                "evaluation_result": "FAIL",
                "reason": f"Product '{product.name}' is currently {status}, must be ACTIVE.",
                "rule_version": "1.0"
            }

        if not reg_num or reg_num.lower() in ["none", "null", "pending", ""]:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "NO_REGISTRATION", "expected_value": "VALID_REGISTRATION_NUMBER",
                "evaluation_result": "FAIL",
                "reason": f"Product '{product.name}' is missing an approved regulatory drug registration number.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"Reg: {reg_num} (ACTIVE)", "expected_value": "ACTIVE_REGISTRATION",
            "evaluation_result": "PASS",
            "reason": f"Product '{product.name}' has valid regulatory registration #{reg_num}.",
            "rule_version": "1.0"
        }

    def _eval_batch_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        batch: Batch = ctx.get("batch")
        product: Product = ctx.get("product")
        supplier: Supplier = ctx.get("supplier")
        supply: IncomingSupply = ctx.get("supply")

        if not batch:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "MISSING_BATCH", "expected_value": "VALID_BATCH",
                "evaluation_result": "FAIL", "reason": "No batch record linked to incoming supply.",
                "rule_version": "1.0"
            }

        if not batch.batch_number or len(batch.batch_number.strip()) == 0:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "EMPTY_BATCH_NUMBER", "expected_value": "VALID_BATCH_NUMBER",
                "evaluation_result": "FAIL", "reason": "Batch number is empty or malformed.",
                "rule_version": "1.0"
            }

        if product and batch.product_id != product.id:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"Batch Product #{batch.product_id}", "expected_value": f"Product #{product.id}",
                "evaluation_result": "FAIL", "reason": "Batch product linkage does not match incoming supply product.",
                "rule_version": "1.0"
            }

        if supply and (supply.quantity_received is None or supply.quantity_received <= 0):
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"Quantity: {supply.quantity_received}", "expected_value": "Quantity > 0",
                "evaluation_result": "FAIL", "reason": "Received delivery quantity must be greater than zero.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"Batch {batch.batch_number} (Qty: {supply.quantity_received if supply else batch.quantity})",
            "expected_value": "CONSISTENT_BATCH_METADATA",
            "evaluation_result": "PASS",
            "reason": f"Batch {batch.batch_number} metadata is verified and consistent.",
            "rule_version": "1.0"
        }

    def _eval_expiry_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        batch: Batch = ctx.get("batch")
        if not batch or not batch.expiry_date:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "NO_EXPIRY_DATE", "expected_value": "VALID_FUTURE_DATE",
                "evaluation_result": "FAIL", "reason": "Batch is missing required expiry date.",
                "rule_version": "1.0"
            }

        now = datetime.now()
        exp_dt = batch.expiry_date
        days_remaining = (exp_dt.date() - now.date()).days

        if days_remaining <= 0:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": f"EXPIRED ({exp_dt.strftime('%Y-%m-%d')})", "expected_value": "UNEXPIRED",
                "evaluation_result": "FAIL",
                "reason": f"Batch expired on {exp_dt.strftime('%Y-%m-%d')} ({abs(days_remaining)} days ago). Strictly ineligible for release.",
                "rule_version": "1.0"
            }
        elif days_remaining <= 30:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "HIGH",
                "input_value": f"URGENT ({days_remaining} days left)", "expected_value": "> 30 DAYS",
                "evaluation_result": "WARNING",
                "reason": f"Batch is in URGENT shelf-life window ({days_remaining} days until expiry on {exp_dt.strftime('%Y-%m-%d')}).",
                "rule_version": "1.0"
            }
        elif days_remaining <= 90:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "MEDIUM",
                "input_value": f"EXPIRING_SOON ({days_remaining} days left)", "expected_value": "> 90 DAYS",
                "evaluation_result": "WARNING",
                "reason": f"Batch shelf-life is EXPIRING SOON ({days_remaining} days remaining).",
                "rule_version": "1.0"
            }
        else:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"SAFE ({days_remaining} days left)", "expected_value": "SAFE_SHELF_LIFE",
                "evaluation_result": "PASS",
                "reason": f"Batch shelf-life is safe ({days_remaining} days until expiry on {exp_dt.strftime('%Y-%m-%d')}).",
                "rule_version": "1.0"
            }

    def _eval_certificate_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        certificates = ctx.get("certificates", [])
        if not certificates:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "HIGH",
                "input_value": "NO_CERTIFICATE", "expected_value": "VALID_CERTIFICATE_OR_COA",
                "evaluation_result": "REVIEW",
                "reason": "Required Certificate of Analysis (COA) / GMP certificate has not been uploaded.",
                "rule_version": "1.0"
            }

        # Check for invalid or expired certificates
        for cert in certificates:
            status = (cert.verification_status or "PENDING").upper()
            if status in ["EXPIRED", "INVALID"]:
                return {
                    "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                    "rule_type": rule.rule_type, "severity": "HIGH",
                    "input_value": f"Cert #{cert.certificate_number}: {status}", "expected_value": "VALID",
                    "evaluation_result": "FAIL",
                    "reason": f"Certificate #{cert.certificate_number} ({cert.certificate_type}) is {status}.",
                    "rule_version": "1.0"
                }

        # Check for pending verification
        pending = [c for c in certificates if (c.verification_status or "").upper() == "PENDING"]
        if pending:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "MEDIUM",
                "input_value": f"{len(pending)} Certificate(s) PENDING", "expected_value": "VALIDATED",
                "evaluation_result": "REVIEW",
                "reason": f"Certificate #{pending[0].certificate_number} ({pending[0].certificate_type}) is pending regulatory verification.",
                "rule_version": "1.0"
            }

        # Check for expiring certificates
        expiring = [c for c in certificates if (c.verification_status or "").upper() == "EXPIRING"]
        if expiring:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "LOW",
                "input_value": f"Cert #{expiring[0].certificate_number}: EXPIRING", "expected_value": "VALID",
                "evaluation_result": "WARNING",
                "reason": f"Certificate #{expiring[0].certificate_number} is approaching expiry.",
                "rule_version": "1.0"
            }

        # All valid
        valid_certs = [c.certificate_number for c in certificates if (c.verification_status or "").upper() == "VALID"]
        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"Verified ({', '.join(valid_certs)})", "expected_value": "VALID",
            "evaluation_result": "PASS",
            "reason": f"Regulatory certificate(s) verified: {', '.join(valid_certs)}.",
            "rule_version": "1.0"
        }

    def _eval_quality_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        quality_tests: list = ctx.get("quality_tests", [])
        
        # Check if there are any quality tests
        if not quality_tests:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": "NO_QUALITY_TEST", "expected_value": "COMPLETED_QUALITY_PASS",
                "evaluation_result": "REVIEW",
                "reason": "Quality testing has not yet been performed for this supply. Supply cannot be approved without laboratory release.",
                "rule_version": "1.0"
            }

        completed_tests = [t for t in quality_tests if t.is_completed]
        if not completed_tests:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": "TEST_IN_PROGRESS", "expected_value": "COMPLETED_QUALITY_PASS",
                "evaluation_result": "REVIEW",
                "reason": "Quality testing is currently in progress and awaiting official laboratory completion.",
                "rule_version": "1.0"
            }

        # Sort to get latest completed test
        latest_test = sorted(completed_tests, key=lambda t: t.test_date or t.created_at, reverse=True)[0]
        
        # Check for critical parameter failures
        critical_fails = []
        if latest_test.test_results:
            for r in latest_test.test_results:
                std = r.quality_standard
                if r.is_critical_failure or (std and std.is_critical and r.result == "FAIL"):
                    param_name = std.parameter_name if std else f"Standard #{r.quality_standard_id}"
                    critical_fails.append(param_name)

        if critical_fails:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": f"CRITICAL_FAIL ({', '.join(critical_fails)})", "expected_value": "ALL_CRITICAL_PASS",
                "evaluation_result": "FAIL",
                "reason": f"Batch failed critical laboratory quality parameter(s): {', '.join(critical_fails)}.",
                "rule_version": "1.0"
            }

        if latest_test.overall_result == "FAIL":
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": "OVERALL_FAIL", "expected_value": "OVERALL_PASS",
                "evaluation_result": "FAIL",
                "reason": "Laboratory quality testing resulted in an overall FAIL determination.",
                "rule_version": "1.0"
            }

        if latest_test.overall_result in ["REVIEW", "WARNING", "PENDING"]:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "HIGH",
                "input_value": f"OVERALL_{latest_test.overall_result}", "expected_value": "OVERALL_PASS",
                "evaluation_result": "REVIEW",
                "reason": f"Quality testing is in {latest_test.overall_result} state and requires analytical supervisor clearance.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"PASSED (Test #{latest_test.id})", "expected_value": "OVERALL_PASS",
            "evaluation_result": "PASS",
            "reason": f"All pharmacopoeial quality test parameters passed specifications (Test #{latest_test.id}).",
            "rule_version": "1.0"
        }

    def _eval_supplier_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        supplier: Supplier = ctx.get("supplier")
        if not supplier:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "HIGH",
                "input_value": "NO_SUPPLIER", "expected_value": "ACTIVE_SUPPLIER",
                "evaluation_result": "FAIL",
                "reason": "Distributor/supplier record is missing or unregistered.",
                "rule_version": "1.0"
            }

        status = (supplier.status or "ACTIVE").upper()
        if status in ["SUSPENDED", "INACTIVE", "BLOCKED"]:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "HIGH",
                "input_value": f"Supplier Status: {status}", "expected_value": "ACTIVE",
                "evaluation_result": "FAIL",
                "reason": f"Supplier '{supplier.name}' is currently {status}. Supplies cannot be accepted from non-compliant suppliers.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"{supplier.name} (ACTIVE)", "expected_value": "ACTIVE",
            "evaluation_result": "PASS",
            "reason": f"Supplier '{supplier.name}' is verified and in ACTIVE regulatory standing.",
            "rule_version": "1.0"
        }

    def _eval_recall_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        batch: Batch = ctx.get("batch")
        recalls = ctx.get("recalls", [])

        if not batch:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": "NO_BATCH", "expected_value": "NOT_RECALLED",
                "evaluation_result": "PASS", "reason": "No recall alerts found.",
                "rule_version": "1.0"
            }

        is_recalled = (str(batch.recall_status).upper() == "RECALLED") or any(r.status == "ACTIVE" for r in recalls)
        if is_recalled:
            active_recalls = [r.recall_number for r in recalls if r.status == "ACTIVE"]
            ref = f" (#{active_recalls[0]})" if active_recalls else ""
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": "CRITICAL",
                "input_value": "RECALLED", "expected_value": "NOT_RECALLED",
                "evaluation_result": "FAIL",
                "reason": f"Batch {batch.batch_number} is subject to an active safety recall{ref}. Immediate rejection required.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": "NOT_RECALLED", "expected_value": "NOT_RECALLED",
            "evaluation_result": "PASS",
            "reason": f"No active safety recalls or market alerts exist for batch {batch.batch_number}.",
            "rule_version": "1.0"
        }

    def _eval_storage_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        supply: IncomingSupply = ctx.get("supply")
        status = (supply.storage_status or "ADEQUATE").upper() if supply else "ADEQUATE"

        if status in ["DAMAGED", "EXCURSION", "SUSPECT", "NON_COMPLIANT"]:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"Storage: {status}", "expected_value": "ADEQUATE",
                "evaluation_result": "REVIEW",
                "reason": f"Storage conditions reported as {status}. Requires environmental log audit.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"Storage: {status}", "expected_value": "ADEQUATE",
            "evaluation_result": "PASS",
            "reason": "Storage compatibility within acceptable parameters.",
            "rule_version": "1.0"
        }

    def _eval_transport_validation(self, rule: ComplianceRule, ctx: dict) -> dict:
        supply: IncomingSupply = ctx.get("supply")
        status = (supply.transport_status or "GOOD").upper() if supply else "GOOD"

        if status in ["DAMAGED", "SUSPECT", "TAMPERED", "BREACHED"]:
            return {
                "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
                "rule_type": rule.rule_type, "severity": rule.severity,
                "input_value": f"Transport: {status}", "expected_value": "GOOD",
                "evaluation_result": "REVIEW",
                "reason": f"Transport physical delivery status reported as {status}. Inspection recommended.",
                "rule_version": "1.0"
            }

        return {
            "rule_id": rule.id, "rule_code": rule.rule_code, "rule_name": rule.rule_name,
            "rule_type": rule.rule_type, "severity": rule.severity,
            "input_value": f"Transport: {status}", "expected_value": "GOOD",
            "evaluation_result": "PASS",
            "reason": "Logistics and shipping packaging verified intact.",
            "rule_version": "1.0"
        }
