# System Architecture

This outlines the high-level flow of the Pharmaceutical Quality Control platform.

## Request Flow

Frontend
↓
REST API (FastAPI routes)
↓
Services (Business logic and compliance engine)
↓
SQLAlchemy (ORM)
↓
PostgreSQL (Database)

## Modules

- **Quality Compliance Engine**: Central component determining ACCEPTED / QUARANTINED / REJECTED statuses.
- **Incoming Supply Flow**: Incoming Supply → Testing → Compliance → Automated Decision
