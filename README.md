# Online Testing and Monitoring of Quality of Medicines and Consumables

> **An Intelligent Hospital Pharmaceutical Quality Testing, Traceability, Automated Decision & AI Risk Intelligence Platform.**
> **Prototype url**:https://drive.google.com/drive/u/0/home

---

## 🏛️ System Overview

The **Hospital Pharmaceutical Quality Platform** is an enterprise-grade medical supply chain intelligence and regulatory monitoring system. It guarantees medicine and consumable efficacy, patient safety, and regulatory compliance through:

1. **Deterministic Regulatory Engine (Phase 5)**: Automated, rule-based verdicts (`ACCEPTED`, `QUARANTINED`, `REJECTED`) based on rigorous standard testing and certificate verification.
2. **End-to-End Traceability & Cold-Chain Telemetry (Phase 6)**: QR-code scanning, real-time IoT storage & transport monitoring, excursion detection, automated quarantine containment, product recalls, and CAPA resolution workflows.
3. **Clinical Quality Command Center & Analytics (Phase 7)**: Live non-fictional database telemetry, composite 4x4 Risk Matrix, batch risk rankings, and 13 specialized exportable clinical reports.
4. **AI Risk Intelligence & Predictive Anomaly Detection (Phase 8)**: Multi-factor explainable batch/supplier/product risk scoring (0–100), statistical anomaly detection, early warning indicators, and advisory recommendations.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.10+) |
| **Database & ORM** | PostgreSQL + SQLAlchemy 2.0 |
| **Database Migrations** | Alembic + Custom Idempotent Auto-Migrator |
| **Authentication & RBAC** | JWT (JSON Web Tokens) + Bcrypt Password Hashing |
| **Frontend Framework** | React 18 + Vite |
| **Styling & UI Design** | Tailwind CSS + Custom Clinical Aesthetics System |
| **Testing & Quality** | Pytest / Unittest / FastAPI TestClient |

---

## 📐 Architecture & Non-Interference Principle

```
                         INCOMING HOSPITAL SUPPLY
                                    ↓
                 ┌──────────────────┴──────────────────┐
                 ↓                                     ↓
     DETERMINISTIC COMPLIANCE                   AI RISK ENGINE
         (Phase 5 Authority)                 (Phase 8 Intelligence)
                 ↓                                     ↓
        MANDATORY VERDICT                        EXPLAINABLE
    [ACCEPTED / QUARANTINE / REJECT]          RISK & ANOMALIES
                 └──────────────────┬──────────────────┘
                                    ↓
                     HOSPITAL QUALITY COMMAND CENTER
```

* **Core Principle**: Phase 8 AI insights never silently override or bypass Phase 5 regulatory compliance decisions. Phase 5 remains the sole authority for mandatory regulatory acceptance, quarantine, and rejection.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **PostgreSQL 14+**

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials and secret keys:
     ```ini
     PROJECT_NAME="Online Testing and Monitoring of Quality of Medicines and Consumables"
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pharma_db
     SECRET_KEY=your-secure-production-secret-key
     FRONTEND_URL=http://localhost:5173
     ```
5. Run the database migration and initialize tables:
   ```bash
   python -m app.database.migrate
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web application at `http://localhost:5173`.

---

## 🧪 Comprehensive Automated Test Suites

The platform includes automated end-to-end integration and regression test suites:

```bash
# Run Phase 8 AI Risk & Anomaly Suite:
python backend/test_phase8.py

# Run Phase 7 Command Center & Report Suite:
python backend/test_phase7.py

# Run Phase 6 Traceability & Cold-Chain Suite:
python backend/test_phase6.py

# Run Phase 5 Compliance & Decision Engine Suite:
python -m unittest backend/test_phase5.py

# Run Phase 4 Laboratory Testing Suite:
python backend/test_phase4.py
```

---

## 📊 Core API Endpoints

### Health Check
- `GET /health`: Comprehensive system and database connection status.

### Authentication & RBAC
- `POST /api/v1/auth/login`: Issue JWT session token.
- `POST /api/v1/auth/register`: Secure user onboarding.
- `GET /api/v1/auth/me`: Current user profile and role details.

### AI Risk Intelligence & Anomalies (Phase 8)
- `GET /api/v1/ai/overview`: Global risk counts, distribution, and model status.
- `GET /api/v1/ai/batch/{id}`: Detailed explainable batch risk profile.
- `GET /api/v1/ai/batches`: Ranked batch risk scores.
- `GET /api/v1/ai/suppliers`: Supplier reliability and sample-size confidence.
- `GET /api/v1/ai/products`: Product vulnerability profiles.
- `GET /api/v1/ai/anomalies`: Active quality and telemetry anomalies.
- `PUT /api/v1/ai/anomalies/{id}/status`: Anomaly workflow transition (`NEW` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `RESOLVED`).
- `GET /api/v1/ai/early-warnings`: Predictive early warnings.
- `POST /api/v1/ai/recalculate`: Trigger on-demand model recalculation.

### Command Center & Reports (Phase 7)
- `GET /api/v1/dashboard/command-center`: Real-time hospital operations overview.
- `GET /api/v1/dashboard/risk-matrix`: Live 4x4 Likelihood $\times$ Impact risk matrix.
- `GET /api/v1/reports/{type}/preview`: Preview any of the 13 clinical report datasets.
- `GET /api/v1/reports/{type}/export/csv`: Stream report data to CSV.
- `GET /api/v1/search/global`: Multi-entity search across batches, products, and alerts.

---

## 🛡️ Security & Production Hardening

- **Role-Based Access Control (RBAC)**: Strict role boundaries for `ADMIN`, `QUALITY_INSPECTOR`, `HOSPITAL`, and `SUPPLIER`.
- **Data Isolation**: Supplier accounts can only view shipments and batches linked to their registered entity.
- **Audit Trails**: Every decision, status change, and AI recalculation is timestamped and persisted in `audit_logs` and `ai_risk_assessments`.
- **Secret Protection**: All secrets, DB credentials, and keys are loaded through environment variables.
