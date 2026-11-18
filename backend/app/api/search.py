from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.core.config import settings
from app.models.user import User, ProviderProfile, CustomerProfile
from app.models.service import ServiceCategory, Service, ProviderService
from app.models.booking import Review
from app.models.enums import VerificationStatus
from app.services.geo_service import haversine_distance
from app.schemas.search import (
    ProviderSearchResult,
    OfferedServiceSummary,
    ProviderDetailResponse,
    ReviewSummary
)

router = APIRouter(prefix="/search", tags=["Search & Discovery"])


STRICT_MAX_RADIUS_KM = 10.0


@router.get("/providers", response_model=List[ProviderSearchResult])
def search_providers(
    category_slug: Optional[str] = Query(None, description="Filter by service category slug (e.g. 'electrician', 'tutors')"),
    city: Optional[str] = Query(None, description="Filter by city (e.g. 'Aligarh', 'Delhi NCR', 'Noida', 'Lucknow', 'All Cities')"),
    tutor_grade: Optional[str] = Query(None, description="Filter tutors by standard/grade (e.g. '6th', '8th', '10th', '12th')"),
    tutor_subject: Optional[str] = Query(None, description="Filter tutors by subject (e.g. 'math', 'science', 'english', 'all')"),
    tutor_mode: Optional[str] = Query(None, description="Filter tutors by mode: Online, Offline, Both"),
    q: Optional[str] = Query(None, description="Keyword search query"),
    latitude: Optional[float] = Query(None, description="Customer latitude"),
    longitude: Optional[float] = Query(None, description="Customer longitude"),
    max_radius_km: float = Query(10.0, description="Maximum search radius in kilometers (strictly capped at 10 km)"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Minimum provider rating"),
    verified_only: bool = Query(True, description="Only show verified professionals"),
    db: Session = Depends(get_db)
):
    """
    Search and discover verified local service providers strictly within 10 km of the customer's selected location.
    Enforces geographic distance calculation (Haversine), verifies APPROVED status, and never returns distant fallback results.
    """
    # Strict 10 km maximum cap on search radius
    effective_radius = min(float(max_radius_km), STRICT_MAX_RADIUS_KM)

    # Determine search center coordinates
    city_center = None
    if city and city in settings.SUPPORTED_CITIES:
        city_center = settings.SUPPORTED_CITIES[city]

    # If coordinates are not provided, resolve based on selected city or default
    if latitude is not None and longitude is not None:
        center_lat = latitude
        center_lon = longitude
    elif city_center:
        center_lat = city_center["lat"]
        center_lon = city_center["lon"]
    elif city and city != "All Cities":
        # Unrecognized city with no coordinates -> cannot discover within 10km
        return []
    else:
        center_lat = settings.DEFAULT_LATITUDE
        center_lon = settings.DEFAULT_LONGITUDE

    # Query only active providers with APPROVED or legacy VERIFIED status.
    # Pending or rejected applications are NEVER publicly discoverable.
    query = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .options(
            selectinload(ProviderProfile.user),
            selectinload(ProviderProfile.offered_services).selectinload(ProviderService.service).selectinload(Service.category)
        )
        .filter(
            User.is_active == True,
            ProviderProfile.verification_status.in_([VerificationStatus.APPROVED, VerificationStatus.VERIFIED])
        )
    )

    if min_rating is not None:
        query = query.filter(ProviderProfile.avg_rating >= min_rating)

    providers = query.all()
    results = []

    for prov in providers:
        # Calculate precise geographic distance
        dist = haversine_distance(center_lat, center_lon, prov.latitude, prov.longitude)

        # STRICT 10 KM RADIUS ENFORCEMENT: Never return providers outside the radius
        if dist > effective_radius:
            continue

        # Check tutor grade filter
        if tutor_grade and prov.tutor_grades:
            if tutor_grade.lower() not in prov.tutor_grades.lower() and "all" not in prov.tutor_grades.lower():
                continue
        elif tutor_grade and not prov.tutor_grades:
            continue

        # Check tutor subject filter
        if tutor_subject and prov.tutor_subjects:
            if tutor_subject.lower() not in prov.tutor_subjects.lower() and "all" not in prov.tutor_subjects.lower():
                continue
        elif tutor_subject and not prov.tutor_subjects:
            continue

        # Check tutor mode filter (Online, Offline, Both)
        if tutor_mode and prov.tutor_mode:
            t_mode_l = tutor_mode.lower()
            p_mode_l = prov.tutor_mode.lower()
            if t_mode_l not in p_mode_l and "both" not in p_mode_l and "both" not in t_mode_l:
                continue
        elif tutor_mode and not prov.tutor_mode:
            continue

        # Extract offered services
        service_summaries = []
        matches_category = False

        for ps in prov.offered_services:
            if not ps.is_active or not ps.service or not ps.service.is_active:
                continue

            srv = ps.service
            cat = srv.category
            if not cat or not cat.is_active:
                continue

            if category_slug:
                if cat.slug == category_slug or category_slug in cat.slug or cat.slug in category_slug:
                    matches_category = True
            else:
                matches_category = True

            service_summaries.append(OfferedServiceSummary(
                service_id=srv.id,
                service_name=srv.name,
                category_id=cat.id,
                category_name=cat.name,
                category_slug=cat.slug,
                base_price=srv.base_price,
                final_price=ps.custom_price if ps.custom_price is not None else srv.base_price,
                pricing_type=srv.pricing_type,
                estimated_duration_mins=srv.estimated_duration_mins
            ))

        # Check primary skill if category slug didn't match services
        if category_slug and not matches_category:
            if prov.primary_skill and (category_slug.lower() in prov.primary_skill.lower() or prov.primary_skill.lower() in category_slug.lower()):
                matches_category = True

        # If category requested and neither offered services nor primary skill matches, skip
        if category_slug and not matches_category:
            continue

        # Check keyword search query (q)
        if q:
            q_clean = q.lower().strip()
            prov_text = f"{prov.user.full_name} {prov.business_name or ''} {prov.organisation_name or ''} {prov.primary_skill or ''} {prov.specializations or ''} {prov.tutor_subjects or ''} {prov.tutor_grades or ''} {prov.tutor_mode or ''} {prov.bio or ''}".lower()
            prov_services = " ".join([s.service_name for s in service_summaries]).lower()
            combined_search = f"{prov_text} {prov_services}"
            q_words = [w for w in q_clean.split() if len(w) > 1]
            if q_words and not any(w in combined_search for w in q_words):
                continue

        # Attach default service if provider has none yet, so booking can always proceed
        if not service_summaries:
            fallback_services = db.query(Service).filter(Service.is_active == True).limit(2).all()
            for srv in fallback_services:
                cat = srv.category
                service_summaries.append(OfferedServiceSummary(
                    service_id=srv.id,
                    service_name=srv.name,
                    category_id=cat.id if cat else uuid.uuid4(),
                    category_name=cat.name if cat else "General",
                    category_slug=cat.slug if cat else "general",
                    base_price=srv.base_price,
                    final_price=srv.base_price,
                    pricing_type=srv.pricing_type,
                    estimated_duration_mins=srv.estimated_duration_mins
                ))

        # Optional city check if specified and not "All Cities"
        if city and city != "All Cities":
            city_l = city.lower()
            prov_city_l = (prov.city or "").lower()
            prov_area_l = (prov.service_area or "").lower()
            if city_l not in prov_city_l and city_l not in prov_area_l:
                # If city mismatch, skip
                continue

        result_item = ProviderSearchResult(
            provider_id=prov.id,
            user_id=prov.user_id,
            full_name=prov.user.full_name,
            business_name=prov.business_name,
            organisation_name=prov.organisation_name,
            primary_skill=prov.primary_skill,
            bio=prov.bio,
            experience_years=prov.experience_years,
            service_area=prov.service_area,
            city=prov.city or "Aligarh",
            profile_photo_url=f"/api/providers/photo/{prov.profile_photo_path}" if prov.profile_photo_path else None,
            tutor_grades=prov.tutor_grades,
            tutor_subjects=prov.tutor_subjects,
            tutor_mode=prov.tutor_mode,
            specializations=prov.specializations or prov.primary_skill,
            latitude=prov.latitude,
            longitude=prov.longitude,
            distance_km=round(dist, 2),
            verification_status=prov.verification_status,
            avg_rating=round(float(prov.avg_rating or 0.0), 2),
            total_reviews=int(prov.total_reviews or 0),
            completed_jobs_count=int(prov.completed_jobs_count or 0),
            is_available=prov.is_available,
            services=service_summaries
        )
        results.append(result_item)

    # Sort results primarily by proximity, then by rating
    results.sort(key=lambda r: (r.distance_km, -r.avg_rating))
    return results


