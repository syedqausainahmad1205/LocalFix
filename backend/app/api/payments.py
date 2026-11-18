import random
import string
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_role, get_current_active_user
from app.models.enums import UserRole, PaymentStatus, BookingStatus
from app.models.user import User, CustomerProfile, ProviderProfile
from app.models.service import Service, ServiceCategory
from app.models.booking import Booking, Payment, BookingStatusHistory
from app.models.communication import Notification
from app.schemas.payment import PaymentCheckoutRequest, PaymentRead

router = APIRouter(prefix="/payments", tags=["Mock Payments"])


def generate_transaction_reference() -> str:
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f"TXN-LF-{rand}"


@router.post("/checkout", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def process_mock_payment(
    data: PaymentCheckoutRequest,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Process a simulated payment for a service booking.
    Creates an immutable transaction ledger record in PostgreSQL and updates booking confirmation.
    """
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer profile not found")

    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.customer_id != cust_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this booking")

    # Check for existing completed payment
    existing_payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if existing_payment and existing_payment.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already completed for this booking")

    now_utc = datetime.now(timezone.utc)
    txn_ref = generate_transaction_reference()

    if not existing_payment:
        payment = Payment(
            booking_id=booking.id,
            customer_id=cust_profile.id,
            provider_id=booking.provider_id,
            transaction_reference=txn_ref,
            amount=booking.total_amount,
            payment_method=data.payment_method,
            payment_status=PaymentStatus.COMPLETED,
            paid_at=now_utc
        )
        db.add(payment)
    else:
        existing_payment.transaction_reference = txn_ref
        existing_payment.payment_method = data.payment_method
        existing_payment.payment_status = PaymentStatus.COMPLETED
        existing_payment.paid_at = now_utc
        payment = existing_payment

    # Advance booking status to CONFIRMED if it was requested or accepted
    if booking.current_status in [BookingStatus.REQUESTED, BookingStatus.ACCEPTED]:
        prev = booking.current_status
        booking.current_status = BookingStatus.CONFIRMED
        db.add(BookingStatusHistory(
            booking_id=booking.id,
            previous_status=prev,
            new_status=BookingStatus.CONFIRMED,
            changed_by_user_id=current_user.id,
            change_notes=f"Payment received ({data.payment_method.value}). Booking automatically confirmed."
        ))

    # Send Notification to provider
    db.add(Notification(
        user_id=booking.provider.user_id if booking.provider else current_user.id,
        title="Payment Received",
        message=f"Payment of ₹{booking.total_amount:.2f} received for booking {booking.booking_reference}. Txn: {txn_ref}.",
        notification_type="payment_success",
        reference_type="booking",
        reference_id=booking.id
    ))

    db.commit()
    db.refresh(payment)

    return PaymentRead(
        id=payment.id,
        booking_id=payment.booking_id,
        transaction_reference=payment.transaction_reference,
        amount=payment.amount,
        payment_method=payment.payment_method,
        payment_status=payment.payment_status,
        paid_at=payment.paid_at,
        created_at=payment.created_at
    )


@router.get("/booking/{booking_id}", response_model=PaymentRead)
def get_booking_payment(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve the payment record associated with a booking."""
    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No payment record found for this booking")

    return PaymentRead(
        id=payment.id,
        booking_id=payment.booking_id,
        transaction_reference=payment.transaction_reference,
        amount=payment.amount,
        payment_method=payment.payment_method,
        payment_status=payment.payment_status,
        paid_at=payment.paid_at,
        created_at=payment.created_at
    )


@router.get("/booking/{booking_id}/invoice")
def get_booking_invoice(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve full official invoice receipt data for printing or download."""
    booking = (
        db.query(Booking)
        .options(
            selectinload(Booking.customer).selectinload(CustomerProfile.user),
            selectinload(Booking.provider).selectinload(ProviderProfile.user),
            selectinload(Booking.service).selectinload(Service.category),
            selectinload(Booking.address),
            selectinload(Booking.payment)
        )
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    payment = booking.payment
    total = float(booking.total_amount)
    base_price = round(total / 1.18, 2)
    gst_tax = round(total - base_price, 2)

    return {
        "invoice_number": f"INV-{booking.booking_reference}",
        "booking_reference": booking.booking_reference,
        "date": datetime.now().strftime("%B %d, %Y"),
        "invoice_date": datetime.now().strftime("%B %d, %Y"),
        "service_name": booking.service.name if booking.service else "Home Service",
        "base_amount": base_price,
        "gst_amount": gst_tax,
        "total_amount": total,
        "payment_status": payment.payment_status.value if payment else "PAID (ESCROW VERIFIED)",
        "customer": {
            "name": booking.customer.user.full_name if booking.customer and booking.customer.user else "Customer",
            "email": booking.customer.user.email if booking.customer and booking.customer.user else "",
            "phone": booking.customer.user.phone if booking.customer and booking.customer.user else "",
            "address": f"{booking.address.street_address}, {booking.address.locality}, {booking.address.city}" if booking.address else "Service Address"
        },
        "provider": {
            "business_name": booking.provider.business_name if booking.provider else "Verified Service Pro",
            "lead_name": booking.provider.user.full_name if booking.provider and booking.provider.user else "Specialist",
            "city": booking.provider.city if booking.provider else "All Cities",
            "service_area": booking.provider.service_area if booking.provider else ""
        },
        "service": {
            "name": booking.service.name if booking.service else "Home Service",
            "category": booking.service.category.name if booking.service and booking.service.category else "Services",
            "scheduled_date": booking.scheduled_date.strftime("%Y-%m-%d") if booking.scheduled_date else "",
            "scheduled_time_slot": booking.scheduled_time_slot or ""
        },
        "pricing": {
            "base_subtotal": base_price,
            "gst_18_percent": gst_tax,
            "platform_convenience_fee": 0.00,
            "total_amount": total
        },
        "payment": {
            "transaction_reference": payment.transaction_reference if payment else "PENDING-OR-CASH",
            "payment_method": payment.payment_method.value if payment else "Pending",
            "payment_status": payment.payment_status.value if payment else "Unpaid",
            "paid_at": payment.paid_at.strftime("%I:%M %p, %d %B %Y") if payment and payment.paid_at else "Pending"
        }
    }
