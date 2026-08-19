from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from datetime import datetime
from app.models import QualityTest, QualityTestResult, QualitySample, QualityStandard, Batch, IncomingSupply, QualityStatus, Product
from app.schemas.quality_test import CompleteTestRequest, ResultInput
from app.services.utils import paginate
from app.services.audit import create_audit_log

def evaluate_parameter(standard: QualityStandard, observed_value: str) -> str:
    if not observed_value or observed_value.strip() == "":
        return "PENDING"
    
    ptype = (standard.parameter_type or "NUMERIC").upper()
    
    if ptype == "NUMERIC":
        try:
            val = float(observed_value)
        except ValueError:
            return "FAIL"
        
        min_v = standard.minimum_value
        max_v = standard.maximum_value
        
        if min_v is not None and max_v is not None:
            return "PASS" if min_v <= val <= max_v else "FAIL"
        elif min_v is not None:
            return "PASS" if val >= min_v else "FAIL"
        elif max_v is not None:
            return "PASS" if val <= max_v else "FAIL"
        return "PASS"
        
    elif ptype == "QUALITATIVE":
        obs_clean = observed_value.strip().lower()
        exp_clean = (standard.expected_value or "").strip().lower()
        return "PASS" if obs_clean == exp_clean else "FAIL"
        
    elif ptype == "BOOLEAN":
        obs_clean = observed_value.strip().upper()
        exp_clean = (standard.expected_value or "").strip().upper()
        
        def to_bool_str(s):
            if s in ("TRUE", "1", "YES", "PASS", "INTACT", "CONFIRMED", "Y"):
                return "TRUE"
            if s in ("FALSE", "0", "NO", "FAIL", "NOT INTACT", "NOT CONFIRMED", "N"):
                return "FALSE"
            return s
            
        return "PASS" if to_bool_str(obs_clean) == to_bool_str(exp_clean) else "FAIL"
        
    return "REVIEW"

def get_quality_tests(db: Session, page: int, page_size: int,
                      search: str = None, sample_code: str = None,
                      batch_number: str = None, product_id: int = None,
                      inspector_id: int = None, overall_result: str = None,
                      start_date: datetime = None, end_date: datetime = None):
    q = (db.query(QualityTest)
         .options(
             joinedload(QualityTest.batch).joinedload(Batch.product),
             joinedload(QualityTest.quality_sample),
             joinedload(QualityTest.inspector),
             joinedload(QualityTest.test_results).joinedload(QualityTestResult.quality_standard)
         ))
    
    if search:
        # Check by sample code or batch number or product name
        q = q.join(QualityTest.quality_sample).join(QualityTest.batch).join(Batch.product).filter(
            (QualitySample.sample_code.ilike(f"%{search}%")) |
            (Batch.batch_number.ilike(f"%{search}%")) |
            (Product.name.ilike(f"%{search}%"))
        )
    if sample_code:
        q = q.join(QualityTest.quality_sample).filter(QualitySample.sample_code == sample_code)
    if batch_number:
        q = q.join(QualityTest.batch).filter(Batch.batch_number == batch_number)
    if product_id is not None:
        q = q.join(QualityTest.batch).filter(Batch.product_id == product_id)
    if inspector_id is not None:
        q = q.filter(QualityTest.inspector_id == inspector_id)
    if overall_result:
        q = q.filter(QualityTest.overall_result == overall_result)
    if start_date:
        q = q.filter(QualityTest.test_date >= start_date)
    if end_date:
        q = q.filter(QualityTest.test_date <= end_date)

    q = q.order_by(QualityTest.created_at.desc())
    items, total, total_pages = paginate(q, page, page_size)
    return items, total, total_pages

def get_quality_test(db: Session, test_id: int):
    test = (db.query(QualityTest)
            .options(
                joinedload(QualityTest.batch).joinedload(Batch.product),
                joinedload(QualityTest.quality_sample),
                joinedload(QualityTest.inspector),
                joinedload(QualityTest.test_results).joinedload(QualityTestResult.quality_standard)
            )
            .filter(QualityTest.id == test_id).first())
    if not test:
        raise HTTPException(status_code=404, detail="Quality test not found.")
    return test