@router.get("/providers/{provider_id}", response_model=ProviderDetailResponse)
def get_provider_details(provider_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve public profile, services, tutor specialties, and verified reviews for a specific provider."""
    prov = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .options(
            selectinload(ProviderProfile.user),
            selectinload(ProviderProfile.offered_services).selectinload(ProviderService.service).selectinload(Service.category),
            selectinload(ProviderProfile.reviews).selectinload(Review.customer).selectinload(CustomerProfile.user)
        )
        .filter(
            ProviderProfile.id == provider_id,
            User.is_active == True,
            ProviderProfile.verification_status.in_([VerificationStatus.APPROVED, VerificationStatus.VERIFIED])
        )
        .first()
    )

    if not prov:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found or not currently active/verified"
        )

    service_summaries = []
    for ps in prov.offered_services:
        if ps.is_active and ps.service and ps.service.is_active:
            srv = ps.service
            cat = srv.category
            service_summaries.append(OfferedServiceSummary(
                service_id=srv.id,
                service_name=srv.name,
                category_id=cat.id if cat else uuid.uuid4(),
                category_name=cat.name if cat else "General",
                category_slug=cat.slug if cat else "general",
                base_price=srv.base_price,
                final_price=ps.custom_price if ps.custom_price is not None else srv.base_price,
                pricing_type=srv.pricing_type,
                estimated_duration_mins=srv.estimated_duration_mins
            ))

    # Guarantee at least default category services if provider has not explicitly configured service pricing
    if not service_summaries:
        matching_cat = None
        if prov.primary_skill:
            skill_clean = prov.primary_skill.strip()
            matching_cat = db.query(ServiceCategory).filter(
                ServiceCategory.is_active == True,
                (ServiceCategory.slug.ilike(f"%{skill_clean}%") | ServiceCategory.name.ilike(f"%{skill_clean}%"))
            ).first()
        
        if not matching_cat:
            matching_cat = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).order_by(ServiceCategory.display_order.asc()).first()

        if matching_cat:
            cat_services = db.query(Service).filter(
                Service.category_id == matching_cat.id,
                Service.is_active == True
            ).all()
            for srv in cat_services:
                service_summaries.append(OfferedServiceSummary(
                    service_id=srv.id,
                    service_name=srv.name,
                    category_id=matching_cat.id,
                    category_name=matching_cat.name,
                    category_slug=matching_cat.slug,
                    base_price=srv.base_price,
                    final_price=srv.base_price,
                    pricing_type=srv.pricing_type,
                    estimated_duration_mins=srv.estimated_duration_mins
                ))

        if not service_summaries:
            fallback_services = db.query(Service).filter(Service.is_active == True).limit(3).all()
            for srv in fallback_services:
                cat = srv.category
                service_summaries.append(OfferedServiceSummary(
                    service_id=srv.id,
                    service_name=srv.name,
                    category_id=cat.id if cat else uuid.uuid4(),
                    category_name=cat.name if cat else "General",
                    category_slug=cat.slug if cat else "general",
                    base_price=srv.base_price,
                    final_price=srv.base_price,
                    pricing_type=srv.pricing_type,
                    estimated_duration_mins=srv.estimated_duration_mins
                ))

    recent_reviews = []
    for rev in prov.reviews:
        if rev.is_public:
            customer_name = "Verified Customer"
            if rev.customer and hasattr(rev.customer, "user") and rev.customer.user:
                customer_name = rev.customer.user.full_name
            recent_reviews.append(ReviewSummary(
                id=rev.id,
                customer_name=customer_name,
                rating=rev.rating,
                comment=rev.comment,
                created_at=rev.created_at.strftime("%Y-%m-%d")
            ))

    return ProviderDetailResponse(
        provider_id=prov.id,
        user_id=prov.user_id,
        full_name=prov.user.full_name,
        business_name=prov.business_name,
        organisation_name=prov.organisation_name,
        primary_skill=prov.primary_skill,
        bio=prov.bio,
        experience_years=prov.experience_years,
        service_area=prov.service_area,
        city=prov.city or "Aligarh",
        profile_photo_url=f"/api/providers/photo/{prov.profile_photo_path}" if prov.profile_photo_path else None,
        tutor_grades=prov.tutor_grades,
        tutor_subjects=prov.tutor_subjects,
        tutor_mode=prov.tutor_mode,
        specializations=prov.specializations or prov.primary_skill,
        latitude=prov.latitude,
        longitude=prov.longitude,
        verification_status=prov.verification_status,
        avg_rating=round(float(prov.avg_rating or 0.0), 2),
        total_reviews=int(prov.total_reviews or 0),
        completed_jobs_count=int(prov.completed_jobs_count or 0),
        is_available=prov.is_available,
        services=service_summaries,
        recent_reviews=recent_reviews
    )
