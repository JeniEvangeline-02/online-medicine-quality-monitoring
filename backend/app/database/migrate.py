from sqlalchemy import text
from app.database.database import engine, Base
from app.models import *

def _add_column_if_missing(conn, table, col, col_def):
    res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'"))
    existing = [r[0] for r in res.fetchall()]
    if col not in existing:
        print(f"  Adding {table}.{col}...")
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))

def migrate_db():
    print("Starting database migration...")
    
    # 1. Create all tables that don't exist
    Base.metadata.create_all(bind=engine)
    print("Tables created (if not existing).")
    
    # 2. Add missing columns for existing tables
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # --- quality_standards ---
            _add_column_if_missing(conn, "quality_standards", "parameter_type", "VARCHAR")
            _add_column_if_missing(conn, "quality_standards", "expected_value", "VARCHAR")

            # --- quality_tests ---
            _add_column_if_missing(conn, "quality_tests", "sample_id", "INTEGER REFERENCES quality_samples(id)")
            _add_column_if_missing(conn, "quality_tests", "status", "VARCHAR DEFAULT 'PENDING'")
            _add_column_if_missing(conn, "quality_tests", "is_completed", "BOOLEAN DEFAULT FALSE")

            # --- incoming_supplies (Phase 5) ---
            _add_column_if_missing(conn, "incoming_supplies", "decision_reason", "TEXT")
            _add_column_if_missing(conn, "incoming_supplies", "decision_date", "TIMESTAMP WITH TIME ZONE")
            _add_column_if_missing(conn, "incoming_supplies", "decision_source", "VARCHAR")
            _add_column_if_missing(conn, "incoming_supplies", "decision_severity", "VARCHAR")
            _add_column_if_missing(conn, "incoming_supplies", "compliance_score", "FLOAT DEFAULT 100.0")

            # --- alerts (Phase 6 extension) ---
            _add_column_if_missing(conn, "alerts", "status", "VARCHAR DEFAULT 'UNREAD'")
            _add_column_if_missing(conn, "alerts", "entity_type", "VARCHAR")
            _add_column_if_missing(conn, "alerts", "entity_id", "VARCHAR")
            _add_column_if_missing(conn, "alerts", "assigned_to", "INTEGER REFERENCES users(id)")
            _add_column_if_missing(conn, "alerts", "acknowledged_at", "TIMESTAMP")
            _add_column_if_missing(conn, "alerts", "resolved_at", "TIMESTAMP")
            _add_column_if_missing(conn, "alerts", "resolution_notes", "TEXT")

            # --- quarantine_records (Phase 6 extension) ---
            _add_column_if_missing(conn, "quarantine_records", "quarantine_number", "VARCHAR")
            _add_column_if_missing(conn, "quarantine_records", "reason_type", "VARCHAR")
            _add_column_if_missing(conn, "quarantine_records", "severity", "VARCHAR")
            _add_column_if_missing(conn, "quarantine_records", "batch_id", "INTEGER REFERENCES batches(id)")
            _add_column_if_missing(conn, "quarantine_records", "location", "VARCHAR")

            # --- recalls (Phase 6 extension) ---
            _add_column_if_missing(conn, "recalls", "product_id", "INTEGER REFERENCES products(id)")
            _add_column_if_missing(conn, "recalls", "issued_by", "INTEGER REFERENCES users(id)")
            _add_column_if_missing(conn, "recalls", "description", "TEXT")
            _add_column_if_missing(conn, "recalls", "affected_supplies_count", "INTEGER DEFAULT 0")
            _add_column_if_missing(conn, "recalls", "completed_at", "TIMESTAMP")

            trans.commit()
            print("Database migration completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Error running database migrations: {e}")

if __name__ == "__main__":
    migrate_db()
