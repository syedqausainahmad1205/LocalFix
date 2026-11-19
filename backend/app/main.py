import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.storage_service import AVATARS_DIR, ensure_storage_dirs
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.search import router as search_router
from app.api.customers import router as customers_router
from app.api.providers import router as providers_router
from app.api.requests import router as requests_router
from app.api.quotations import router as quotations_router
from app.api.bookings import router as bookings_router
from app.api.payments import router as payments_router
from app.api.reviews import router as reviews_router
from app.api.communication import router as communication_router
from app.api.disputes import router as disputes_router
from app.api.admin import router as admin_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    ensure_storage_dirs()
    try:
        from app.db.init_db import init_db
        init_db()
        from app.db.seed import seed_database
        seed_database()
        logger.info("Database tables initialized and master data verified.")
    except Exception as e:
        logger.warning(f"Startup DB init/seed note: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Production Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

# Root endpoint: Serves React SPA to browsers, or API metadata in JSON mode
@app.get("/", include_in_schema=False)
def root(request: Request):
    accept_header = request.headers.get("accept", "")
    index_file = FRONTEND_DIST / "index.html"

    # Browsers navigate with text/html in their Accept header
    if "text/html" in accept_header and index_file.is_file():
        return FileResponse(index_file)

    # API consumers and health checks receive JSON metadata
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "locality": settings.DEFAULT_CITY,
        "status": "operational",
        "docs": "/docs"
    }

# Ensure storage directories exist
ensure_storage_dirs()

# Mount public avatars directory
app.mount("/api/uploads/avatars", StaticFiles(directory=str(AVATARS_DIR)), name="avatars")

# Register all API routers under /api
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(health_router)  # Also expose /health at root
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(providers_router, prefix=settings.API_V1_STR)
app.include_router(requests_router, prefix=settings.API_V1_STR)
app.include_router(quotations_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(communication_router)  # Handles /ws and /api/messages, /api/notifications
app.include_router(disputes_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

# Mount React production assets and SPA client-side routing fallback
if FRONTEND_DIST.exists():
    if (FRONTEND_DIST / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="react_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        if full_path.startswith("api") or full_path.startswith("ws") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "openapi.json":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Endpoint not found")

        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
