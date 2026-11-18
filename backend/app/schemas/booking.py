import uuid
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus


class BookingCreateDirect(BaseModel):
    service_id: uuid.UUID
    provider_id: uuid.UUID
    address_id: Optional[uuid.UUID] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    scheduled_date: date
    scheduled_time_slot: str = "10:00 AM - 01:00 PM"
    special_instructions: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    new_status: BookingStatus
    change_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingHistoryItem(BaseModel):
    id: uuid.UUID
    previous_status: Optional[BookingStatus] = None
    new_status: BookingStatus
    changed_by_name: str
    change_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentSummary(BaseModel):
    id: uuid.UUID
    transaction_reference: str
    amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    paid_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class BookingRead(BaseModel):
    id: uuid.UUID
    booking_reference: str
    customer_id: uuid.UUID
    customer_name: str
    customer_phone: Optional[str] = None
    provider_id: uuid.UUID
    provider_name: str
    provider_business: Optional[str] = None
    provider_phone: Optional[str] = None
    service_id: Optional[uuid.UUID] = None
    service_name: Optional[str] = None
    address_id: uuid.UUID
    street_address: str
    locality: str
    city: str
    scheduled_date: date
    scheduled_time_slot: str
    total_amount: Decimal
    current_status: BookingStatus
    cancellation_reason: Optional[str] = None
    special_instructions: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[BookingHistoryItem] = []
    payment: Optional[PaymentSummary] = None

    model_config = ConfigDict(from_attributes=True)
