from pydantic import BaseModel
from typing import Optional, Union
from datetime import datetime, date

class IncomingSupplyBase(BaseModel):
    batch_id: int
    hospital_id: int
    quantity_received: float
    received_date: Union[datetime, date]
    receiving_location: Optional[str] = None
    transport_status: Optional[str] = None
    storage_status: Optional[str] = None

class IncomingSupplyCreate(IncomingSupplyBase):
    pass

class IncomingSupplyUpdate(BaseModel):
    transport_status: Optional[str] = None
    storage_status: Optional[str] = None
    quality_status: Optional[str] = None
    compliance_status: Optional[str] = None
    final_decision: Optional[str] = None
    rejection_reason: Optional[str] = None

class BatchRef(BaseModel):
    id: int
    batch_number: str
    product_id: int
    class Config:
        from_attributes = True

class IncomingSupplyOut(IncomingSupplyBase):
    id: int
    receiving_id: str
    quality_status: str
    compliance_status: str
    final_decision: str
    rejection_reason: Optional[str] = None
    batch: Optional[BatchRef] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedIncomingSupplies(BaseModel):
    items: list[IncomingSupplyOut]
    total: int
    page: int
    page_size: int
    total_pages: int
