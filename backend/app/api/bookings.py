import random
import string
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_current_active_user
from app.models.enums import (
    UserRole,
    BookingStatus,
    PaymentStatus,
    VerificationStatus,
)
from app.models.user import User, CustomerProfile, ProviderProfile, Address
from app.models.service import Service, ProviderService
from app.models.booking import Booking, BookingStatusHistory, Payment
from app.models.communication import Conversation, Notification
from app.schemas.booking import (
    BookingCreateDirect,
    BookingStatusUpdate,
    BookingRead,
    BookingHistoryItem,
    PaymentSummary
)

router = APIRouter(prefix="/bookings", tags=["Booking Management"])


def generate_booking_reference() -> str:
    rand_chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"LF-2026-{rand_chars}"


# Permitted state machine transitions map: {current_status: {allowed_next_statuses}}
ALLOWED_TRANSITIONS = {
    BookingStatus.REQUESTED: {BookingStatus.ACCEPTED, BookingStatus.CANCELLED},
    BookingStatus.ACCEPTED: {BookingStatus.CONFIRMED, BookingStatus.CANCELLED},
    BookingStatus.CONFIRMED: {BookingStatus.ON_THE_WAY, BookingStatus.CANCELLED},
    BookingStatus.ON_THE_WAY: {BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED},
    BookingStatus.IN_PROGRESS: {BookingStatus.COMPLETED, BookingStatus.DISPUTED},
    BookingStatus.COMPLETED: {BookingStatus.DISPUTED},
    BookingStatus.CANCELLED: set(),
    BookingStatus.DISPUTED: set()
}


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_direct_booking(
    data: BookingCreateDirect,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Customer creates a direct booking for a specific provider and service."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can book services"
        )

    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer profile not found")

    prov = (
        db.query(ProviderProfile)
        .options(selectinload(ProviderProfile.user))
        .filter(ProviderProfile.id == data.provider_id)
        .first()
    )
    if not prov or not prov.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found or currently unavailable")

    srv = db.query(Service).filter(Service.id == data.service_id, Service.is_active == True).first()
    if not srv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or inactive")

    # Check custom price or base price
    prov_service = (
        db.query(ProviderService)
        .filter(ProviderService.provider_id == prov.id, ProviderService.service_id == srv.id, ProviderService.is_active == True)
        .first()
    )
    price = prov_service.custom_price if (prov_service and prov_service.custom_price) else srv.base_price

    addr = None
    if data.address_id:
        addr = db.query(Address).filter(Address.id == data.address_id, Address.user_id == current_user.id).first()
        if not addr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved address not found")
    elif data.street_address:
        addr = Address(
            user_id=current_user.id,
            label="Service Address",
            street_address=data.street_address.strip(),
            locality=data.city.strip() if data.city else "Service Area",
            city=data.city.strip() if data.city else (prov.city or "Aligarh"),
            state="Uttar Pradesh",
            postal_code=data.postal_code.strip() if data.postal_code else "202001",
            is_default=True
        )
        db.add(addr)
        db.commit()
        db.refresh(addr)
    else:
        addr = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc()).first()
        if not addr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please specify a service delivery address."
            )

    booking_ref = generate_booking_reference()
    booking = Booking(
        booking_reference=booking_ref,
        customer_id=cust_profile.id,
        provider_id=prov.id,
        service_id=srv.id,
        address_id=addr.id,
        scheduled_date=data.scheduled_date,
        scheduled_time_slot=data.scheduled_time_slot,
        total_amount=price,
        current_status=BookingStatus.REQUESTED,
        special_instructions=data.special_instructions
    )
    db.add(booking)
    db.flush()

    # Initial history record
    db.add(BookingStatusHistory(
        booking_id=booking.id,
        previous_status=None,
        new_status=BookingStatus.REQUESTED,
        changed_by_user_id=current_user.id,
        change_notes="Direct booking initiated by customer"
    ))

    # Initialize chat conversation
    db.add(Conversation(
        booking_id=booking.id,
        customer_id=cust_profile.id,
        provider_id=prov.id
    ))

    # Notify provider
    db.add(Notification(
        user_id=prov.user_id,
        title="New Booking Request",
        message=f"{current_user.full_name} booked '{srv.name}' for {data.scheduled_date}. Reference: {booking_ref}.",
        notification_type="new_booking",
        reference_type="booking",
        reference_id=booking.id
    ))

    db.commit()
    db.refresh(booking)

    return get_booking_details(booking.id, current_user, db)


