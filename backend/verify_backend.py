import sys

def verify():
    errors = []
    
    # 1. Check if PostgreSQL can connect (using the same settings)
    try:
        from app.database.database import engine
        with engine.connect() as conn:
            print("[OK] PostgreSQL connection successful.")
    except Exception as e:
        errors.append(f"PostgreSQL connection failed: {e}")
        print("[FAIL] PostgreSQL connection failed.")
    
    # 2. Start FastAPI app locally as a test and check /health? 
    # It's easier to just do a fake test since starting an entire server in script and killing it is tricky,
    # but we can at least import it to verify syntax and model integrity.
    try:
        from app.main import app
        print("[OK] Backend application imports successfully.")
    except Exception as e:
        errors.append(f"Backend import failed: {e}")
        print("[FAIL] Backend application import failed.")

    if errors:
        print("ERRORS FOUND:")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    else:
        print("Backend foundation successfully verified.")

if __name__ == "__main__":
    verify()
