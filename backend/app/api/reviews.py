import uuid
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_role
from app.models.enums import UserRole, BookingStatus
from app.models.user import User, CustomerProfile, ProviderProfile
from app.models.booking import Booking, Review
from app.models.communication import Notification

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


class ReviewCreate(BaseModel):
    booking_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5, description="Star rating between 1 and 5")
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    provider_id: uuid.UUID
    customer_name: str
    rating: int
    comment: Optional[str] = None
    created_at: str


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    data: ReviewCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """
    Submit a review and rating for an eligible COMPLETED booking.
    Recalculates provider's aggregate average rating on the backend.
    """
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer profile not found")

    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.customer_id != cust_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this booking")

    # Strict check: Can ONLY review completed bookings
    if booking.current_status != BookingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reviews are only permitted for completed bookings. Current status is '{booking.current_status.value}'."
        )

    # Check for duplicate review
    existing_review = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review has already been submitted for this booking."
        )

    # Prevent provider self-rating
    prov = db.query(ProviderProfile).filter(ProviderProfile.id == booking.provider_id).first()
    if prov and prov.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Providers cannot rate themselves or their own services."
        )

    review = Review(
        booking_id=booking.id,
        customer_id=cust_profile.id,
        provider_id=booking.provider_id,
        rating=data.rating,
        comment=data.comment,
        is_public=True
    )
    db.add(review)
    db.flush()

    # Recalculate provider aggregate ratings
    if prov:
        stats = (
            db.query(
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews")
            )
            .filter(Review.provider_id == prov.id, Review.is_public == True)
            .one()
        )
        prov.avg_rating = round(float(stats.avg_rating or 0.0), 2)
        prov.total_reviews = int(stats.total_reviews or 0)

        # Notify provider
        db.add(Notification(
            user_id=prov.user_id,
            title="New Customer Review Received",
            message=f"{current_user.full_name} gave you {data.rating} stars for booking {booking.booking_reference}.",
            notification_type="review_received",
            reference_type="booking",
            reference_id=booking.id
        ))

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        provider_id=review.provider_id,
        customer_name=current_user.full_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.strftime("%Y-%m-%d")
    )


@router.get("/provider/{provider_id}", response_model=List[ReviewResponse])
def get_provider_reviews(provider_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve public reviews submitted for a specific service provider."""
    reviews = (
        db.query(Review)
        .join(CustomerProfile, Review.customer_id == CustomerProfile.id)
        .join(User, CustomerProfile.user_id == User.id)
        .filter(Review.provider_id == provider_id, Review.is_public == True)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        ReviewResponse(
            id=r.id,
            booking_id=r.booking_id,
            provider_id=r.provider_id,
            customer_name=r.customer.user.full_name if r.customer and r.customer.user else "Verified Customer",
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at.strftime("%Y-%m-%d")
        )
        for r in reviews
    ]
