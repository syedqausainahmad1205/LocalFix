import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.enums import UserRole, VerificationStatus


class AddressBase(BaseModel):
    label: str = "Home"
    street_address: str
    locality: str
    city: str = "Aligarh"
    state: str = "Uttar Pradesh"
    postal_code: str = "202001"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressRead(AddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerProfileRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    preferred_locality: Optional[str] = "Aligarh"
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProviderProfileRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    business_name: Optional[str] = None
    organisation_name: Optional[str] = None
    primary_skill: Optional[str] = None
    bio: Optional[str] = None
    experience_years: int
    service_address: Optional[str] = None
    service_area: str
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: float
    longitude: float
    search_radius_km: float
    verification_status: VerificationStatus
    profile_photo_path: Optional[str] = None
    profile_photo_url: Optional[str] = None
    rejection_reason: Optional[str] = None
    avg_rating: float
    total_reviews: int
    completed_jobs_count: int
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    customer_profile: Optional[CustomerProfileRead] = None
    provider_profile: Optional[ProviderProfileRead] = None
    addresses: List[AddressRead] = []

    model_config = ConfigDict(from_attributes=True)
