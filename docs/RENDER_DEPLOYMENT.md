# LocalFix — Render Deployment Guide (Step-by-Step)

This guide walks you through deploying the complete **LocalFix** platform on [Render.com](https://render.com) (PostgreSQL Database, FastAPI Backend, and React Frontend) using either the **Automated 1-Click Blueprint** or **Manual Dashboard Setup**.

---

## Architecture on Render

```
┌─────────────────────────────────┐      HTTPS / WSS       ┌─────────────────────────────────┐
│        localfix-frontend        │ ─────────────────────> │        localfix-backend         │
│   (Render Static Site / SPA)    │                        │    (Render Python Web Service)  │
│   https://localfix.onrender.com │                        │  https://localfix-api...onrender│
└─────────────────────────────────┘                        └─────────────────────────────────┘
                                                                            │
                                                                   Internal │ Connection
                                                                            ▼
                                                           ┌─────────────────────────────────┐
                                                           │           localfix-db           │
                                                           │   (Render Managed PostgreSQL)   │
                                                           └─────────────────────────────────┘
```

---

## Prerequisites

1. A free account on [Render.com](https://render.com).
2. A GitHub account with the `localfix` repository pushed to it.

---

## Method 1: Automated 1-Click Blueprint (Recommended)

LocalFix includes a pre-configured [`render.yaml`](file:///Users/qausainahmad/localfix/render.yaml) file at the root of the project.

### Step 1: Push Code to GitHub
Ensure all changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure production deployment for Render"
git push origin main
```

### Step 2: Connect to Render Blueprint
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **"New +"** in the top navigation bar and select **"Blueprint"**.
3. Connect your GitHub account and select your **`localfix`** repository.
4. Render will detect the `render.yaml` file and automatically display the 3 resources:
   * **`localfix-db`** (PostgreSQL Database)
   * **`localfix-backend`** (Python Web Service)
   * **`localfix-frontend`** (Static Site with SPA rewrite rules)
5. Click **"Apply"**.

Render will now provision the database, build and seed the backend, build the frontend, and link the environment variables automatically.

---

## Method 2: Manual Dashboard Setup (Step-by-Step)

If you prefer to configure each service manually in the Render UI, follow these steps:

### Step 1: Create the PostgreSQL Database
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **"New +"** ➔ **"PostgreSQL"**.
3. Fill in the details:
   * **Name**: `localfix-db`
   * **Database**: `localfix`
   * **User**: `localfix_user`
   * **Region**: Select your preferred region (e.g., *Oregon* or *Frankfurt*)
   * **Plan**: `Free`
4. Click **"Create Database"**.
5. Once created, copy the **Internal Database URL** (e.g. `postgres://localfix_user:...@dpg-...:5432/localfix`).

---

### Step 2: Deploy the FastAPI Backend
1. Click **"New +"** ➔ **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the service:
   * **Name**: `localfix-backend`
   * **Region**: *Same region as your database*
   * **Branch**: `main`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**:
     ```bash
     pip install -r requirements.txt && python -m app.db.init_db && python -m app.db.seed
     ```
   * **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   * **Plan**: `Free`
4. Expand **"Advanced"** and add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Paste your Internal Database URL* | Render uses `postgres://`; LocalFix automatically converts it to `postgresql+psycopg://` |
   | `SECRET_KEY` | *(Click "Generate" or enter a secure 32-char string)* | JWT signing key |
   | `PYTHON_VERSION` | `3.12.8` | Recommended Python runtime |
   | `EMAIL_TEST_MODE` | `true` | Prevents SMTP errors in production demo |
5. Click **"Create Web Service"**.
6. Wait 2–3 minutes for the build to finish. Once live, note your backend URL:
   `https://localfix-backend.onrender.com`

---

### Step 3: Deploy the React Frontend
1. Click **"New +"** ➔ **"Static Site"**.
2. Connect your GitHub repository.
3. Configure the service:
   * **Name**: `localfix-frontend`
   * **Branch**: `main`
   * **Root Directory**: `frontend`
   * **Build Command**:
     ```bash
     npm install && npm run build
     ```
   * **Publish Directory**: `dist`
4. Expand **"Advanced"** and add **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://localfix-backend.onrender.com` *(Replace with your actual backend URL)* |
5. In the left menu of your Static Site, click **"Redirects/Rewrites"**:
   * Click **"Add Rule"**
   * **Type**: `Rewrite`
   * **Source**: `/*`
   * **Destination**: `/index.html`
   *(This ensures client-side routing like `/search` or `/login` does not return 404 on refresh)*
6. Click **"Create Static Site"**.

---

## Verifying Your Deployed Application

Once deployment is complete:

1. **Backend Health Check**:
   Visit `https://localfix-backend.onrender.com/health` in your browser:
   ```json
   {"status":"healthy","message":"LocalFix API is running"}
   ```
2. **Interactive API Documentation (Swagger)**:
   Visit `https://localfix-backend.onrender.com/docs` to test endpoints interactively.
3. **Frontend Application**:
   Visit `https://localfix-frontend.onrender.com` to explore the live application.

---

## Demo Credentials on Deployed Site

The build command automatically seeds the database with realistic Aligarh service providers and test accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@localfix.com` | `admin123` |
| **Customer** | `customer@localfix.com` | `customer123` |
| **Electrician (Individual)** | `electrician@localfix.com` | `provider123` |
| **Plumber** | `plumber@localfix.com` | `provider123` |
| **AC Technician** | `ac@localfix.com` | `provider123` |

---

## Common Render Pitfalls Handled Automatically by LocalFix

1. **`postgres://` vs `postgresql+psycopg://`**:
   Render provides `postgres://` connection strings. LocalFix's Pydantic validator in [`backend/app/core/config.py`](file:///Users/qausainahmad/localfix/backend/app/core/config.py) automatically rewrites `postgres://` to `postgresql+psycopg://` so SQLAlchemy 2.0 connects seamlessly without dialect errors.
2. **CORS Restrictions**:
   LocalFix enables `allow_origin_regex=r"https?://.*"`, allowing your Render frontend URL to communicate with the backend without CORS blocks.
3. **Static Site SPA 404s**:
   The rewrite rule `/* -> /index.html` in [`render.yaml`](file:///Users/qausainahmad/localfix/render.yaml) ensures React Router navigates cleanly without 404 errors on page reload.
4. **WebSocket & Avatar URLs**:
   LocalFix dynamically reads `VITE_API_URL` so that WebSockets (`wss://`) and provider profile photos load cleanly across different Render subdomains.
