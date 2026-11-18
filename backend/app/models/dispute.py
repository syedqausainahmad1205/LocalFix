import uuid
from typing import Optional, Any, Dict, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, Enum, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin
from app.models.enums import ComplaintStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.booking import Booking


class Complaint(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "complaints"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filed_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    complaint_category: Mapped[str] = mapped_column(String(100), default="Service Quality", nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, name="complaint_status_enum"),
        default=ComplaintStatus.OPEN,
        nullable=False,
        index=True
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="complaints")
    filed_by: Mapped["User"] = relationship("User", foreign_keys=[filed_by_id])
    resolved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by_id])


class AdminAuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "admin_audit_logs"

    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_entity: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    admin: Mapped["User"] = relationship("User")
