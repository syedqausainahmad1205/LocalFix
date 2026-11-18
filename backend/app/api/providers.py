import uuid
import mimetypes
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_role
from app.models.enums import UserRole, VerificationStatus
from app.models.user import User, ProviderProfile
from app.models.service import Service, ProviderService, ProviderAvailability
from app.schemas.service import ProviderServiceRead, ProviderAvailabilityRead
from app.services.storage_service import get_avatar_path, save_uploaded_document

router = APIRouter(prefix="/providers", tags=["Provider Profile & Verification"])


class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    service_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    search_radius_km: Optional[float] = Field(None, gt=0)
    is_available: Optional[bool] = None
    tutor_mode: Optional[str] = None
    tutor_grades: Optional[str] = None
    tutor_subjects: Optional[str] = None


class AttachServiceRequest(BaseModel):
    service_id: uuid.UUID
    custom_price: Optional[Decimal] = None


class SubmitVerificationRequest(BaseModel):
    id_document_url: str = Field(..., min_length=5)
    skill_certificate_url: Optional[str] = None


@router.get("/me")
def get_my_provider_profile(
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Retrieve the authenticated provider's full profile, offered services, and availability."""
    prov = (
        db.query(ProviderProfile)
        .options(
            selectinload(ProviderProfile.offered_services).selectinload(ProviderService.service),
            selectinload(ProviderProfile.availability_slots)
        )
        .filter(ProviderProfile.user_id == current_user.id)
        .first()
    )
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    services = [
        {
            "id": str(ps.id),
            "service_id": str(ps.service_id),
            "service_name": ps.service.name if ps.service else "Service",
            "base_price": float(ps.service.base_price) if ps.service else 0.0,
            "custom_price": float(ps.custom_price) if ps.custom_price is not None else None,
            "is_active": ps.is_active
        }
        for ps in prov.offered_services
    ]

    availability = [
        {
            "id": str(slot.id),
            "day_of_week": slot.day_of_week,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "is_active": slot.is_active
        }
        for slot in prov.availability_slots
    ]

    return {
        "id": str(prov.id),
        "user_id": str(prov.user_id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "business_name": prov.business_name,
        "organisation_name": prov.organisation_name,
        "primary_skill": prov.primary_skill,
        "service_address": prov.service_address,
        "city": prov.city,
        "state": prov.state,
        "pincode": prov.pincode,
        "aadhaar_last4": prov.aadhaar_last4,
        "profile_photo_path": prov.profile_photo_path,
        "profile_photo_url": f"/api/providers/photo/{prov.profile_photo_path}" if prov.profile_photo_path else None,
        "bio": prov.bio,
        "experience_years": prov.experience_years,
        "service_area": prov.service_area,
        "latitude": prov.latitude,
        "longitude": prov.longitude,
        "search_radius_km": prov.search_radius_km,
        "verification_status": prov.verification_status,
        "id_document_url": prov.id_document_url,
        "skill_certificate_url": prov.skill_certificate_url,
        "rejection_reason": prov.rejection_reason,
        "tutor_mode": prov.tutor_mode,
        "tutor_grades": prov.tutor_grades,
        "tutor_subjects": prov.tutor_subjects,
        "specializations": prov.specializations,
        "avg_rating": prov.avg_rating,
        "total_reviews": prov.total_reviews,
        "completed_jobs_count": prov.completed_jobs_count,
        "is_available": prov.is_available,
        "verified_at": prov.verified_at.strftime("%Y-%m-%d %H:%M") if prov.verified_at else None,
        "services": services,
        "availability": availability
    }


@router.put("/me")
def update_provider_profile(
    data: ProviderProfileUpdate,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Update profile information, service radius, or availability toggle."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    update_fields = data.model_dump(exclude_unset=True)
    for field, val in update_fields.items():
        setattr(prov, field, val)

    db.commit()
    db.refresh(prov)
    return {"message": "Profile updated successfully"}


class AvailabilityToggle(BaseModel):
    is_available: bool


@router.patch("/me/availability")
def toggle_availability(
    data: AvailabilityToggle,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Instant toggle for real-time duty status (Available vs Offline/Busy)."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    prov.is_available = data.is_available
    db.commit()
    return {
        "message": f"Status updated to {'Available' if prov.is_available else 'Busy / Offline'}",
        "is_available": prov.is_available
    }


@router.post("/me/services")
def attach_service(
    data: AttachServiceRequest,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Add a service to the provider's active catalog with optional custom pricing."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    srv = db.query(Service).filter(Service.id == data.service_id, Service.is_active == True).first()
    if not srv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or inactive")

    existing = (
        db.query(ProviderService)
        .filter(ProviderService.provider_id == prov.id, ProviderService.service_id == srv.id)
        .first()
    )
    if existing:
        existing.custom_price = data.custom_price
        existing.is_active = True
    else:
        new_ps = ProviderService(
            provider_id=prov.id,
            service_id=srv.id,
            custom_price=data.custom_price,
            is_active=True
        )
        db.add(new_ps)

    db.commit()
    return {"message": f"Service '{srv.name}' added to your catalog"}


@router.post("/me/verification")
def submit_verification_documents(
    data: SubmitVerificationRequest,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Provider uploads identity and skill documents for administrator verification review."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    prov.id_document_url = data.id_document_url
    if data.skill_certificate_url:
        prov.skill_certificate_url = data.skill_certificate_url
    prov.verification_status = VerificationStatus.UNDER_REVIEW
    prov.rejection_reason = None

    db.commit()
    return {
        "message": "Verification documents successfully submitted. Your application is now Under Review.",
        "verification_status": "under_review"
    }


@router.delete("/me/services/{service_id}")
def remove_service(
    service_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Remove an offered service from the authenticated provider's catalog."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    ps = (
        db.query(ProviderService)
        .filter(ProviderService.provider_id == prov.id, ProviderService.service_id == service_id)
        .first()
    )
    if not ps:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found in provider's catalog")

    db.delete(ps)
    db.commit()
    return {"message": "Service removed from catalog"}


@router.get("/photo/{filename}")
def get_provider_photo(filename: str):
    """Public endpoint to serve provider profile photo."""
    file_path = get_avatar_path(filename)
    mime_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(file_path, media_type=mime_type or "image/jpeg")


@router.get("/{provider_id}/photo")
def get_provider_photo_by_id(provider_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve provider profile photo by provider UUID."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not prov or not prov.profile_photo_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile photo not found")
    file_path = get_avatar_path(prov.profile_photo_path)
    mime_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(file_path, media_type=mime_type or "image/jpeg")


@router.post("/me/photo")
async def update_my_profile_photo(
    photo_file: UploadFile = File(..., description="Mandatory profile photo (PNG, JPG, WEBP)"),
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Upload or update authenticated provider's profile photo."""
    prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    filename = await save_uploaded_document(photo_file, is_private=False)
    prov.profile_photo_path = filename
    db.commit()
    db.refresh(prov)
    return {
        "message": "Profile photo updated successfully",
        "profile_photo_path": filename,
        "profile_photo_url": f"/api/providers/photo/{filename}"
    }
