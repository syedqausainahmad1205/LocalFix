# LocalFix — Database Design & Entity-Relationship Specification
**Database Engine:** PostgreSQL 16  
**ORM:** SQLAlchemy 2.0  
**Migration Tool:** Alembic

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o| CUSTOMER_PROFILES : "has"
    USERS ||--o| PROVIDER_PROFILES : "has"
    USERS ||--o{ ADDRESSES : "owns"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ADMIN_AUDIT_LOGS : "performs"

    SERVICE_CATEGORIES ||--o{ SERVICES : "categorizes"
    PROVIDER_PROFILES ||--o{ PROVIDER_SERVICES : "offers"
    SERVICES ||--o{ PROVIDER_SERVICES : "is offered in"
    PROVIDER_PROFILES ||--o{ PROVIDER_AVAILABILITY : "defines"
    PROVIDER_PROFILES ||--o| PROVIDER_VERIFICATIONS : "undergoes"

    CUSTOMER_PROFILES ||--o{ SERVICE_REQUESTS : "creates"
    SERVICE_CATEGORIES ||--o{ SERVICE_REQUESTS : "pertains to"
    ADDRESSES ||--o{ SERVICE_REQUESTS : "located at"

    SERVICE_REQUESTS ||--o{ QUOTATIONS : "receives"
    PROVIDER_PROFILES ||--o{ QUOTATIONS : "submits"

    CUSTOMER_PROFILES ||--o{ BOOKINGS : "books"
    PROVIDER_PROFILES ||--o{ BOOKINGS : "serviced by"
    SERVICES ||--o{ BOOKINGS : "involves"
    QUOTATIONS ||--o| BOOKINGS : "originates from"
    ADDRESSES ||--o{ BOOKINGS : "performed at"

    BOOKINGS ||--o{ BOOKING_STATUS_HISTORY : "tracks"
    BOOKINGS ||--o| CONVERSATIONS : "has"
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    USERS ||--o{ MESSAGES : "sends"

    BOOKINGS ||--o| PAYMENTS : "generates"
    BOOKINGS ||--o| REVIEWS : "evaluated by"
    BOOKINGS ||--o{ COMPLAINTS : "disputed in"
    USERS ||--o{ COMPLAINTS : "files"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string phone UK
        enum role "customer | provider | admin"
        boolean is_active
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMER_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        string preferred_locality
        string avatar_url
        timestamp created_at
    }

    PROVIDER_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        string business_name
        text bio
        int experience_years
        string service_area
        float latitude
        float longitude
        float search_radius_km
        enum verification_status "pending | under_review | verified | rejected"
        string id_document_url
        string skill_certificate_url
        text rejection_reason
        float avg_rating
        int total_reviews
        int completed_jobs_count
        boolean is_available
        timestamp created_at
        timestamp updated_at
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        string label
        string street_address
        string locality
        string city
        string state
        string postal_code
        float latitude
        float longitude
        boolean is_default
        timestamp created_at
    }

    SERVICE_CATEGORIES {
        uuid id PK
        string name UK
        string slug UK
        text description
        string icon_name
        boolean is_active
        int display_order
        timestamp created_at
    }

    SERVICES {
        uuid id PK
        uuid category_id FK
        string name
        text description
        numeric base_price
        enum pricing_type "fixed | quotation"
        int estimated_duration_mins
        boolean is_active
        timestamp created_at
    }

    PROVIDER_SERVICES {
        uuid id PK
        uuid provider_id FK
        uuid service_id FK
        numeric custom_price
        boolean is_active
        timestamp created_at
    }

    PROVIDER_AVAILABILITY {
        uuid id PK
        uuid provider_id FK
        int day_of_week "0=Mon, 6=Sun"
        time start_time
        time end_time
        boolean is_active
    }

    SERVICE_REQUESTS {
        uuid id PK
        uuid customer_id FK
        uuid category_id FK
        uuid address_id FK
        string title
        text description
        date preferred_date
        string preferred_time_slot
        string image_url
        enum status "open | quoted | booked | cancelled | expired"
        timestamp created_at
        timestamp updated_at
    }

    QUOTATIONS {
        uuid id PK
        uuid request_id FK
        uuid provider_id FK
        numeric quoted_amount
        text work_description
        float estimated_duration_hours
        date proposed_date
        string proposed_time_slot
        text additional_terms
        enum status "submitted | accepted | rejected | withdrawn"
        timestamp created_at
        timestamp updated_at
    }

    BOOKINGS {
        uuid id PK
        string booking_reference UK
        uuid customer_id FK
        uuid provider_id FK
        uuid service_id FK
        uuid quotation_id FK
        uuid address_id FK
        date scheduled_date
        string scheduled_time_slot
        numeric total_amount
        enum current_status "requested | accepted | confirmed | on_the_way | in_progress | completed | cancelled | disputed"
        text cancellation_reason
        text special_instructions
        timestamp created_at
        timestamp updated_at
    }

    BOOKING_STATUS_HISTORY {
        uuid id PK
        uuid booking_id FK
        enum previous_status
        enum new_status
        uuid changed_by_user_id FK
        text change_notes
        timestamp created_at
    }

    CONVERSATIONS {
        uuid id PK
        uuid booking_id FK,UK
        uuid customer_id FK
        uuid provider_id FK
        timestamp created_at
        timestamp updated_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text content
        boolean is_read
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string title
        text message
        string notification_type
        string reference_type
        uuid reference_id
        boolean is_read
        timestamp created_at
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK,UK
        uuid customer_id FK
        uuid provider_id FK
        string transaction_reference UK
        numeric amount
        enum payment_method "cash_on_delivery | mock_upi | mock_card"
        enum payment_status "pending | completed | failed | refunded"
        timestamp paid_at
        timestamp created_at
    }

    REVIEWS {
        uuid id PK
        uuid booking_id FK,UK
        uuid customer_id FK
        uuid provider_id FK
        int rating "1 to 5"
        text comment
        boolean is_public
        timestamp created_at
    }

    COMPLAINTS {
        uuid id PK
        uuid booking_id FK
        uuid filed_by_id FK
        string complaint_category
        text description
        string attachment_url
        enum status "open | under_review | resolved | rejected"
        text resolution_notes
        uuid resolved_by_id FK
        timestamp resolved_at
        timestamp created_at
    }

    ADMIN_AUDIT_LOGS {
        uuid id PK
        uuid admin_id FK
        string action_type
        string target_entity
        uuid target_id
        json details
        string ip_address
        timestamp created_at
    }
```

---

## 2. Booking State Machine Transitions

| From Status | Permitted To Status | Authorized Actor | Action / Trigger |
| :--- | :--- | :--- | :--- |
| `requested` | `accepted` | Provider | Provider agrees to customer request |
| `requested` | `cancelled` | Customer / Provider | Cancellation before acceptance |
| `accepted` | `confirmed` | Customer / System | Customer confirms date/schedule or payment |
| `accepted` | `cancelled` | Customer / Provider | Cancellation prior to final confirmation |
| `confirmed` | `on_the_way` | Provider | Provider departs for customer location |
| `confirmed` | `cancelled` | Customer / Provider | Late cancellation with reason |
| `on_the_way` | `in_progress` | Provider | Provider arrives and begins work |
| `in_progress` | `completed` | Provider | Provider finishes work |
| `in_progress` | `disputed` | Customer / Provider | Work stoppage, disagreement, damage |
| `completed` | `disputed` | Customer | Unsatisfactory work / billing dispute |
| `disputed` | `resolved` / `rejected` | Admin | Administrative dispute resolution |

---

## 3. Database Indexes for Performance

1. `users(email)`: Unique index for fast login query.
2. `provider_profiles(latitude, longitude)`: B-tree spatial index for fast distance calculations.
3. `provider_profiles(verification_status, is_available)`: Filter index for marketplace listings.
4. `bookings(customer_id, current_status)` and `bookings(provider_id, current_status)`: Compound indexes for active dashboard booking queries.
5. `bookings(booking_reference)`: Unique index for quick lookup.
6. `messages(conversation_id, created_at)`: Chronological ordering for chat history.
7. `notifications(user_id, is_read)`: Fast unread notification badge counts.
8. `reviews(provider_id)`: Aggregate rating calculations.
