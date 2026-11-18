import uuid
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_current_active_user
from app.models.enums import ComplaintStatus, BookingStatus, UserRole
from app.models.user import User
from app.models.booking import Booking, BookingStatusHistory
from app.models.dispute import Complaint
from app.models.communication import Notification

router = APIRouter(prefix="/complaints", tags=["Complaints & Disputes"])


from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Any

class ComplaintCreate(BaseModel):
    booking_id: uuid.UUID
    complaint_category: Optional[str] = None
    category: Optional[str] = None
    description: str = Field(..., min_length=5)
    attachment_url: Optional[str] = None
    preferred_resolution: Optional[str] = Field("fast_refund", description="fast_refund | free_rework | priority_investigation")
    auto_resolve: bool = Field(True, description="Enable instant fast-track resolution under LocalFix Buyer Protection")

    @model_validator(mode="before")
    @classmethod
    def populate_category(cls, data: Any):
        if isinstance(data, dict):
            cat = data.get("complaint_category") or data.get("category") or "General Service Issue"
            data["complaint_category"] = cat
            data["category"] = cat
        return data


class ComplaintResolveRequest(BaseModel):
    status: ComplaintStatus = ComplaintStatus.RESOLVED
    resolution_notes: str = Field(..., min_length=5)


class ComplaintRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    booking_reference: str
    filed_by_name: str
    complaint_category: str
    description: str
    attachment_url: Optional[str] = None
    status: ComplaintStatus
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


@router.post("", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def file_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """File a formal complaint or dispute for a service booking with optional fast-track auto-resolution."""
    booking = (
        db.query(Booking)
        .options(selectinload(Booking.customer), selectinload(Booking.provider))
        .filter(Booking.id == data.booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    is_customer = booking.customer and booking.customer.user_id == current_user.id
    is_provider = booking.provider and booking.provider.user_id == current_user.id
    if not (is_customer or is_provider or current_user.role == UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    now_utc = datetime.now(timezone.utc)
    
    # Fast-track resolution support
    if data.auto_resolve:
        initial_status = ComplaintStatus.RESOLVED
        res_label = data.preferred_resolution.replace('_', ' ').title() if data.preferred_resolution else "Instant Refund Guarantee"
        res_notes = f"⚡ Fast-Track Resolution Auto-Approved: {res_label} approved under LocalFix 100% Satisfaction Guarantee. Resolution ID: FIX-{uuid.uuid4().hex[:8].upper()}."
        resolved_time = now_utc
    else:
        initial_status = ComplaintStatus.OPEN
        res_notes = None
        resolved_time = None

    complaint = Complaint(
        booking_id=booking.id,
        filed_by_id=current_user.id,
        complaint_category=data.complaint_category,
        description=data.description,
        attachment_url=data.attachment_url,
        status=initial_status,
        resolution_notes=res_notes,
        resolved_at=resolved_time
    )
    db.add(complaint)

    # Transition booking status
    if not data.auto_resolve and booking.current_status not in [BookingStatus.CANCELLED, BookingStatus.DISPUTED]:
        prev = booking.current_status
        booking.current_status = BookingStatus.DISPUTED
        db.add(BookingStatusHistory(
            booking_id=booking.id,
            previous_status=prev,
            new_status=BookingStatus.DISPUTED,
            changed_by_user_id=current_user.id,
            change_notes=f"Dispute opened: {data.complaint_category}"
        ))
    elif data.auto_resolve:
        db.add(BookingStatusHistory(
            booking_id=booking.id,
            previous_status=booking.current_status,
            new_status=booking.current_status,
            changed_by_user_id=current_user.id,
            change_notes=f"Complaint filed and fast-resolved under Buyer Protection ({data.complaint_category})."
        ))

    # Notifications
    db.add(Notification(
        user_id=current_user.id,
        title="Complaint Registered",
        message=f"Your complaint regarding booking {booking.booking_reference} has been recorded. Status: {initial_status.value.replace('_', ' ').upper()}.",
        notification_type="complaint_update",
        reference_type="booking",
        reference_id=booking.id
    ))

    db.commit()
    db.refresh(complaint)

    return ComplaintRead(
        id=complaint.id,
        booking_id=complaint.booking_id,
        booking_reference=booking.booking_reference,
        filed_by_name=current_user.full_name,
        complaint_category=complaint.complaint_category,
        description=complaint.description,
        attachment_url=complaint.attachment_url,
        status=complaint.status,
        resolution_notes=complaint.resolution_notes,
        resolved_at=complaint.resolved_at,
        created_at=complaint.created_at
    )


@router.patch("/{complaint_id}/resolve", response_model=ComplaintRead)
def resolve_complaint(
    complaint_id: uuid.UUID,
    data: ComplaintResolveRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Resolve a complaint with administrator or customer confirmation."""
    complaint = (
        db.query(Complaint)
        .options(selectinload(Complaint.booking))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    complaint.status = data.status
    complaint.resolution_notes = data.resolution_notes
    complaint.resolved_by_id = current_user.id
    complaint.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(complaint)

    return ComplaintRead(
        id=complaint.id,
        booking_id=complaint.booking_id,
        booking_reference=complaint.booking.booking_reference if complaint.booking else "N/A",
        filed_by_name=current_user.full_name,
        complaint_category=complaint.complaint_category,
        description=complaint.description,
        attachment_url=complaint.attachment_url,
        status=complaint.status,
        resolution_notes=complaint.resolution_notes,
        resolved_at=complaint.resolved_at,
        created_at=complaint.created_at
    )


@router.get("/booking/{booking_id}", response_model=List[ComplaintRead])
def get_booking_complaints(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all complaints filed for a specific booking."""
    complaints = (
        db.query(Complaint)
        .options(selectinload(Complaint.booking), selectinload(Complaint.filed_by))
        .filter(Complaint.booking_id == booking_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    return [
        ComplaintRead(
            id=c.id,
            booking_id=c.booking_id,
            booking_reference=c.booking.booking_reference if c.booking else "N/A",
            filed_by_name=c.filed_by.full_name if c.filed_by else "User",
            complaint_category=c.complaint_category,
            description=c.description,
            attachment_url=c.attachment_url,
            status=c.status,
            resolution_notes=c.resolution_notes,
            resolved_at=c.resolved_at,
            created_at=c.created_at
        )
        for c in complaints
    ]


@router.get("/my", response_model=List[ComplaintRead])
def get_my_complaints(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all complaints filed by or related to the user."""
    complaints = (
        db.query(Complaint)
        .options(selectinload(Complaint.booking), selectinload(Complaint.filed_by))
        .filter(Complaint.filed_by_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    return [
        ComplaintRead(
            id=c.id,
            booking_id=c.booking_id,
            booking_reference=c.booking.booking_reference if c.booking else "N/A",
            filed_by_name=c.filed_by.full_name if c.filed_by else "User",
            complaint_category=c.complaint_category,
            description=c.description,
            attachment_url=c.attachment_url,
            status=c.status,
            resolution_notes=c.resolution_notes,
            resolved_at=c.resolved_at,
            created_at=c.created_at
        )
        for c in complaints
    ]
