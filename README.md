# LocalFix — Verified Local Service Marketplace
> **MCA Academic Project — Aligarh Muslim University (AMU)**  
> A production-oriented, full-stack marketplace connecting local residents with verified service professionals in Aligarh and beyond.

---

## 📌 Project Overview
**LocalFix** solves the problem of unreliable, unverified local home services by providing a transparent, location-aware platform for booking certified professionals (Electricians, Plumbers, AC Technicians, Carpenters, Cleaners, and Computer Technicians) with real-time status tracking, verified reviews, and administrative dispute oversight.

### Key Architecture Features
* **Backend**: FastAPI (Python 3.12+), SQLAlchemy 2.0 ORM, Pydantic v2 validation, Alembic migrations, PostgreSQL 16.
* **Security & Compliance**:
  - Direct `bcrypt` password hashing (salt rounds: 12).
  - Stateless HMAC-SHA256 JWT access tokens with granular RBAC (`customer`, `provider`, `admin`).
  - **Aadhaar Protection & Privacy**: 12-digit format validation (`^[2-9]\d{11}$`), AES/Fernet encryption at rest for raw Aadhaar numbers, last-4 masking (`XXXX-XXXX-1234`) on public/admin summaries, audit-logged decryption endpoint (`/reveal-aadhaar`).
  - **Private Storage**: Identity documents and resumes stored outside public web roots with file signature (magic byte) verification, 5MB size limits, and path traversal prevention.
* **Geospatial Engine**:
  - Strict **10.0 km radius discovery** calculated using accurate Haversine trigonometry against customer coordinates.
  - Public discovery endpoints filter strictly to `status == APPROVED` and within 10 km. No distant fallback leakage.
* **Admin Verification Workflow**:
  - Full-lifecycle status management: `PENDING` ➔ `APPROVED` or `REJECTED`.
  - Dossier review with document download streaming, mandatory rejection reasons, internal review notes, and admin audit trail.
* **Email Notification System**:
  - Configurable SMTP with deduplication and delivery state logging (`EmailNotificationLog`).
  - Sends approval confirmation with dashboard links, or rejection explanations with resubmission guidance.
* **Genuine Rating Engine**:
  - New providers initialize at `0.0` with `No ratings yet (0 reviews)`.
  - Aggregate recalculation strictly from completed bookings with self-rating prevention.
* **Frontend**: React 19 + Vite, Tailwind CSS, Dark / Light theme toggle, React Router v7, React Hook Form, Recharts, Leaflet / OpenStreetMap.

---

## 🛠️ Quick Start Guide

### 1. Database Setup (PostgreSQL 16)
Start the PostgreSQL container via Docker Compose:
```bash
docker compose up -d
```
*(Or connect to a local PostgreSQL instance matching `backend/.env`: `postgresql+psycopg://localfix_user:localfix_password@localhost:5432/localfix`)*

### 2. Backend Setup
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed initial Aligarh categories & test accounts
python -m app.db.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at:
* Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development app will run at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests
The test suite validates authentication, Aadhaar security, admin dossier inspection, approval/rejection workflows, email notification idempotency, 10 km geographic discovery, rating aggregates, and document authorization:

```bash
cd backend
pytest tests/ -v
```

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@localfix.com` | `admin123` | Full administrative control, verification requests & dispute resolution |
| **Customer** | `customer@localfix.com` | `customer123` | Mohd Zaid (Civil Lines, Aligarh) |
| **Verified Electrician** | `electrician@localfix.com` | `provider123` | Arif Khan (Aligarh Electrical Works, Dodhpur) — Approved |
| **Verified Plumber** | `plumber@localfix.com` | `provider123` | Farhan Siddiqui (AMU City Plumbers, Medical Colony) — Approved |
| **Pending AC Technician** | `ac@localfix.com` | `provider123` | Salman Ahmad (CoolZone, Shamshad Market) — Pending Review |

---

## 📁 Project Documentation
* [PowerPoint Presentation (.pptx)](file:///Users/qausainahmad/localfix/presentation/LocalFix_Project_Presentation.pptx)
* [Interactive HTML5 Slide Deck](file:///Users/qausainahmad/localfix/presentation/index.html)
* [Presentation Transcript & Viva Q&A Guide](file:///Users/qausainahmad/localfix/docs/PRESENTATION.md)
* [System Architecture](file:///Users/qausainahmad/localfix/docs/architecture.md)
* [System Requirements & Use Cases](file:///Users/qausainahmad/localfix/docs/requirements.md)
* [Database Design & ER Diagram](file:///Users/qausainahmad/localfix/docs/database-design.md)
* [Implementation Plan](file:///Users/qausainahmad/localfix/docs/implementation-plan.md)

