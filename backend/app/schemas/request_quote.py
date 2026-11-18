import uuid
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import RequestStatus, QuotationStatus


class ServiceRequestCreate(BaseModel):
    category_id: uuid.UUID
    address_id: uuid.UUID
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    preferred_date: date
    preferred_time_slot: str = "10:00 AM - 01:00 PM"
    image_url: Optional[str] = None


class QuotationCreate(BaseModel):
    request_id: uuid.UUID
    quoted_amount: Decimal = Field(..., gt=0)
    work_description: str = Field(..., min_length=10)
    estimated_duration_hours: float = Field(default=1.5, gt=0)
    proposed_date: date
    proposed_time_slot: str = "10:00 AM - 01:00 PM"
    additional_terms: Optional[str] = None


class QuotationRead(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    provider_id: uuid.UUID
    provider_name: str
    business_name: Optional[str] = None
    provider_rating: float
    quoted_amount: Decimal
    work_description: str
    estimated_duration_hours: float
    proposed_date: date
    proposed_time_slot: str
    additional_terms: Optional[str] = None
    status: QuotationStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestRead(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    category_id: uuid.UUID
    category_name: str
    category_slug: str
    address_id: uuid.UUID
    locality: str
    city: str
    title: str
    description: str
    preferred_date: date
    preferred_time_slot: str
    image_url: Optional[str] = None
    status: RequestStatus
    quotations_count: int = 0
    created_at: datetime
    quotations: List[QuotationRead] = []

    model_config = ConfigDict(from_attributes=True)
