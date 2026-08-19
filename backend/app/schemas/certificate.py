from pydantic import BaseModel, ConfigDict
from typing import Optional, Union, Any
from datetime import datetime, date

class CertificateBase(BaseModel):
    certificate_number: str
    product_id: Optional[int] = None
    batch_id: Optional[int] = None
    certificate_type: str # GMP, COA, ISO, IMPORT_LICENSE, REGISTRATION
    issuer: Optional[str] = None
    issue_date: Optional[Union[datetime, date]] = None
    expiry_date: Optional[Union[datetime, date]] = None
    document_path: Optional[str] = None
    verification_status: Optional[str] = "PENDING" # VALID, EXPIRING, EXPIRED, INVALID, PENDING

class CertificateCreate(CertificateBase):
    pass

class CertificateUpdate(BaseModel):
    certificate_number: Optional[str] = None
    product_id: Optional[int] = None
    batch_id: Optional[int] = None
    certificate_type: Optional[str] = None
    issuer: Optional[str] = None
    issue_date: Optional[Union[datetime, date]] = None
    expiry_date: Optional[Union[datetime, date]] = None
    document_path: Optional[str] = None
    verification_status: Optional[str] = None

class CertificateOut(CertificateBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    product: Optional[Any] = None
    batch: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)
