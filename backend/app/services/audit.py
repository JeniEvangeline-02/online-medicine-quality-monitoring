from datetime import datetime
from sqlalchemy.orm import Session
from app.database.database import get_db

def create_audit_log(
    db: Session,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    user_id: int = None,
    previous_value: str = None,
    new_value: str = None,
    rule_code: str = None,
    decision: str = None
):
    """
    Creates an audit log entry. user_id can be None for system-level actions.
    Passwords and sensitive data must NEVER be passed to this function.
    """
    from app.models import AuditLog
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        previous_value=previous_value,
        new_value=new_value,
        rule_code=rule_code,
        decision=decision,
    )
    db.add(log)
    db.commit()
