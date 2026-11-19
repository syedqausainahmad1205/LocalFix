from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
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

# Root status endpoint
@app.get("/")
def home():
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