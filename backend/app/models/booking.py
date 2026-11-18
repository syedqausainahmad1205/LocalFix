import uuid
from typing import Optional, List, TYPE_CHECKING
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Date, DateTime, Numeric, Text, Enum, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus

if TYPE_CHECKING:
    from app.models.user import CustomerProfile, ProviderProfile, Address, User
    from app.models.service import Service
    from app.models.request_quote import ServiceRequest, Quotation
    from app.models.communication import Conversation
    from app.models.dispute import Complaint


class Booking(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bookings"

    booking_reference: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True
    )
    request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    quotation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    address_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_time_slot: Mapped[str] = mapped_column(String(50), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    current_status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status_enum"),
        default=BookingStatus.REQUESTED,
        nullable=False,
        index=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile", back_populates="bookings")
    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="bookings")
    service: Mapped[Optional["Service"]] = relationship("Service", back_populates="bookings")
    request: Mapped[Optional["ServiceRequest"]] = relationship("ServiceRequest", back_populates="booking")
    quotation: Mapped[Optional["Quotation"]] = relationship("Quotation", back_populates="booking")
    address: Mapped["Address"] = relationship("Address")

    status_history: Mapped[List["BookingStatusHistory"]] = relationship(
        "BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan", order_by="BookingStatusHistory.created_at"
    )
    conversation: Mapped[Optional["Conversation"]] = relationship(
        "Conversation", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    review: Mapped[Optional["Review"]] = relationship(
        "Review", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="booking")


class BookingStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "booking_status_history"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_status: Mapped[Optional[BookingStatus]] = mapped_column(
        Enum(BookingStatus, name="booking_status_enum"), nullable=True
    )
    new_status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status_enum"), nullable=False
    )
    changed_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    change_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_history")
    changed_by: Mapped["User"] = relationship("User")


class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False
    )
    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False
    )
    transaction_reference: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method_enum"),
        default=PaymentMethod.MOCK_UPI,
        nullable=False
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status_enum"),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payment")


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reviews"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False
    )
    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="review")
    provider: Mapped["ProviderProfile"] = relationship("ProviderProfile", back_populates="reviews")
    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile")
