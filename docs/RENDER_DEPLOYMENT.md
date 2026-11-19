# LocalFix — Render Deployment Guide (Unified Single-Service)

This guide documents the **Unified Single-Service Architecture** for [Render.com](https://render.com). 

Instead of creating separate frontend and backend URLs with cross-domain connection issues, LocalFix packages the React frontend inside FastAPI. This gives you **EXACTLY 1 WORKING LINK** on Render that hosts the complete, fully operational marketplace with an integrated PostgreSQL database.

---

## Unified Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │              https://localfix.onrender.com              │
                        │           (Single Unified Render Web Service)           │
                        ├──────────────────────────┬──────────────────────────────┤
                        │   React 19 Frontend SPA  │      FastAPI Backend API     │
                        │      (/, /search, etc.)  │     (/api/..., /docs, /ws)   │
                        └──────────────────────────┴──────────────────────────────┘
                                                    │
                                           Internal │ Connection
                                                    ▼
                                        ┌───────────────────────┐
                                        │      localfix-db      │
                                        │  (PostgreSQL Database)│
                                        └───────────────────────┘
```

### Why This Architecture Works Better:
1. **Exactly 1 Working Link**: Render gives you one URL (`https://localfix.onrender.com`). You can share this single link with professors, evaluators, and users.
2. **Zero Cross-Origin (CORS) Issues**: Both the React UI and API run on the exact same domain. Every `/api/auth/login` request is an internal same-origin call.
3. **Automatic Database Initialization & Seeding**: Every time the web service starts, it runs `python -m app.db.init_db && python -m app.db.seed` to ensure all 18 tables and pre-seeded test accounts exist in PostgreSQL.
4. **No Build-Time Environment Variable Pitfalls**: Since the frontend calls `/api` relatively on the same domain, there is no need for `VITE_API_URL`.

---

## Step-by-Step Deployment on Render

### Step 1: Push All Code to GitHub
Open your terminal in the `localfix` root directory and push the updated files:

```bash
git add .
git commit -m "Switch to unified single-service architecture with bundled React frontend"
git push origin main
```

---

### Step 2: Apply the Blueprint on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Go to your **Blueprint** instance for `localfix` (or click **"New +" ➔ "Blueprint"** and select the `localfix` repository).
3. Render will read the updated [`render.yaml`](file:///Users/qausainahmad/localfix/render.yaml) file.
4. It will show 2 clean resources:
   * **`localfix-db`** (Managed PostgreSQL 16)
   * **`localfix`** (Unified Web Service serving both Frontend and Backend)
5. Click **"Apply"** (or **"Re-sync"** if already created).

*(If you previously had a `localfix-frontend` static site, you can delete it from your Render dashboard since `localfix` now serves the frontend directly).*

---

### Step 3: Access Your Single Working Site

Once the build completes (usually ~2 minutes), Render will display your single service URL:

👉 **`https://localfix.onrender.com`**

When you open this URL:
1. **Frontend**: The complete React marketplace opens instantly (Home, Search, Leaflet Maps, Dark/Light theme).
2. **Authentication**: Click **"Sign In"** and log in with any test account:
   * **Customer**: `customer@localfix.com` / `customer123`
   * **Admin**: `admin@localfix.com` / `admin123`
   * **Electrician**: `electrician@localfix.com` / `provider123`
   * **Plumber**: `plumber@localfix.com` / `provider123`
3. **Interactive Swagger Docs**: Visit `https://localfix.onrender.com/docs` to test all backend REST APIs.
4. **Health Check**: Visit `https://localfix.onrender.com/health` to verify system health.
