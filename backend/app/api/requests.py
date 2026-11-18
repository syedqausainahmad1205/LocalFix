from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_role, get_current_active_user
from app.models.enums import UserRole, RequestStatus, VerificationStatus
from app.models.user import User, CustomerProfile, ProviderProfile, Address
from app.models.service import ServiceCategory, ProviderService, Service
from app.models.request_quote import ServiceRequest, Quotation
from app.schemas.request_quote import ServiceRequestCreate, ServiceRequestRead, QuotationRead

router = APIRouter(prefix="/requests", tags=["Service Requests"])


@router.post("", response_model=ServiceRequestRead, status_code=status.HTTP_201_CREATED)
def create_service_request(
    data: ServiceRequestCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Customer submits a new service request."""
    # Ensure customer profile exists
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer profile not found. Please update your profile first."
        )

    # Validate category
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == data.category_id, ServiceCategory.is_active == True).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service category does not exist or is inactive."
        )

    # Validate address ownership
    addr = db.query(Address).filter(Address.id == data.address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected address was not found in your saved addresses."
        )

    req = ServiceRequest(
        customer_id=cust_profile.id,
        category_id=cat.id,
        address_id=addr.id,
        title=data.title,
        description=data.description,
        preferred_date=data.preferred_date,
        preferred_time_slot=data.preferred_time_slot,
        image_url=data.image_url,
        status=RequestStatus.OPEN
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return ServiceRequestRead(
        id=req.id,
        customer_id=req.customer_id,
        customer_name=current_user.full_name,
        category_id=cat.id,
        category_name=cat.name,
        category_slug=cat.slug,
        address_id=addr.id,
        locality=addr.locality,
        city=addr.city,
        title=req.title,
        description=req.description,
        preferred_date=req.preferred_date,
        preferred_time_slot=req.preferred_time_slot,
        image_url=req.image_url,
        status=req.status,
        quotations_count=0,
        created_at=req.created_at,
        quotations=[]
    )


@router.get("/my", response_model=List[ServiceRequestRead])
def get_my_service_requests(
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Retrieve all service requests posted by the authenticated customer."""
    cust_profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if not cust_profile:
        return []

    requests = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.category),
            selectinload(ServiceRequest.address),
            selectinload(ServiceRequest.quotations).selectinload(Quotation.provider).selectinload(ProviderProfile.user)
        )
        .filter(ServiceRequest.customer_id == cust_profile.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    result = []
    for req in requests:
        quote_list = []
        for q in req.quotations:
            quote_list.append(QuotationRead(
                id=q.id,
                request_id=q.request_id,
                provider_id=q.provider_id,
                provider_name=q.provider.user.full_name if q.provider and q.provider.user else "Provider",
                business_name=q.provider.business_name if q.provider else None,
                provider_rating=q.provider.avg_rating if q.provider else 5.0,
                quoted_amount=q.quoted_amount,
                work_description=q.work_description,
                estimated_duration_hours=q.estimated_duration_hours,
                proposed_date=q.proposed_date,
                proposed_time_slot=q.proposed_time_slot,
                additional_terms=q.additional_terms,
                status=q.status,
                created_at=q.created_at
            ))

        result.append(ServiceRequestRead(
            id=req.id,
            customer_id=req.customer_id,
            customer_name=current_user.full_name,
            category_id=req.category.id,
            category_name=req.category.name,
            category_slug=req.category.slug,
            address_id=req.address.id,
            locality=req.address.locality,
            city=req.address.city,
            title=req.title,
            description=req.description,
            preferred_date=req.preferred_date,
            preferred_time_slot=req.preferred_time_slot,
            image_url=req.image_url,
            status=req.status,
            quotations_count=len(req.quotations),
            created_at=req.created_at,
            quotations=quote_list
        ))

    return result


@router.get("/available", response_model=List[ServiceRequestRead])
def get_available_requests_for_provider(
    current_user: User = Depends(require_role([UserRole.PROVIDER])),
    db: Session = Depends(get_db)
):
    """
    Allow verified providers to view open requests matching the categories
    of services they offer in their service area.
    """
    prov_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not prov_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provider profile not found")

    if prov_profile.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your profile is not verified yet. Verification is required before submitting quotations."
        )

    # Get distinct category IDs offered by this provider
    category_ids = (
        db.query(Service.category_id)
        .join(ProviderService, ProviderService.service_id == Service.id)
        .filter(ProviderService.provider_id == prov_profile.id, ProviderService.is_active == True)
        .distinct()
        .all()
    )
    cat_id_list = [c[0] for c in category_ids]

    open_requests = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.category),
            selectinload(ServiceRequest.address),
            selectinload(ServiceRequest.customer).selectinload(CustomerProfile.user),
            selectinload(ServiceRequest.quotations)
        )
        .filter(
            ServiceRequest.status.in_([RequestStatus.OPEN, RequestStatus.QUOTED]),
            ServiceRequest.category_id.in_(cat_id_list)
        )
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )

    result = []
    for req in open_requests:
        # Check if this provider has already submitted a quote
        has_quoted = any(q.provider_id == prov_profile.id for q in req.quotations)

        result.append(ServiceRequestRead(
            id=req.id,
            customer_id=req.customer_id,
            customer_name=req.customer.user.full_name if req.customer and req.customer.user else "Customer",
            category_id=req.category.id,
            category_name=req.category.name,
            category_slug=req.category.slug,
            address_id=req.address.id,
            locality=req.address.locality,
            city=req.address.city,
            title=req.title,
            description=req.description,
            preferred_date=req.preferred_date,
            preferred_time_slot=req.preferred_time_slot,
            image_url=req.image_url,
            status=req.status,
            quotations_count=len(req.quotations),
            created_at=req.created_at,
            quotations=[]
        ))

    return result
