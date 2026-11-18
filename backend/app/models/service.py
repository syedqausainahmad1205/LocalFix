import uuid
from typing import Optional, List, TYPE_CHECKING
from datetime import time
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, Integer, Numeric, Text, Enum, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import PricingType

if TYPE_CHECKING:
    from app.models.user import ProviderProfile
    from app.models.request_quote import ServiceRequest
    from app.models.booking import Booking


class ServiceCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "service_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_name: Mapped[str] = mapped_column(String(50), default="Wrench", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    services: Mapped[List["Service"]] = relationship(
        "Service", back_populates="category", cascade="all, delete-orphan"
    )
    service_requests: Mapped[List["ServiceRequest"]] = relationship(
        "ServiceRequest", back_populates="category"
    )


class Service(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "services"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("299.00"), nullable=False)
    pricing_type: Mapped[PricingType] = mapped_column(
        Enum(PricingType, name="pricing_type_enum"),
        default=PricingType.FIXED,
        nullable=False
    )
    estimated_duration_mins: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped["ServiceCategory"] = relationship("ServiceCategory", back_populates="services")
    provider_offerings: Mapped[List["ProviderService"]] = relationship(
        "ProviderService", back_populates="service", cascade="all, delete-orphan"
    )
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="service")


class ProviderService(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "provider_services"

    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True
    )
    custom_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="offered_services")
    service: Mapped["Service"] = relationship("Service", back_populates="provider_offerings")


class ProviderAvailability(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "provider_availability"

    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time: Mapped[time] = mapped_column(Time, default=time(9, 0), nullable=False)
    end_time: Mapped[time] = mapped_column(Time, default=time(18, 0), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="availability_slots")
