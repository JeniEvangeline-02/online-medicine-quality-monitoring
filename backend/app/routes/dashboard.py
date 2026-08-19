from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.analytics.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
@router.get("/command-center")
def get_command_center(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DashboardService.get_command_center_overview(db, current_user)

@router.get("/risk-matrix")
def get_risk_matrix(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DashboardService.get_risk_matrix(db)
