import uuid
from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import PaymentMethod, PaymentStatus


class PaymentCheckoutRequest(BaseModel):
    booking_id: uuid.UUID
    payment_method: PaymentMethod = PaymentMethod.MOCK_UPI


class PaymentRead(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    transaction_reference: str
    amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
