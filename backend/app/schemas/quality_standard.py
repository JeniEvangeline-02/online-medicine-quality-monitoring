from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime

class ProductRef(BaseModel):
    id: int
    name: str
    product_code: str
    product_type: str
    class Config:
        from_attributes = True

class QualityStandardBase(BaseModel):
    product_id: int
    parameter_name: str
    parameter_type: str = "NUMERIC"  # NUMERIC, QUALITATIVE, BOOLEAN
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None
    expected_value: Optional[str] = None
    testing_method: Optional[str] = None
    is_critical: bool = False
    standard_reference: Optional[str] = None
    is_active: bool = True

class QualityStandardCreate(QualityStandardBase):
    @model_validator(mode="after")
    def validate_criteria(self):
        ptype = self.parameter_type.upper() if self.parameter_type else "NUMERIC"
        if ptype == "NUMERIC":
            if self.minimum_value is None or self.maximum_value is None:
                raise ValueError("minimum_value and maximum_value are required for NUMERIC parameters")
            if self.minimum_value > self.maximum_value:
                raise ValueError("minimum_value must be less than or equal to maximum_value")
        elif ptype in ("QUALITATIVE", "BOOLEAN"):
            if not self.expected_value:
                raise ValueError("expected_value is required for QUALITATIVE/BOOLEAN parameters")
            if ptype == "BOOLEAN" and self.expected_value.upper() not in ("TRUE", "FALSE"):
                raise ValueError("expected_value for BOOLEAN parameter must be 'TRUE' or 'FALSE'")
        return self

class QualityStandardUpdate(BaseModel):
    parameter_name: Optional[str] = None
    parameter_type: Optional[str] = None
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None
    expected_value: Optional[str] = None
    testing_method: Optional[str] = None
    is_critical: Optional[bool] = None
    standard_reference: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_criteria(self):
        if self.minimum_value is not None and self.maximum_value is not None:
            if self.minimum_value > self.maximum_value:
                raise ValueError("minimum_value must be less than or equal to maximum_value")
        return self

class QualityStandardOut(QualityStandardBase):
    id: int
    product: Optional[ProductRef] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedQualityStandards(BaseModel):
    items: list[QualityStandardOut]
    total: int
    page: int
    page_size: int
    total_pages: int
