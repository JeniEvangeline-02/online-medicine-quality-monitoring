from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.analytics.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{report_type}/preview")
def preview_report(
    report_type: str,
    product_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ReportService.generate_report(
        db=db,
        report_type=report_type,
        product_id=product_id,
        supplier_id=supplier_id,
        status=status
    )

@router.get("/{report_type}/export/csv")
def export_report_csv(
    report_type: str,
    product_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report_data = ReportService.generate_report(
        db=db,
        report_type=report_type,
        product_id=product_id,
        supplier_id=supplier_id,
        status=status
    )
    csv_content = ReportService.export_csv(report_data)
    
    filename = f"{report_type}_report.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
