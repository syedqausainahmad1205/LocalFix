import uuid
from typing import Optional, List, TYPE_CHECKING
from datetime import date
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Date, Numeric, Text, Enum, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import RequestStatus, QuotationStatus

if TYPE_CHECKING:
    from app.models.user import CustomerProfile, ProviderProfile, Address
    from app.models.service import ServiceCategory
    from app.models.booking import Booking


class ServiceRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "service_requests"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    address_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    preferred_date: Mapped[date] = mapped_column(Date, nullable=False)
    preferred_time_slot: Mapped[str] = mapped_column(String(50), default="10:00 AM - 01:00 PM", nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status_enum"),
        default=RequestStatus.OPEN,
        nullable=False,
        index=True
    )

    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile", back_populates="service_requests")
    category: Mapped["ServiceCategory"] = relationship("ServiceCategory", back_populates="service_requests")
    address: Mapped["Address"] = relationship("Address")
    quotations: Mapped[List["Quotation"]] = relationship(
        "Quotation", back_populates="request", cascade="all, delete-orphan"
    )
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="request", uselist=False)


class Quotation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quotations"

    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quoted_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    work_description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_duration_hours: Mapped[float] = mapped_column(Float, default=1.5, nullable=False)
    proposed_date: Mapped[date] = mapped_column(Date, nullable=False)
    proposed_time_slot: Mapped[str] = mapped_column(String(50), default="10:00 AM - 01:00 PM", nullable=False)
    additional_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[QuotationStatus] = mapped_column(
        Enum(QuotationStatus, name="quotation_status_enum"),
        default=QuotationStatus.SUBMITTED,
        nullable=False,
        index=True
    )

    request: Mapped["ServiceRequest"] = relationship("ServiceRequest", back_populates="quotations")
    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="quotations")
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="quotation", uselist=False)
