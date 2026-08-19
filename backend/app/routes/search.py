from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Product, Batch, Supplier, IncomingSupply, Recall, Alert, QuarantineRecord

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("/global")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query_term = f"%{q.strip()}%"
    results = {}

    # Products
    products = db.query(Product).filter(
        or_(Product.name.ilike(query_term), Product.product_code.ilike(query_term))
    ).limit(5).all()
    results["products"] = [
        {"id": p.id, "title": f"{p.name} ({p.product_code})", "type": p.product_type, "link": "/products"}
        for p in products
    ]

    # Batches
    batches = db.query(Batch).filter(Batch.batch_number.ilike(query_term)).limit(5).all()
    results["batches"] = [
        {"id": b.id, "title": f"Batch: {b.batch_number}", "quality": b.quality_status.value if hasattr(b.quality_status, 'value') else str(b.quality_status), "link": "/batches"}
        for b in batches
    ]

    # Suppliers
    suppliers = db.query(Supplier).filter(
        or_(Supplier.name.ilike(query_term), Supplier.registration_number.ilike(query_term))
    ).limit(5).all()
    results["suppliers"] = [
        {"id": s.id, "title": s.name, "reg": s.registration_number, "link": "/suppliers"}
        for s in suppliers
    ]

    # Incoming Supplies
    supplies = db.query(IncomingSupply).filter(IncomingSupply.receiving_id.ilike(query_term)).limit(5).all()
    results["incoming_supplies"] = [
        {"id": s.id, "title": f"Supply: {s.receiving_id}", "decision": s.final_decision, "link": "/incoming-supplies"}
        for s in supplies
    ]

    # Recalls
    recalls = db.query(Recall).filter(Recall.recall_number.ilike(query_term)).limit(5).all()
    results["recalls"] = [
        {"id": r.id, "title": f"Recall: {r.recall_number}", "severity": r.severity, "link": "/recalls"}
        for r in recalls
    ]

    # Alerts
    alerts = db.query(Alert).filter(
        or_(Alert.title.ilike(query_term), Alert.message.ilike(query_term))
    ).limit(5).all()
    results["alerts"] = [
        {"id": a.id, "title": a.title, "severity": a.severity, "link": "/alerts"}
        for a in alerts
    ]

    return results
