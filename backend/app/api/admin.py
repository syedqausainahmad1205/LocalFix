import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_

from app.api.deps import get_db, require_role
from app.models.enums import (
    UserRole,
    VerificationStatus,
    BookingStatus,
    ComplaintStatus,
    PaymentStatus
)
from app.models.user import User, CustomerProfile, ProviderProfile
from app.models.service import ServiceCategory, Service
from app.models.booking import Booking, Payment
from app.models.dispute import Complaint, AdminAuditLog
from app.models.communication import Notification
from app.core.security import decrypt_aadhaar, mask_aadhaar
from app.services.storage_service import get_private_document_path, get_avatar_path
from app.services.email_service import send_provider_approval_email, send_provider_rejection_email

router = APIRouter(prefix="/admin", tags=["Administrator Control Center"])


class VerificationDecision(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    rejection_reason: Optional[str] = None
    internal_note: Optional[str] = None


class DisputeResolution(BaseModel):
    action: str = Field(..., pattern="^(resolve|reject)$")
    resolution_notes: str = Field(..., min_length=5)


@router.get("/verifications")
def get_verification_requests(
    status_filter: Optional[str] = Query("ALL", alias="status", description="Filter by status: ALL, PENDING, APPROVED, REJECTED"),
    search: Optional[str] = Query(None, description="Search by provider name, email, business name, or city"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Retrieve provider verification applications with multi-status filtering
    (PENDING, APPROVED, REJECTED, ALL), search, and pagination.
    """
    query = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .options(
            selectinload(ProviderProfile.user),
            selectinload(ProviderProfile.verified_by_admin)
        )
    )

    # Status filter
    status_norm = (status_filter or "ALL").upper().strip()
    if status_norm == "PENDING":
        query = query.filter(ProviderProfile.verification_status.in_([VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW]))
    elif status_norm == "APPROVED":
        query = query.filter(ProviderProfile.verification_status.in_([VerificationStatus.APPROVED, VerificationStatus.VERIFIED]))
    elif status_norm == "REJECTED":
        query = query.filter(ProviderProfile.verification_status == VerificationStatus.REJECTED)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(User.email).like(term),
                func.lower(ProviderProfile.business_name).like(term),
                func.lower(ProviderProfile.city).like(term),
                func.lower(ProviderProfile.primary_skill).like(term)
            )
        )

    total_count = query.count()
    applications = (
        query
        .order_by(ProviderProfile.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for p in applications:
        admin_name = p.verified_by_admin.full_name if p.verified_by_admin else None
        items.append({
            "id": str(p.id),
            "provider_id": str(p.id),
            "user_id": str(p.user_id),
            "full_name": p.user.full_name,
            "email": p.user.email,
            "phone": p.user.phone,
            "business_name": p.business_name,
            "organisation_name": p.organisation_name,
            "primary_skill": p.primary_skill or p.specializations or "General Services",
            "service_address": p.service_address or p.service_area,
            "city": p.city,
            "state": p.state or "Uttar Pradesh",
            "pincode": p.pincode or "202001",
            "latitude": p.latitude,
            "longitude": p.longitude,
            "experience_years": p.experience_years,
            "verification_status": p.verification_status,
            "masked_aadhaar": mask_aadhaar(p.aadhaar_last4),
            "aadhaar_last4": p.aadhaar_last4,
            "has_aadhaar_doc": bool(p.aadhaar_document_path or p.id_document_url),
            "has_resume_doc": bool(p.resume_document_path or p.skill_certificate_url),
            "has_profile_photo": bool(p.profile_photo_path),
            "rejection_reason": p.rejection_reason,
            "internal_verification_note": p.internal_verification_note,
            "submitted_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else None,
            "verified_at": p.verified_at.strftime("%Y-%m-%d %H:%M") if p.verified_at else None,
            "verified_by_admin": admin_name,
            "consent_given": p.consent_given,
            "consent_timestamp": p.consent_timestamp.strftime("%Y-%m-%d %H:%M") if p.consent_timestamp else None
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1
    }


@router.get("/verifications/{provider_id}")
def get_verification_application_detail(
    provider_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Retrieve exhaustive verification dossier for a single provider.
    Accessible only to authorized platform administrators.
    """
    p = (
        db.query(ProviderProfile)
        .options(
            selectinload(ProviderProfile.user),
            selectinload(ProviderProfile.verified_by_admin)
        )
        .filter(ProviderProfile.id == provider_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider application not found")

    admin_name = p.verified_by_admin.full_name if p.verified_by_admin else None

    return {
        "provider_id": str(p.id),
        "user_id": str(p.user_id),
        "full_name": p.user.full_name,
        "email": p.user.email,
        "phone": p.user.phone,
        "business_name": p.business_name,
        "organisation_name": p.organisation_name,
        "primary_skill": p.primary_skill or p.specializations or "General Services",
        "service_address": p.service_address or p.service_area,
        "city": p.city,
        "state": p.state or "Uttar Pradesh",
        "pincode": p.pincode or "202001",
        "latitude": p.latitude,
        "longitude": p.longitude,
        "experience_years": p.experience_years,
        "verification_status": p.verification_status,
        "masked_aadhaar": mask_aadhaar(p.aadhaar_last4),
        "aadhaar_last4": p.aadhaar_last4,
        "has_aadhaar_doc": bool(p.aadhaar_document_path or p.id_document_url),
        "has_resume_doc": bool(p.resume_document_path or p.skill_certificate_url),
        "has_profile_photo": bool(p.profile_photo_path),
        "rejection_reason": p.rejection_reason,
        "internal_verification_note": p.internal_verification_note,
        "submitted_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else None,
        "verified_at": p.verified_at.strftime("%Y-%m-%d %H:%M") if p.verified_at else None,
        "verified_by_admin": admin_name,
        "consent_given": p.consent_given,
        "consent_timestamp": p.consent_timestamp.strftime("%Y-%m-%d %H:%M") if p.consent_timestamp else None
    }


@router.get("/verifications/{provider_id}/reveal-aadhaar")
def reveal_provider_aadhaar(
    provider_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Secure admin-only endpoint: Decrypts and reveals the full 12-digit Aadhaar number
    for identity verification compliance. Logs access to the administrator audit trail.
    """
    p = (
        db.query(ProviderProfile)
        .options(selectinload(ProviderProfile.user))
        .filter(ProviderProfile.id == provider_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider application not found")

    decrypted = ""
    if p.aadhaar_number_encrypted:
        decrypted = decrypt_aadhaar(p.aadhaar_number_encrypted)
    elif p.aadhaar_last4:
        decrypted = f"XXXXXXXX{p.aadhaar_last4}"

    # Record secure audit log entry without leaking plain Aadhaar in log details
    db.add(AdminAuditLog(
        admin_id=current_user.id,
        action_type="ADMIN_VIEW_AADHAAR",
        target_entity="provider_profiles",
        target_id=p.id,
        details={
            "admin_email": current_user.email,
            "provider_name": p.user.full_name,
            "accessed_at": datetime.now(timezone.utc).isoformat()
        }
    ))
    db.commit()

    return {
        "provider_id": str(p.id),
        "full_name": p.user.full_name,
        "aadhaar_number": decrypted,
        "masked_aadhaar": mask_aadhaar(p.aadhaar_last4)
    }


@router.get("/verifications/{provider_id}/document/{doc_type}")
def get_verification_document(
    provider_id: uuid.UUID,
    doc_type: str,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Secure admin-only endpoint to inspect uploaded verification documents
    (Aadhaar image, resume, or profile photograph) with path-traversal prevention.
    """
    prov = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider application not found")

    if doc_type == "aadhaar":
        filename = prov.aadhaar_document_path
        if not filename:
            # Fallback for mock/seeded external URLs
            if prov.id_document_url:
                raise HTTPException(status_code=status.HTTP_307_TEMPORARY_REDIRECT, headers={"Location": prov.id_document_url})
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aadhaar document not found")
        file_path = get_private_document_path(filename)
    elif doc_type == "resume":
        filename = prov.resume_document_path
        if not filename:
            if prov.skill_certificate_url:
                raise HTTPException(status_code=status.HTTP_307_TEMPORARY_REDIRECT, headers={"Location": prov.skill_certificate_url})
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume document not found")
        file_path = get_private_document_path(filename)
    elif doc_type == "profile_photo":
        filename = prov.profile_photo_path
        if not filename:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile photograph not found")
        file_path = get_avatar_path(filename)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document type requested")

    headers = {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Content-Disposition": f"inline; filename={file_path.name}"
    }
    return FileResponse(file_path, headers=headers)


@router.post("/verifications/{provider_id}/decision")
def review_verification_application(
    provider_id: uuid.UUID,
    data: VerificationDecision,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Administrator approves or rejects a provider's verification dossier.
    Enforces mandatory rejection reason when rejecting. Dispatches email notifications
    and records an audit log entry.
    """
    prov = (
        db.query(ProviderProfile)
        .options(selectinload(ProviderProfile.user))
        .filter(ProviderProfile.id == provider_id)
        .first()
    )
    if not prov:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    # Enforce mandatory rejection reason before rejecting
    if data.action == "reject":
        if not data.rejection_reason or not data.rejection_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A mandatory rejection reason must be provided before rejecting an application."
            )
        rejection_reason_clean = data.rejection_reason.strip()

        # Update provider entity
        prov.verification_status = VerificationStatus.REJECTED
        prov.user.is_verified = False
        prov.rejection_reason = rejection_reason_clean
        prov.verified_at = datetime.now(timezone.utc)
        prov.verified_by_admin_id = current_user.id
        if data.internal_note:
            prov.internal_verification_note = data.internal_note.strip()

        # Dispatch rejection email notification with guidance on resubmission
        send_provider_rejection_email(db, prov, rejection_reason_clean)

        notif_msg = f"Your verification request was rejected. Reason: {rejection_reason_clean}"

    elif data.action == "approve":
        prov.verification_status = VerificationStatus.APPROVED
        prov.user.is_verified = True
        prov.rejection_reason = None
        prov.verified_at = datetime.now(timezone.utc)
        prov.verified_by_admin_id = current_user.id
        if data.internal_note:
            prov.internal_verification_note = data.internal_note.strip()

        # Dispatch approval email notification with dashboard link
        send_provider_approval_email(db, prov)

        notif_msg = "Congratulations! Your LocalFix provider verification application has been approved. You are now a Verified Professional."

    # Record Admin Audit Log without duplicating sensitive identity information
    db.add(AdminAuditLog(
        admin_id=current_user.id,
        action_type=f"PROVIDER_VERIFICATION_{data.action.upper()}",
        target_entity="provider_profiles",
        target_id=prov.id,
        details={
            "provider_name": prov.user.full_name,
            "business_name": prov.business_name,
            "decision": data.action,
            "has_rejection_reason": bool(data.rejection_reason),
            "internal_note_recorded": bool(data.internal_note)
        }
    ))

    # Notify provider internally
    db.add(Notification(
        user_id=prov.user_id,
        title="Verification Status Update",
        message=notif_msg,
        notification_type="verification_update",
        reference_type="provider",
        reference_id=prov.id
    ))

    db.commit()
    db.refresh(prov)

    return {
        "message": f"Provider verification successfully {data.action}d",
        "verification_status": prov.verification_status,
        "rejection_reason": prov.rejection_reason,
        "internal_verification_note": prov.internal_verification_note,
        "verified_at": prov.verified_at.strftime("%Y-%m-%d %H:%M") if prov.verified_at else None
    }


@router.get("/analytics")
def get_platform_analytics(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Calculate platform operational statistics and metrics from actual database records."""
    total_customers = db.query(func.count(CustomerProfile.id)).scalar() or 0
    total_providers = db.query(func.count(ProviderProfile.id)).scalar() or 0
    verified_providers = db.query(func.count(ProviderProfile.id)).filter(ProviderProfile.verification_status.in_([VerificationStatus.APPROVED, VerificationStatus.VERIFIED])).scalar() or 0
    pending_verifications = db.query(func.count(ProviderProfile.id)).filter(ProviderProfile.verification_status.in_([VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW])).scalar() or 0

    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    completed_bookings = db.query(func.count(Booking.id)).filter(Booking.current_status == BookingStatus.COMPLETED).scalar() or 0
    cancelled_bookings = db.query(func.count(Booking.id)).filter(Booking.current_status == BookingStatus.CANCELLED).scalar() or 0
    open_disputes = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.OPEN).scalar() or 0

    total_volume = (
        db.query(func.sum(Payment.amount))
        .filter(Payment.payment_status == PaymentStatus.COMPLETED)
        .scalar()
    ) or 0.0

    # Service Category Distribution
    categories = db.query(ServiceCategory).all()
    category_distribution = []
    for cat in categories:
        booking_count = (
            db.query(func.count(Booking.id))
            .join(Service, Booking.service_id == Service.id)
            .filter(Service.category_id == cat.id)
            .scalar()
        ) or 0
        category_distribution.append({
            "category_name": cat.name,
            "bookings": booking_count
        })

    # Recent Audit Activities
    recent_logs = (
        db.query(AdminAuditLog)
        .options(selectinload(AdminAuditLog.admin))
        .order_by(AdminAuditLog.created_at.desc())
        .limit(10)
        .all()
    )
    audit_trail = [
        {
            "id": str(log.id),
            "admin_name": log.admin.full_name if log.admin else "Admin",
            "action_type": log.action_type,
            "target_entity": log.target_entity,
            "details": log.details,
            "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for log in recent_logs
    ]

    return {
        "metrics": {
            "total_customers": total_customers,
            "total_providers": total_providers,
            "verified_providers": verified_providers,
            "pending_verifications": pending_verifications,
            "total_bookings": total_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "open_disputes": open_disputes,
            "total_revenue_inr": float(total_volume)
        },
        "category_distribution": category_distribution,
        "recent_audit_trail": audit_trail
    }


@router.get("/disputes")
def get_all_disputes(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Retrieve all open and reviewed platform disputes for administrative resolution."""
    complaints = (
        db.query(Complaint)
        .options(
            selectinload(Complaint.booking),
            selectinload(Complaint.filed_by)
        )
        .order_by(Complaint.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(c.id),
            "booking_id": str(c.booking_id),
            "booking_reference": c.booking.booking_reference if c.booking else "N/A",
            "filed_by": c.filed_by.full_name if c.filed_by else "User",
            "complaint_category": c.complaint_category,
            "description": c.description,
            "attachment_url": c.attachment_url,
            "status": c.status,
            "resolution_notes": c.resolution_notes,
            "resolved_at": c.resolved_at.strftime("%Y-%m-%d %H:%M") if c.resolved_at else None,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for c in complaints
    ]


@router.post("/disputes/{complaint_id}/resolve")
def resolve_dispute(
    complaint_id: uuid.UUID,
    data: DisputeResolution,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Admin resolves a dispute and records official resolution findings."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    complaint.status = ComplaintStatus.RESOLVED if data.action == "resolve" else ComplaintStatus.REJECTED
    complaint.resolution_notes = data.resolution_notes
    complaint.resolved_by_id = current_user.id
    complaint.resolved_at = datetime.now(timezone.utc)

    # Record Admin Audit Log
    db.add(AdminAuditLog(
        admin_id=current_user.id,
        action_type=f"DISPUTE_{data.action.upper()}",
        target_entity="complaints",
        target_id=complaint.id,
        details={
            "complaint_id": str(complaint.id),
            "booking_id": str(complaint.booking_id),
            "notes": data.resolution_notes
        }
    ))

    db.commit()
    return {
        "message": f"Dispute successfully {complaint.status.value}",
        "status": complaint.status
    }
