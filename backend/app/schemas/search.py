import uuid
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import VerificationStatus, PricingType


class OfferedServiceSummary(BaseModel):
    service_id: uuid.UUID
    service_name: str
    category_id: uuid.UUID
    category_name: str
    category_slug: str
    base_price: Decimal
    final_price: Decimal
    pricing_type: PricingType
    estimated_duration_mins: int


class ProviderSearchResult(BaseModel):
    provider_id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    business_name: Optional[str] = None
    organisation_name: Optional[str] = None
    primary_skill: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int
    service_area: str
    city: str = "Aligarh"
    profile_photo_url: Optional[str] = None
    tutor_grades: Optional[str] = None
    tutor_subjects: Optional[str] = None
    tutor_mode: Optional[str] = None
    specializations: Optional[str] = None
    latitude: float
    longitude: float
    distance_km: float
    verification_status: VerificationStatus
    avg_rating: float
    total_reviews: int
    completed_jobs_count: int
    is_available: bool
    services: List[OfferedServiceSummary] = []

    model_config = ConfigDict(from_attributes=True)


class ReviewSummary(BaseModel):
    id: uuid.UUID
    customer_name: str
    rating: int
    comment: Optional[str] = None
    created_at: str


class ProviderDetailResponse(BaseModel):
    provider_id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    business_name: Optional[str] = None
    organisation_name: Optional[str] = None
    primary_skill: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int
    service_area: str
    city: str = "Aligarh"
    profile_photo_url: Optional[str] = None
    tutor_grades: Optional[str] = None
    tutor_subjects: Optional[str] = None
    tutor_mode: Optional[str] = None
    specializations: Optional[str] = None
    latitude: float
    longitude: float
    verification_status: VerificationStatus
    avg_rating: float
    total_reviews: int
    completed_jobs_count: int
    is_available: bool
    services: List[OfferedServiceSummary] = []
    recent_reviews: List[ReviewSummary] = []
