from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.enums import UserRole
from app.models.user import User, Address
from app.schemas.user import AddressCreate, AddressRead

router = APIRouter(prefix="/customers", tags=["Customers & Addresses"])


@router.get("/addresses", response_model=List[AddressRead])
def get_customer_addresses(
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Retrieve all saved service addresses for the authenticated customer."""
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return addresses


@router.post("/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_customer_address(
    data: AddressCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Add a new service address to the customer's profile."""
    # If set as default, reset previous default addresses
    if data.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": False})

    new_address = Address(
        user_id=current_user.id,
        label=data.label,
        street_address=data.street_address,
        locality=data.locality,
        city=data.city,
        state=data.state,
        postal_code=data.postal_code,
        latitude=data.latitude or 27.8974,
        longitude=data.longitude or 78.0880,
        is_default=data.is_default
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    """Delete a saved service address."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == current_user.id).first()
    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found or does not belong to you"
        )
    db.delete(addr)
    db.commit()
    return None