@router.get("/my", response_model=List[BookingRead])
def get_my_bookings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all bookings belonging to the authenticated customer or provider."""
    query = (
        db.query(Booking)
        .options(
            selectinload(Booking.customer).selectinload(CustomerProfile.user),
            selectinload(Booking.provider).selectinload(ProviderProfile.user),
            selectinload(Booking.service),
            selectinload(Booking.address),
            selectinload(Booking.status_history).selectinload(BookingStatusHistory.changed_by),
            selectinload(Booking.payment)
        )
    )

    if current_user.role == UserRole.CUSTOMER:
        cust = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
        if not cust:
            return []
        bookings = query.filter(Booking.customer_id == cust.id).order_by(Booking.created_at.desc()).all()
    elif current_user.role == UserRole.PROVIDER:
        prov = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        if not prov:
            return []
        bookings = query.filter(Booking.provider_id == prov.id).order_by(Booking.created_at.desc()).all()
    elif current_user.role == UserRole.ADMIN:
        bookings = query.order_by(Booking.created_at.desc()).all()
    else:
        return []

    return [format_booking_read(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingRead)
def get_booking_details(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details and lifecycle timeline for a specific booking."""
    booking = (
        db.query(Booking)
        .options(
            selectinload(Booking.customer).selectinload(CustomerProfile.user),
            selectinload(Booking.provider).selectinload(ProviderProfile.user),
            selectinload(Booking.service),
            selectinload(Booking.address),
            selectinload(Booking.status_history).selectinload(BookingStatusHistory.changed_by),
            selectinload(Booking.payment)
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Authorization ownership check
    if current_user.role == UserRole.CUSTOMER:
        if booking.customer.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == UserRole.PROVIDER:
        if booking.provider.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return format_booking_read(booking)


@router.patch("/{booking_id}/status", response_model=BookingRead)
def update_booking_status(
    booking_id: uuid.UUID,
    data: BookingStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Enforce and execute valid status transitions in the booking lifecycle.
    Prevents invalid out-of-order transitions and records status audit history.
    """
    booking = (
        db.query(Booking)
        .options(
            selectinload(Booking.customer).selectinload(CustomerProfile.user),
            selectinload(Booking.provider).selectinload(ProviderProfile.user),
            selectinload(Booking.service),
            selectinload(Booking.address),
            selectinload(Booking.status_history).selectinload(BookingStatusHistory.changed_by),
            selectinload(Booking.payment)
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Validate transition path
    allowed_next = ALLOWED_TRANSITIONS.get(booking.current_status, set())
    if data.new_status not in allowed_next and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal status transition from '{booking.current_status.value}' to '{data.new_status.value}'."
        )

    # Role-specific transition rules
    if data.new_status == BookingStatus.ACCEPTED:
        if current_user.role != UserRole.PROVIDER or booking.provider.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned provider can accept the booking")

    if data.new_status in [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]:
        if current_user.role != UserRole.PROVIDER or booking.provider.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned provider can update job execution states")

    if data.new_status == BookingStatus.DISPUTED:
        if current_user.role != UserRole.CUSTOMER or booking.customer.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customer can file a dispute")

    # Manage real-time provider availability status
    if data.new_status in [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS]:
        booking.provider.is_available = False
    elif data.new_status == BookingStatus.COMPLETED:
        booking.provider.completed_jobs_count += 1
        booking.provider.is_available = True
    elif data.new_status == BookingStatus.CANCELLED:
        booking.provider.is_available = True

    prev_status = booking.current_status
    booking.current_status = data.new_status

    if data.cancellation_reason:
        booking.cancellation_reason = data.cancellation_reason

    # Add to status history
    history = BookingStatusHistory(
        booking_id=booking.id,
        previous_status=prev_status,
        new_status=data.new_status,
        changed_by_user_id=current_user.id,
        change_notes=data.change_notes or f"Status changed to {data.new_status.value}"
    )
    db.add(history)

    # Send Notification to opposite party
    target_user_id = booking.provider.user_id if current_user.id == booking.customer.user_id else booking.customer.user_id
    db.add(Notification(
        user_id=target_user_id,
        title=f"Booking Status: {data.new_status.value.replace('_', ' ').title()}",
        message=f"Booking {booking.booking_reference} is now {data.new_status.value.replace('_', ' ')}.",
        notification_type="booking_update",
        reference_type="booking",
        reference_id=booking.id
    ))

    db.commit()
    db.refresh(booking)

    return format_booking_read(booking)


def format_booking_read(b: Booking) -> BookingRead:
    history_items = []
    for h in b.status_history:
        history_items.append(BookingHistoryItem(
            id=h.id,
            previous_status=h.previous_status,
            new_status=h.new_status,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            change_notes=h.change_notes,
            created_at=h.created_at
        ))

    payment_summary = None
    if b.payment:
        payment_summary = PaymentSummary(
            id=b.payment.id,
            transaction_reference=b.payment.transaction_reference,
            amount=b.payment.amount,
            payment_method=b.payment.payment_method,
            payment_status=b.payment.payment_status,
            paid_at=b.payment.paid_at
        )

    return BookingRead(
        id=b.id,
        booking_reference=b.booking_reference,
        customer_id=b.customer_id,
        customer_name=b.customer.user.full_name if b.customer and b.customer.user else "Customer",
        customer_phone=b.customer.user.phone if b.customer and b.customer.user else None,
        provider_id=b.provider_id,
        provider_name=b.provider.user.full_name if b.provider and b.provider.user else "Provider",
        provider_business=b.provider.business_name if b.provider else None,
        provider_phone=b.provider.user.phone if b.provider and b.provider.user else None,
        service_id=b.service_id,
        service_name=b.service.name if b.service else "Custom Quoted Service",
        address_id=b.address_id,
        street_address=b.address.street_address if b.address else "",
        locality=b.address.locality if b.address else "",
        city=b.address.city if b.address else "Aligarh",
        scheduled_date=b.scheduled_date,
        scheduled_time_slot=b.scheduled_time_slot,
        total_amount=b.total_amount,
        current_status=b.current_status,
        cancellation_reason=b.cancellation_reason,
        special_instructions=b.special_instructions,
        created_at=b.created_at,
        updated_at=b.updated_at,
        status_history=history_items,
        payment=payment_summary
    )