def create_quality_test(db: Session, sample_id: int, inspector_id: int):
    # Verify sample exists
    sample = db.query(QualitySample).filter(QualitySample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found.")
    
    # Check if there is an existing incomplete test for this sample
    existing_incomplete = db.query(QualityTest).filter(
        QualityTest.sample_id == sample.id,
        QualityTest.is_completed == False
    ).first()
    if existing_incomplete:
        return get_quality_test(db, existing_incomplete.id)

    # Get the product standards
    batch = db.query(Batch).filter(Batch.id == sample.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found for sample.")
    
    # Retrieve active quality standards
    standards = db.query(QualityStandard).filter(
        QualityStandard.product_id == batch.product_id,
        QualityStandard.is_active == True
    ).all()
    
    # If no quality standards configured, we still allow creating the test,
    # but we will raise/warn when completing or retrieving. Let's make standard check during evaluation.
    
    # Create the test
    test = QualityTest(
        sample_id=sample.id,
        batch_id=batch.id,
        inspector_id=inspector_id,
        test_date=datetime.now(),
        overall_result="PENDING",
        status="IN_PROGRESS",
        is_completed=False
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    
    # Pre-populate test results with PENDING state for each standard
    for std in standards:
        res = QualityTestResult(
            quality_test_id=test.id,
            quality_standard_id=std.id,
            observed_value=None,
            result="PENDING",
            is_critical_failure=False
        )
        db.add(res)
    
    # Update sample status to UNDER_TEST
    sample.status = "UNDER_TEST"
    
    # Update incoming supply quality status to TESTING
    supply = db.query(IncomingSupply).filter(IncomingSupply.id == sample.incoming_supply_id).first()
    if supply:
        supply.quality_status = "TESTING"
        
    db.commit()
    
    create_audit_log(
        db,
        action="QUALITY_TEST_CREATED",
        entity_type="QualityTest",
        entity_id=test.id,
        user_id=inspector_id,
        new_value=f"Sample Code: {sample.sample_code}"
    )
    return get_quality_test(db, test.id)

def save_test_draft(db: Session, test_id: int, data: CompleteTestRequest, inspector_id: int):
    test = get_quality_test(db, test_id)
    if test.is_completed:
        raise HTTPException(status_code=400, detail="Completed test cannot be modified.")
    
    # Save values as draft, evaluate individually but overall remains PENDING/REVIEW
    for r in data.results:
        # Find result record
        res_rec = db.query(QualityTestResult).filter(
            QualityTestResult.quality_test_id == test.id,
            QualityTestResult.quality_standard_id == r.quality_standard_id
        ).first()
        
        if not res_rec:
            # Maybe a new standard was added since test was created? Let's add it
            std = db.query(QualityStandard).filter(QualityStandard.id == r.quality_standard_id).first()
            if std:
                res_rec = QualityTestResult(
                    quality_test_id=test.id,
                    quality_standard_id=r.quality_standard_id
                )
                db.add(res_rec)
        
        if res_rec:
            res_rec.observed_value = r.observed_value
            res_rec.remarks = r.remarks
            
            # Evaluate result
            std = db.query(QualityStandard).filter(QualityStandard.id == r.quality_standard_id).first()
            if std:
                param_res = evaluate_parameter(std, r.observed_value)
                res_rec.result = param_res
                res_rec.is_critical_failure = (param_res == "FAIL" and std.is_critical)
    
    if data.remarks is not None:
        test.remarks = data.remarks
    if data.laboratory_report is not None:
        test.laboratory_report = data.laboratory_report
        
    db.commit()
    db.refresh(test)
    return get_quality_test(db, test.id)

def complete_quality_test(db: Session, test_id: int, data: CompleteTestRequest, inspector_id: int):
    test = get_quality_test(db, test_id)
    if test.is_completed:
        raise HTTPException(status_code=400, detail="Test is already completed and is read-only.")
    
    # Save the latest entries first
    save_test_draft(db, test_id, data, inspector_id)
    db.refresh(test)
    
    # Verify standards exist
    standards = db.query(QualityStandard).filter(
        QualityStandard.product_id == test.batch.product_id,
        QualityStandard.is_active == True
    ).all()
    
    if not standards:
        raise HTTPException(status_code=422, detail="Quality standards are not configured for this product.")
    
    # Verify all required parameters are entered
    results = db.query(QualityTestResult).filter(QualityTestResult.quality_test_id == test.id).all()
    result_map = {r.quality_standard_id: r for r in results}
    
    for std in standards:
        res = result_map.get(std.id)
        if not res or res.observed_value is None or res.observed_value.strip() == "":
            raise HTTPException(
                status_code=422,
                detail=f"Missing observed value for required parameter: {std.parameter_name}"
            )
            
    # Calculate overall quality result
    overall = "PASS"
    has_critical_failure = False
    has_any_failure = False
    has_review = False
    
    for res in results:
        std = db.query(QualityStandard).filter(QualityStandard.id == res.quality_standard_id).first()
        if not std or not std.is_active:
            continue
        
        # Final evaluation
        param_res = evaluate_parameter(std, res.observed_value)
        res.result = param_res
        
        if param_res == "FAIL":
            has_any_failure = True
            if std.is_critical:
                has_critical_failure = True
                res.is_critical_failure = True
        elif param_res == "REVIEW":
            has_review = True
            
        # Log result recorded
        create_audit_log(
            db,
            action="QUALITY_RESULT_RECORDED",
            entity_type="QualityTestResult",
            entity_id=res.id,
            user_id=inspector_id,
            new_value=f"Param: {std.parameter_name}, Value: {res.observed_value}, Result: {param_res}"
        )
            
    # Apply overall decision rules
    if has_critical_failure:
        overall = "FAIL"
    elif has_any_failure:
        overall = "FAIL"
    elif has_review:
        overall = "REVIEW"
    else:
        overall = "PASS"
        
    # Check if inspector flagged it for review manually via remarks or overall flags
    # For Phase 4, if they passed review remarks or we want to allow manually forcing REVIEW status:
    # Let's say if overall is PASS/FAIL but they want REVIEW, we can check if they ask for review
    if test.remarks and "INVESTIGATE" in test.remarks.upper():
        overall = "REVIEW"
        
    # Lock test
    test.overall_result = overall
    test.status = "COMPLETED"
    test.is_completed = True
    test.test_date = datetime.now()
    test.inspector_id = inspector_id
    
    # Update sample status
    sample = db.query(QualitySample).filter(QualitySample.id == test.sample_id).first()
    if sample:
        sample.status = "TEST_COMPLETED"
        
    # Update incoming supply quality status (PASSED, FAILED, REVIEW)
    # Mapping overall result to supply quality status:
    supply_status_map = {
        "PASS": "PASSED",
        "FAIL": "FAILED",
        "REVIEW": "REVIEW"
    }
    supply = db.query(IncomingSupply).filter(IncomingSupply.id == sample.incoming_supply_id).first()
    if supply:
        supply.quality_status = supply_status_map.get(overall, "REVIEW")
        # Do NOT update final_decision!
        
    # Update Batch quality status
    # Also update batch quality status to match if needed, but the requirements focus on incoming supply quality_status
    # and batch profile extension. Let's make sure batch quality status is also updated in database to be consistent.
    # Batch has quality_status Enum column.
    if test.batch:
        batch_status_map = {
            "PASS": "PASSED",
            "FAIL": "FAILED",
            "REVIEW": "UNDER_REVIEW"
        }
        test.batch.quality_status = batch_status_map.get(overall, "UNDER_REVIEW")
        
    db.commit()
    
    create_audit_log(
        db,
        action="QUALITY_TEST_COMPLETED",
        entity_type="QualityTest",
        entity_id=test.id,
        user_id=inspector_id,
        new_value=f"Overall Result: {overall}"
    )
    return get_quality_test(db, test.id)
