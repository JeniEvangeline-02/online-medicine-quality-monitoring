from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class QualityStandardBrief(BaseModel):
    id: int
    parameter_name: str
    parameter_type: str
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None
    expected_value: Optional[str] = None
    testing_method: Optional[str] = None
    is_critical: bool
    standard_reference: Optional[str] = None
    class Config:
        from_attributes = True

class QualityTestResultBase(BaseModel):
    quality_standard_id: int
    observed_value: Optional[str] = None
    remarks: Optional[str] = None

class QualityTestResultCreate(QualityTestResultBase):
    pass

class QualityTestResultOut(QualityTestResultBase):
    id: int
    quality_test_id: int
    result: str  # PASS, FAIL, WARNING, REVIEW, PENDING
    is_critical_failure: bool
    created_at: Optional[datetime] = None
    quality_standard: Optional[QualityStandardBrief] = None

    class Config:
        from_attributes = True

class QualityTestBase(BaseModel):
    sample_id: int
    batch_id: int
    remarks: Optional[str] = None

class QualityTestCreate(QualityTestBase):
    pass

class QualityTestUpdate(BaseModel):
    remarks: Optional[str] = None
    laboratory_report: Optional[str] = None

class ResultInput(BaseModel):
    quality_standard_id: int
    observed_value: str
    remarks: Optional[str] = None

class CompleteTestRequest(BaseModel):
    results: list[ResultInput]
    remarks: Optional[str] = None
    laboratory_report: Optional[str] = None

class UserRef(BaseModel):
    id: int
    full_name: str
    class Config:
        from_attributes = True

class BatchRef(BaseModel):
    id: int
    batch_number: str
    product_id: int
    class Config:
        from_attributes = True

class SampleRef(BaseModel):
    id: int
    sample_code: str
    class Config:
        from_attributes = True

class QualityTestOut(BaseModel):
    id: int
    sample_id: int
    batch_id: int
    inspector_id: Optional[int] = None
    test_date: Optional[datetime] = None
    overall_result: str
    status: str
    is_completed: bool
    laboratory_report: Optional[str] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    batch: Optional[BatchRef] = None
    quality_sample: Optional[SampleRef] = None
    inspector: Optional[UserRef] = None
    test_results: list[QualityTestResultOut] = []

    class Config:
        from_attributes = True

class PaginatedQualityTests(BaseModel):
    items: list[QualityTestOut]
    total: int
    page: int
    page_size: int
    total_pages: int
