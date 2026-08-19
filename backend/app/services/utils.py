"""
Shared utilities for Phase 3 services.
"""
import math
from datetime import date

def paginate(query, page: int, page_size: int):
    """Apply pagination and return (items, total, total_pages)."""
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages

def calc_expiry_status(expiry_date) -> str:
    """Calculate expiry status from expiry date."""
    if expiry_date is None:
        return "UNKNOWN"
    today = date.today()
    # Support both datetime and date objects
    exp = expiry_date.date() if hasattr(expiry_date, 'date') else expiry_date
    delta = (exp - today).days
    if delta < 0:
        return "EXPIRED"
    elif delta < 30:
        return "URGENT"
    elif delta <= 90:
        return "EXPIRING_SOON"
    else:
        return "SAFE"
