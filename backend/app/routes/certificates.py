from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.models import Certificate, Product, Batch, User, AuditLog
from app.schemas.certificate import CertificateCreate, CertificateUpdate, CertificateOut
from app.core.dependencies import get_current_user, require_roles
from datetime import datetime

router = APIRouter(prefix="/certificates", tags=["Certificates Registry & Verification"])

@router.get("", response_model=dict)
def list_certificates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    product_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    certificate_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Certificate)

    if search:
        query = query.filter(
            (Certificate.certificate_number.ilike(f"%{search}%")) |
            (Certificate.issuer.ilike(f"%{search}%")) |
            (Certificate.certificate_type.ilike(f"%{search}%"))
        )
    if product_id:
        query = query.filter(Certificate.product_id == product_id)
    if batch_id:
        query = query.filter(Certificate.batch_id == batch_id)
    if certificate_type:
        query = query.filter(Certificate.certificate_type == certificate_type)
    if verification_status:
        query = query.filter(Certificate.verification_status == verification_status)

    total = query.count()
    items = query.order_by(Certificate.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Attach product & batch details
    results = []
    for it in items:
        p = db.query(Product).filter(Product.id == it.product_id).first() if it.product_id else None
        b = db.query(Batch).filter(Batch.id == it.batch_id).first() if it.batch_id else None
        out = CertificateOut.model_validate(it)
        out.product = {"id": p.id, "name": p.name, "product_code": p.product_code} if p else None
        out.batch = {"id": b.id, "batch_number": b.batch_number} if b else None
        results.append(out)

    return {
        "items": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size or 1
    }

@router.post("", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def create_certificate(
    cert_in: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "QUALITY_INSPECTOR", "SUPPLIER"]))
):
    if cert_in.product_id:
        p = db.query(Product).filter(Product.id == cert_in.product_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Target product not found.")
    if cert_in.batch_id:
        b = db.query(Batch).filter(Batch.id == cert_in.batch_id).first()
        if not b:
            raise HTTPException(status_code=404, detail="Target batch not found.")

    cert = Certificate(**cert_in.model_dump())
    db.add(cert)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CERTIFICATE_CREATED",
        entity_type="CERTIFICATE",
        entity_id=cert_in.certificate_number,
        new_value=f"Certificate {cert_in.certificate_number} ({cert_in.certificate_type}) uploaded",
        created_at=datetime.now()
    )
    db.add(audit)

    db.commit()
    db.refresh(cert)
    return cert

@router.get("/{cert_id}", response_model=CertificateOut)
def get_certificate(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")
    
    p = db.query(Product).filter(Product.id == cert.product_id).first() if cert.product_id else None
    b = db.query(Batch).filter(Batch.id == cert.batch_id).first() if cert.batch_id else None
    
    out = CertificateOut.model_validate(cert)
    out.product = {"id": p.id, "name": p.name, "product_code": p.product_code} if p else None
    out.batch = {"id": b.id, "batch_number": b.batch_number} if b else None
    return out

@router.put("/{cert_id}", response_model=CertificateOut)
def update_certificate_verification(
    cert_id: int,
    cert_in: CertificateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "QUALITY_INSPECTOR"]))
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found.")

    prev_status = cert.verification_status
    for field, val in cert_in.model_dump(exclude_unset=True).items():
        setattr(cert, field, val)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CERTIFICATE_VERIFIED",
        entity_type="CERTIFICATE",
        entity_id=str(cert.id),
        previous_value=f"Status: {prev_status}",
        new_value=f"Status: {cert.verification_status}",
        created_at=datetime.now()
    )
    db.add(audit)

    db.commit()
    db.refresh(cert)

    p = db.query(Product).filter(Product.id == cert.product_id).first() if cert.product_id else None
    b = db.query(Batch).filter(Batch.id == cert.batch_id).first() if cert.batch_id else None
    
    out = CertificateOut.model_validate(cert)
    out.product = {"id": p.id, "name": p.name, "product_code": p.product_code} if p else None
    out.batch = {"id": b.id, "batch_number": b.batch_number} if b else None
    return out
