from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date

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

class IncomingSupplyRef(BaseModel):
    id: int
    receiving_id: str
    class Config:
        from_attributes = True

class QualitySampleBase(BaseModel):
    incoming_supply_id: int
    batch_id: int
    collection_date: datetime
    sample_quantity: float
    unit: Optional[str] = None
    sample_condition: Optional[str] = None
    status: str = "COLLECTED"  # COLLECTED, UNDER_TEST, TEST_COMPLETED, REJECTED

class QualitySampleCreate(QualitySampleBase):
    @field_validator("sample_quantity")
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Sample quantity must be greater than 0")
        return v

class QualitySampleUpdate(BaseModel):
    sample_quantity: Optional[float] = None
    unit: Optional[str] = None
    sample_condition: Optional[str] = None
    status: Optional[str] = None

    @field_validator("sample_quantity")
    def validate_quantity(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Sample quantity must be greater than 0")
        return v

class QualitySampleOut(QualitySampleBase):
    id: int
    sample_code: str
    collected_by: int
    collector: Optional[UserRef] = None
    batch: Optional[BatchRef] = None
    incoming_supply: Optional[IncomingSupplyRef] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedQualitySamples(BaseModel):
    items: list[QualitySampleOut]
    total: int
    page: int
    page_size: int
    total_pages: int
