import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    PROVIDER = "provider"
    ADMIN = "admin"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    VERIFIED = "verified"
    REJECTED = "rejected"


class PricingType(str, enum.Enum):
    FIXED = "fixed"
    QUOTATION = "quotation"


class RequestStatus(str, enum.Enum):
    OPEN = "open"
    QUOTED = "quoted"
    BOOKED = "booked"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class QuotationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class BookingStatus(str, enum.Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    CONFIRMED = "confirmed"
    ON_THE_WAY = "on_the_way"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class PaymentMethod(str, enum.Enum):
    CASH_ON_SERVICE = "cash_on_service"
    MOCK_UPI = "mock_upi"
    MOCK_CARD = "mock_card"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class ComplaintStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"
