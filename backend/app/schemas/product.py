from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    product_code: str
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    product_type: str  # MEDICINE or CONSUMABLE
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    description: Optional[str] = None
    manufacturer_id: int
    registration_number: Optional[str] = None
    storage_requirement: Optional[str] = None
    status: str = "ACTIVE"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    description: Optional[str] = None
    storage_requirement: Optional[str] = None
    status: Optional[str] = None

class ManufacturerRef(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class ProductOut(ProductBase):
    id: int
    manufacturer: Optional[ManufacturerRef] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedProducts(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int
