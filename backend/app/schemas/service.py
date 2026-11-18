import uuid
from typing import Optional, List
from datetime import time
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.models.enums import PricingType


class ServiceRead(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    description: Optional[str] = None
    base_price: Decimal
    pricing_type: PricingType
    estimated_duration_mins: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ServiceCategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon_name: str
    is_active: bool
    display_order: int
    services: List[ServiceRead] = []

    model_config = ConfigDict(from_attributes=True)


class ProviderServiceRead(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID
    service_id: uuid.UUID
    custom_price: Optional[Decimal] = None
    is_active: bool
    service: Optional[ServiceRead] = None

    model_config = ConfigDict(from_attributes=True)


class ProviderAvailabilityRead(BaseModel):
    id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
