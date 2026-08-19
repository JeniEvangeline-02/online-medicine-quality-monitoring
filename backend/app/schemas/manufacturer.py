from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ManufacturerBase(BaseModel):
    name: str
    registration_number: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "ACTIVE"

class ManufacturerCreate(ManufacturerBase):
    pass

class ManufacturerUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

class ManufacturerOut(ManufacturerBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedManufacturers(BaseModel):
    items: list[ManufacturerOut]
    total: int
    page: int
    page_size: int
    total_pages: int
