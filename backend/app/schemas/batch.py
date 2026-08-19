from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class BatchBase(BaseModel):
    batch_number: str
    product_id: int
    manufacturer_id: int
    supplier_id: int
    manufacturing_date: date
    expiry_date: date
    quantity: float
    unit: str
    storage_requirement: Optional[str] = None

class BatchCreate(BatchBase):
    pass

class BatchUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    storage_requirement: Optional[str] = None
    quality_status: Optional[str] = None
    compliance_status: Optional[str] = None
    final_decision: Optional[str] = None
    recall_status: Optional[str] = None

class Ref(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class BatchOut(BatchBase):
    id: int
    quality_status: str
    compliance_status: str
    final_decision: str
    recall_status: str
    qr_identifier: Optional[str] = None
    expiry_status: Optional[str] = None  # Computed field
    product: Optional[Ref] = None
    manufacturer: Optional[Ref] = None
    supplier: Optional[Ref] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedBatches(BaseModel):
    items: list[BatchOut]
    total: int
    page: int
    page_size: int
    total_pages: int
