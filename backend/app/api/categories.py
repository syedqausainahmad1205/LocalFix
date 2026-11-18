from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.models.service import ServiceCategory, Service
from app.schemas.service import ServiceCategoryRead

router = APIRouter(prefix="/categories", tags=["Service Categories"])


@router.get("", response_model=List[ServiceCategoryRead])
def get_service_categories(db: Session = Depends(get_db)):
    """List all active service categories along with their services."""
    categories = (
        db.query(ServiceCategory)
        .options(selectinload(ServiceCategory.services))
        .filter(ServiceCategory.is_active == True)
        .order_by(ServiceCategory.display_order.asc(), ServiceCategory.name.asc())
        .all()
    )
    return categories


@router.get("/{slug}", response_model=ServiceCategoryRead)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve details and services for a single category by slug."""
    category = (
        db.query(ServiceCategory)
        .options(selectinload(ServiceCategory.services))
        .filter(ServiceCategory.slug == slug, ServiceCategory.is_active == True)
        .first()
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service category with slug '{slug}' not found"
        )
    return category
