import random
import string
import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_role
from app.models.enums import (
    UserRole,
    VerificationStatus,
    RequestStatus,
    QuotationStatus,
    BookingStatus,
)
from app.models.user import User, ProviderProfile, CustomerProfile
from app.models.request_quote import ServiceRequest, Quotation
from app.models.booking import Booking, BookingStatusHistory
from app.models.communication import Notification, Conversation
from app.schemas.request_quote import QuotationCreate, QuotationRead

router = APIRouter(prefix="/quotations", tags=["Quotations"])


def generate_booking_reference() -> str:
    """Generate a unique human-friendly booking reference like LF-2026-X8B2."""
    rand_chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"LF-2026-{rand_chars}"


@router.post("", response_model=QuotationRead, status_code=status.HTTP_201_CREATED)
def submit_quotation(
    data: QuotationCreate,
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """Verified service provider submits a quotation for an open customer request."""
    prov_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provider profile not found")

    if prov_profile.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verification is required before submitting quotations."
        )

    req = db.query(ServiceRequest).filter(ServiceRequest.id == data.request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")

    if req.status not in [RequestStatus.OPEN, RequestStatus.QUOTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit quotation. Request status is '{req.status.value}'."
        )

    # Check for existing quotation from this provider
    existing_quote = (
        db.query(Quotation)
        .filter(Quotation.request_id == req.id, Quotation.provider_id == prov_profile.id)
        .first()
    )
    if existing_quote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a quotation for this request."
        )

    quote = Quotation(
        request_id=req.id,
        provider_id=prov_profile.id,
        quoted_amount=data.quoted_amount,
        work_description=data.work_description,
        estimated_duration_hours=data.estimated_duration_hours,
        proposed_date=data.proposed_date,
        proposed_time_slot=data.proposed_time_slot,
        additional_terms=data.additional_terms,
        status=QuotationStatus.SUBMITTED
    )
    db.add(quote)

    # Update request status to QUOTED if it was OPEN
    if req.status == RequestStatus.OPEN:
        req.status = RequestStatus.QUOTED

    # Send Notification to customer
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.id == req.customer_id).first()
    if cust_profile:
        notification = Notification(
            user_id=cust_profile.user_id,
            title="New Quotation Received",
            message=f"{prov_profile.business_name or current_user.full_name} submitted a quotation of ₹{data.quoted_amount:.2f} for '{req.title}'.",
            notification_type="quotation_received",
            reference_type="request",
            reference_id=req.id
        )
        db.add(notification)

    db.commit()
    db.refresh(quote)

    return QuotationRead(
        id=quote.id,
        request_id=quote.request_id,
        provider_id=quote.provider_id,
        provider_name=current_user.full_name,
        business_name=prov_profile.business_name,
        provider_rating=prov_profile.avg_rating,
        quoted_amount=quote.quoted_amount,
        work_description=quote.work_description,
        estimated_duration_hours=quote.estimated_duration_hours,
        proposed_date=quote.proposed_date,
        proposed_time_slot=quote.proposed_time_slot,
        additional_terms=quote.additional_terms,
        status=quote.status,
        created_at=quote.created_at
    )


@router.post("/{quotation_id}/accept", status_code=status.HTTP_200_OK)
def accept_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Customer accepts a quotation.
    This action creates a confirmed Booking, updates the quotation to accepted,
    marks other quotations rejected, and marks the service request booked.
    """
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer profile not found")

    quote = (
        db.query(Quotation)
        .options(selectinload(Quotation.request), selectinload(Quotation.provider))
        .filter(Quotation.id == quotation_id)
        .first()
    )
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")

    req = quote.request
    if req.customer_id != cust_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this service request")

    if quote.status != QuotationStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation cannot be accepted. Status is '{quote.status.value}'."
        )

    # 1. Update accepted quotation
    quote.status = QuotationStatus.ACCEPTED
    req.status = RequestStatus.BOOKED

    # 2. Reject other competitor quotes for this request
    other_quotes = (
        db.query(Quotation)
        .filter(Quotation.request_id == req.id, Quotation.id != quote.id)
        .all()
    )
    for oq in other_quotes:
        oq.status = QuotationStatus.REJECTED

    # 3. Create the Booking entity
    booking_ref = generate_booking_reference()
    new_booking = Booking(
        booking_reference=booking_ref,
        customer_id=cust_profile.id,
        provider_id=quote.provider_id,
        request_id=req.id,
        quotation_id=quote.id,
        address_id=req.address_id,
        scheduled_date=quote.proposed_date,
        scheduled_time_slot=quote.proposed_time_slot,
        total_amount=quote.quoted_amount,
        current_status=BookingStatus.CONFIRMED,
        special_instructions=f"Accepted Quotation: {quote.work_description}"
    )
    db.add(new_booking)
    db.flush()

    # 4. Record initial booking status history
    history = BookingStatusHistory(
        booking_id=new_booking.id,
        previous_status=None,
        new_status=BookingStatus.CONFIRMED,
        changed_by_user_id=current_user.id,
        change_notes=f"Quotation accepted by customer. Booking {booking_ref} created."
    )
    db.add(history)

    # 5. Initialize conversation for this booking
    conv = Conversation(
        booking_id=new_booking.id,
        customer_id=cust_profile.id,
        provider_id=quote.provider_id
    )
    db.add(conv)

    # 6. Notify provider
    prov = quote.provider
    if prov:
        db.add(Notification(
            user_id=prov.user_id,
            title="Quotation Accepted! Booking Confirmed",
            message=f"Customer {current_user.full_name} accepted your quotation of ₹{quote.quoted_amount:.2f}. Reference: {booking_ref}.",
            notification_type="booking_confirmed",
            reference_type="booking",
            reference_id=new_booking.id
        ))

    db.commit()

    return {
        "message": "Quotation successfully accepted",
        "booking_id": str(new_booking.id),
        "booking_reference": booking_ref,
        "status": "confirmed"
    }


@router.post("/{quotation_id}/reject", status_code=status.HTTP_200_OK)
def reject_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Customer explicitly rejects an unwanted quotation."""
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer profile not found")

    quote = (
        db.query(Quotation)
        .options(selectinload(Quotation.request))
        .filter(Quotation.id == quotation_id)
        .first()
    )
    if not quote or quote.request.customer_id != cust_profile.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")

    quote.status = QuotationStatus.REJECTED
    db.commit()

    return {"message": "Quotation rejected"}
