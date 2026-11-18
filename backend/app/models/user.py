from datetime import datetime, timezone
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey, Integer, Float, Text, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import UserRole, VerificationStatus

if TYPE_CHECKING:
    from app.models.service import ProviderService, ProviderAvailability
    from app.models.request_quote import ServiceRequest, Quotation
    from app.models.booking import Booking, Review
    from app.models.communication import Notification, Message


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        default=UserRole.CUSTOMER,
        nullable=False,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    customer_profile: Mapped[Optional["CustomerProfile"]] = relationship(
        "CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    provider_profile: Mapped[Optional["ProviderProfile"]] = relationship(
        "ProviderProfile", foreign_keys="[ProviderProfile.user_id]", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )


class CustomerProfile(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    preferred_locality: Mapped[Optional[str]] = mapped_column(String(100), default="Aligarh", nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="customer_profile")
    service_requests: Mapped[List["ServiceRequest"]] = relationship("ServiceRequest", back_populates="customer")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="customer")


class ProviderProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "provider_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    business_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    organisation_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    primary_skill: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    service_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    service_area: Mapped[str] = mapped_column(String(150), default="Aligarh", nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Aligarh", nullable=False, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), default="Uttar Pradesh", nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Geolocation coordinates (e.g. Aligarh Center: 27.8974, 78.0880)
    latitude: Mapped[float] = mapped_column(Float, default=27.8974, nullable=False, index=True)
    longitude: Mapped[float] = mapped_column(Float, default=78.0880, nullable=False, index=True)
    search_radius_km: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)

    # Verification status and administrative tracking
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status_enum"),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True
    )
    id_document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    skill_certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Identity documents & privacy security
    aadhaar_last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    aadhaar_number_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aadhaar_document_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    profile_photo_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resume_document_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    consent_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Administrative decisions
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    internal_verification_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Tutor specific attributes
    tutor_grades: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tutor_subjects: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tutor_mode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # General & Trade Specializations
    specializations: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Aggregate performance metrics (Starts at 0.0 and 0 reviews)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_jobs_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="provider_profile")
    verified_by_admin: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_admin_id])
    offered_services: Mapped[List["ProviderService"]] = relationship(
        "ProviderService", back_populates="provider", cascade="all, delete-orphan"
    )
    availability_slots: Mapped[List["ProviderAvailability"]] = relationship(
        "ProviderAvailability", back_populates="provider", cascade="all, delete-orphan"
    )
    quotations: Mapped[List["Quotation"]] = relationship("Quotation", back_populates="provider")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="provider")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="provider")


class Address(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "addresses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(50), default="Home", nullable=False)
    street_address: Mapped[str] = mapped_column(String(255), nullable=False)
    locality: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), default="Aligarh", nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Uttar Pradesh", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), default="202001", nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="addresses")
