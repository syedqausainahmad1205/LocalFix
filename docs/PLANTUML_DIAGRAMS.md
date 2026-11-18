# LocalFix — PlantUML Diagram Specifications
**Document Reference:** LF-PUML-2026-V2.4  
**Standard:** PlantUML (Compatible with PlantUML Server, VS Code PlantUML Extension, IntelliJ & PlantText)  
**Academic Affiliation:** Master of Computer Applications (MCA), Department of Computer Science, Aligarh Muslim University (AMU)  

This document contains the complete, compilable **PlantUML source code** for all system diagrams specified in the LocalFix Software Requirements Specification (SRS).

---

## TABLE OF CONTENTS
1. [Data Flow Diagrams (DFD)](#1-data-flow-diagrams-dfd)
   - 1.1 DFD Level 0 (Context Diagram)
   - 1.2 DFD Level 1 (Top-Level System Decomposition)
   - 1.3 DFD Level 2.1 (Provider Registration & KYC Verification)
   - 1.4 DFD Level 2.2 (Spatial Proximity Discovery & Quotation)
   - 1.5 DFD Level 2.3 (Direct Booking & Service Execution)
   - 1.6 DFD Level 2.4 (Escrow Payment & Automated Invoicing)
   - 1.7 DFD Level 2.5 (Dispute Redressal & Redressal Audit)
2. [Use Case Diagrams](#2-use-case-diagrams)
   - 2.1 Master System Use Case Diagram
   - 2.2 Subsystem Specializations & Includes/Extends
3. [Entity-Relationship (ER) Diagram](#3-entity-relationship-er-diagram)
4. [UML Class Diagram](#4-uml-class-diagram)
5. [Activity Diagrams](#5-activity-diagrams)
   - 5.1 Activity 1: Provider Onboarding & Admin KYC Inspection
   - 5.2 Activity 2: Customer Discovery, Direct Booking & Escrow Settlement
   - 5.3 Activity 3: Fast-Track Dispute Redressal & Instant Refund
6. [Sequence Diagrams](#6-sequence-diagrams)
   - 6.1 Sequence 1: Customer Booking, Provider Lifecycle & Completion
   - 6.2 Sequence 2: Provider KYC Submission, Aadhaar Review & Admin Decision
   - 6.3 Sequence 3: Payment Checkout, Escrow Holding & Tax Invoicing
7. [State Machine Diagrams](#7-state-machine-diagrams)
   - 7.1 State 1: Booking Lifecycle States
   - 7.2 State 2: Provider Verification Status States
   - 7.3 State 3: Dispute Resolution States
8. [Component & Deployment Architecture Diagram](#8-component--deployment-architecture-diagram)

---

## 1. DATA FLOW DIAGRAMS (DFD)

### 1.1 DFD Level 0 (Context Diagram)
```plantuml
@startuml DFD_Level_0_Context
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 10
skinparam arrowThickness 1.5
skinparam arrowColor #1E293B

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #EFF6FF
    BorderColor #2563EB
    FontColor #1E3A8A
    FontStyle bold
}

rectangle "👤 Customer" as Cust
rectangle "🛠️ Service Provider" as Prov
rectangle "🛡️ Platform Administrator" as Admin
rectangle "💳 Payment Gateway / Escrow" as Bank

usecase "0.0\nLocalFix System\nVerified Local Marketplace\n& Proximity Discovery Engine" as System

Cust -down-> System : 1. Registration, Coordinates,\nSearch Query, Direct Booking,\nChat Messages, Complaints
System -up-> Cust : 2. Verified Providers (<10km),\nReal-Time Booking Status,\nIn-App Chat, Tax Invoices, Refunds

Prov -down-> System : 3. Professional Profile, Aadhaar Last-4,\nKYC Docs, Tutor Delivery Mode,\nJob Quotes, Transit Status Updates
System -up-> Prov : 4. Local Booking Requests, Customer Quotes,\nAdmin KYC Approval/Rejection Notice,\nJob Payout Settlements

Admin -down-> System : 5. KYC Approval/Rejection Decisions,\nMandatory Rejection Reasons,\nArbitration Directives, Category Config
System -up-> Admin : 6. Pending KYC Applications Dossiers,\nEncrypted Identity Assets,\nPlatform Audit Logs & Metrics

System -right-> Bank : 7. Payment Authorization,\nEscrow Lock Request, Refund Triggers
Bank -left-> System : 8. Payment Authorization Tokens,\nEscrow Settlement Acknowledgment

@enduml
```

---

### 1.2 DFD Level 1 (Top-Level System Decomposition)
```plantuml
@startuml DFD_Level_1_Decomposition
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 10
skinparam arrowThickness 1.5
skinparam arrowColor #1E293B

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #EFF6FF
    BorderColor #3B82F6
    FontColor #1E3A8A
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
    FontStyle bold
}

' External Entities
rectangle "👤 Customer" as Cust
rectangle "🛠️ Provider" as Prov
rectangle "🛡️ Administrator" as Admin

' Processes
usecase "1.0\nAuth, Identity &\nKYC Verification" as P1
usecase "2.0\nSpatial Discovery\n& Autocomplete" as P2
usecase "3.0\nService Quoting\n& Bidding" as P3
usecase "4.0\nDirect Booking &\nLifecycle Engine" as P4
usecase "5.0\nReal-Time Chat &\nNotifications" as P5
usecase "6.0\nEscrow Payments\n& Invoicing" as P6
usecase "7.0\nVerified Reviews &\nDispute Redressal" as P7

' Data Stores
database "D1: Users & Profiles" as D1
database "D2: Document Vault" as D2
database "D3: Services Catalog" as D3
database "D4: Requests & Quotes" as D4
database "D5: Bookings & Tracking" as D5
database "D6: Payments & Invoices" as D6
database "D7: Reviews & Disputes" as D7

' Data Flows Process 1.0
Cust --> P1 : Customer Credentials
Prov --> P1 : Application, Aadhaar Last-4,\nKYC Docs, Tutor Mode
Admin --> P1 : KYC Decisions (Approve/Reject)
P1 <--> D1 : Read / Write Users & Profiles
P1 --> D2 : Save Quarantined KYC Files
P1 --> Admin : Stream Pending KYC Dossiers

' Data Flows Process 2.0
Cust --> P2 : Search Input (Fuzzy), GPS Lat/Lon,\nTrade Filter, Tutor Mode
P2 <--> D1 : Query Verified Providers (<10km)
P2 <--> D3 : Query Catalog Categories
P2 --> Cust : Filtered Proximity Results

' Data Flows Process 3.0
Cust --> P3 : Post Custom Repair Request
P3 --> D4 : Store Problem Request
D4 --> Prov : Notify Nearby Tradesmen
Prov --> P3 : Submit Quotation Bid
P3 --> D4 : Store Quotation Terms
P3 --> Cust : Display Quotations for Acceptance

' Data Flows Process 4.0
Cust --> P4 : Select Service, Slot, Delivery Address
P4 <--> D5 : Create & Track Booking
Prov --> P4 : Update Status (On Way/In Progress/Done)
P4 --> Cust : Real-Time Status Alerts

' Data Flows Process 5.0
Cust <--> P5 : Exchange Chat Messages
Prov <--> P5 : Exchange Chat Messages
P5 <--> D5 : Persist Channel Messages

' Data Flows Process 6.0
Cust --> P6 : Authorize Payment (UPI/Card/COD)
P6 <--> D6 : Hold/Release Escrow Funds
P6 --> Cust : Itemized 18% GST Invoice
P6 --> Prov : Disburse Job Payout

' Data Flows Process 7.0
Cust --> P7 : Submit Star Rating & Review
Cust --> P7 : Raise Service Complaint (Fast-Track)
P7 <--> D7 : Store Verified Reviews & Complaints
P7 <--> D1 : Recalculate Provider Avg Rating
Admin <--> P7 : Audit Dispute Ledger & Manual Mediation

@enduml
```

---

### 1.3 DFD Level 2.1 (Provider Registration & KYC Verification)
```plantuml
@startuml DFD_Level_2_1_KYC
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam arrowThickness 1.5

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #ECFDF5
    BorderColor #059669
    FontColor #064E3B
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
}

rectangle "🛠️ Provider Applicant" as Prov
rectangle "🛡️ Administrator" as Admin
database "D1: Provider Profiles" as D1
database "D2: Document Vault" as D2
database "D8: Admin Audit Logs" as D8

usecase "1.1\nValidate Registration &\nAadhaar Masking" as P1_1
usecase "1.2\nIngest & Quarantine\nIdentity Assets" as P1_2
usecase "1.3\nServe Inspection Queue\n& Document Stream" as P1_3
usecase "1.4\nProcess Verification\nDecision & Audit" as P1_4

Prov --> P1_1 : 1. Personal Details, Address, GPS,\nPrimary Skill, Aadhaar Last-4
P1_1 --> D1 : 2. Check Duplication / Email Collision
P1_1 --> P1_2 : 3. Pass Validated Data & Files
P1_2 --> D2 : 4. Store Quarantined Aadhaar & Photos
P1_2 --> D1 : 5. Create Profile (status='pending')

Admin --> P1_3 : 6. Request Pending KYC Applications
D1 --> P1_3 : 7. Fetch Pending Metadata
D2 --> P1_3 : 8. Stream Binary Document Stream
P1_3 --> Admin : 9. Render KYC Dossier for Verification

Admin --> P1_4 : 10. Submit Action: APPROVE / REJECT\n(Mandatory rejection_reason if rejected)
P1_4 --> D1 : 11. Update verification_status & Timestamp
P1_4 --> D8 : 12. Write Immutable Admin Audit Log
P1_4 --> Prov : 13. Dispatch Email Decision Notification

@enduml
```

---

### 1.4 DFD Level 2.2 (Spatial Proximity Discovery & Quotation)
```plantuml
@startuml DFD_Level_2_2_Discovery
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam arrowThickness 1.5

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #F0FDF4
    BorderColor #16A34A
    FontColor #14532D
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
}

rectangle "👤 Customer" as Cust
rectangle "🛠️ Provider" as Prov
database "D1: Provider Profiles" as D1
database "D3: Catalog Services" as D3
database "D4: Requests & Quotes" as D4

usecase "2.1\nFuzzy Levenshtein\nAutocomplete Engine" as P2_1
usecase "2.2\nSpatial Boundary &\nHaversine Filter" as P2_2
usecase "2.3\nProximity & Rating\nRanker (Max 10km)" as P2_3
usecase "3.1\nCustom Request\nIngestion & Dispatch" as P3_1
usecase "3.2\nQuotation Bid\nSubmission & Acceptance" as P3_2

Cust --> P2_1 : 1. Typed Characters (e.g. 'electrisian', 'tutur')
P2_1 --> Cust : 2. Instant Spelling-Tolerant Suggestions

Cust --> P2_2 : 3. Search: GPS (lat, lon), Category, Tutor Mode
D1 --> P2_2 : 4. Read APPROVED Providers Only
P2_2 --> P2_3 : 5. Filter Records where d <= 10.0 km
P2_3 --> Cust : 6. Return Ranked Providers (Distance ASC, Rating DESC)

Cust --> P3_1 : 7. Post Problem Statement with Photos
P3_1 --> D4 : 8. Save Service Request Record
D4 --> Prov : 9. Notify Providers in Service Locality
Prov --> P3_2 : 10. Submit Competitive Quotation
P3_2 --> D4 : 11. Store Quotation Record
P3_2 --> Cust : 12. Present Quotes for Acceptance

@enduml
```

---

### 1.5 DFD Level 2.3 (Direct Booking & Service Execution)
```plantuml
@startuml DFD_Level_2_3_Booking
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam arrowThickness 1.5

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #EFF6FF
    BorderColor #2563EB
    FontColor #1E3A8A
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
}

rectangle "👤 Customer" as Cust
rectangle "🛠️ Provider" as Prov
database "D1: Addresses" as D1
database "D3: Catalog" as D3
database "D5: Bookings & Tracking" as D5

usecase "4.1\nDirect Booking\nValidator & Order Init" as P4_1
usecase "4.2\nProvider Job\nAcceptance Handler" as P4_2
usecase "4.3\nTransit & Arrival\nLifecycle Tracker" as P4_3
usecase "4.4\nJob Execution &\nCompletion Verifier" as P4_4

Cust --> P4_1 : 1. Select Service, Date, Slot, Address
D1 --> P4_1 : 2. Validate Customer Address
D3 --> P4_1 : 3. Fetch Standard Base Price
P4_1 --> D5 : 4. Create Booking (Ref: BK-XXXX, Status: REQUESTED)
P4_1 --> Prov : 5. Dispatch Real-Time Job Alert

Prov --> P4_2 : 6. Action: ACCEPT_BOOKING
P4_2 --> D5 : 7. Transition to ACCEPTED
P4_2 --> Cust : 8. Send Scheduled Confirmation Alert

Prov --> P4_3 : 9. Action: MARK_ON_THE_WAY
P4_3 --> D5 : 10. Transition to ON_THE_WAY (Log Timestamp)
P4_3 --> Cust : 11. Dispatch Transit Alert

Prov --> P4_4 : 12. Action: ARRIVED_AND_START_WORK
P4_4 --> D5 : 13. Transition to IN_PROGRESS

Prov --> P4_4 : 14. Action: MARK_JOB_COMPLETED
P4_4 --> D5 : 15. Transition to COMPLETED
P4_4 --> Cust : 16. Trigger Review & Invoice Prompts

@enduml
```

---

### 1.6 DFD Level 2.4 (Escrow Payment & Automated Invoicing)
```plantuml
@startuml DFD_Level_2_4_Payments
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam arrowThickness 1.5

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #F5F3FF
    BorderColor #7C3AED
    FontColor #4C1D95
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
}

rectangle "👤 Customer" as Cust
rectangle "🛠️ Provider" as Prov
database "D5: Bookings" as D5
database "D6: Payments & Invoices" as D6

usecase "6.1\nPayment Gateway\nAuthorization" as P6_1
usecase "6.2\nEscrow Holding\nManager" as P6_2
usecase "6.3\nSettlement &\nPayout Engine" as P6_3
usecase "6.4\nItemized Tax\nInvoice Generator" as P6_4

Cust --> P6_1 : 1. Select Payment Method (UPI/Card/Netbanking/Cash)
D5 --> P6_1 : 2. Read Booking Total (total_amount)
P6_1 --> P6_2 : 3. Pass Authorized Payment
P6_2 --> D6 : 4. Lock Funds (payment_status='held_in_escrow')
P6_2 --> Cust : 5. Confirm Booking with Buyer Protection

D5 --> P6_3 : 6. Booking Status Transition to COMPLETED
P6_3 --> D6 : 7. Disburse Escrow Funds (Status: RELEASED)
P6_3 --> Prov : 8. Credit Provider Net Balance (Deduct 10% Fee)

P6_3 --> P6_4 : 9. Trigger Invoice Generation
P6_4 --> P6_4 : 10. Calculate 18% GST (9% CGST + 9% SGST)
P6_4 --> D6 : 11. Save Tax Invoice Document Record
P6_4 --> Cust : 12. Render Printable Tax Invoice & PDF Download

@enduml
```

---

### 1.7 DFD Level 2.5 (Dispute Redressal & Redressal Audit)
```plantuml
@startuml DFD_Level_2_5_Disputes
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam arrowThickness 1.5

skinparam rectangle {
    BackgroundColor #F8FAFC
    BorderColor #475569
    FontColor #0F172A
    FontStyle bold
}

skinparam usecase {
    BackgroundColor #FFF1F2
    BorderColor #E11D48
    FontColor #881337
}

skinparam database {
    BackgroundColor #FEF3C7
    BorderColor #D97706
    FontColor #78350F
}

rectangle "👤 Customer" as Cust
rectangle "🛡️ Administrator" as Admin
database "D5: Bookings" as D5
database "D6: Payments Ledger" as D6
database "D7: Complaints" as D7
database "D8: Audit Logs" as D8

usecase "7.1\nComplaint Intake\n& Eligibility Check" as P7_1
usecase "7.2\nFast-Track Auto\nResolution Engine" as P7_2
usecase "7.3\nSenior Admin\nArbitration Queue" as P7_3
usecase "7.4\nCompensation &\nResolution Closure" as P7_4

Cust --> P7_1 : 1. Select Issue, Description, Fast-Track Check
D5 --> P7_1 : 2. Validate Completed Booking Ref
P7_1 --> D7 : 3. Store Complaint (Status: OPEN)

P7_1 --> P7_2 : 4. If Standard Issue & Auto-Resolve Checked
P7_2 --> D6 : 5. Trigger Instant Ledger Refund (<5 seconds)
P7_2 --> D7 : 6. Update Status to RESOLVED
P7_2 --> Cust : 7. Instant Refund Confirmation

P7_1 --> P7_3 : 8. If High Complexity / Contested Damage
Admin --> P7_3 : 9. Review Chat Logs, Booking History, Photos
Admin --> P7_4 : 10. Submit Manual Arbitration Decision
P7_4 --> D7 : 11. Finalize Complaint Status
P7_4 --> D8 : 12. Write Administrative Audit Trail
P7_4 --> Cust : 13. Resolution Notification to Customer

@enduml
```

---

## 2. USE CASE DIAGRAMS

### 2.1 Master System Use Case Diagram
```plantuml
@startuml Master_Use_Case
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam arrowThickness 1.2
skinparam packageStyle rectangle

actor "👤 Customer" as Cust
actor "🛠️ Service Provider" as Prov
actor "🛡️ Platform Administrator" as Admin
actor "💳 Payment Gateway" as Gateway

package "LocalFix Platform System Boundary" {
    
    package "1. Authentication & Profile Security" {
        usecase "UC-1.1: Register as Customer" as UC_RegCust
        usecase "UC-1.2: Register as Verified Provider" as UC_RegProv
        usecase "UC-1.3: Login with JWT Credentials" as UC_Login
        usecase "UC-1.4: Manage Saved Delivery Addresses" as UC_Addresses
    }

    package "2. Search, Discovery & Spatial Proximity" {
        usecase "UC-2.1: Autocomplete Search (Fuzzy Spelled)" as UC_FuzzySearch
        usecase "UC-2.2: Discover Verified Providers (<10km)" as UC_Spatial
        usecase "UC-2.3: Filter Tutors by Mode (Online/Offline)" as UC_Tutors
        usecase "UC-2.4: View Verified Provider Dossier" as UC_ViewProfile
    }

    package "3. Custom Quotes, Direct Booking & Tracking" {
        usecase "UC-3.1: Post Custom Repair Problem" as UC_PostProblem
        usecase "UC-3.2: Submit Quotation Bid" as UC_BidQuote
        usecase "UC-3.3: Direct Book Catalog Service" as UC_DirectBook
        usecase "UC-3.4: Manage Job Transit Status (On Way/Done)" as UC_UpdateStatus
        usecase "UC-3.5: Real-Time GPS Tracking Map" as UC_TrackingMap
    }

    package "4. Financial Escrow, Invoicing & Redressal" {
        usecase "UC-4.1: Authorize Payment into Escrow" as UC_EscrowPay
        usecase "UC-4.2: Download Printable GST Invoice" as UC_Invoice
        usecase "UC-4.3: Submit Verified Review (No Self-Rating)" as UC_Review
        usecase "UC-4.4: File Fast-Track Complaint / Refund" as UC_Dispute
    }

    package "5. Governance, Regulatory KYC & Audit" {
        usecase "UC-5.1: Review Pending KYC & Aadhaar Last-4" as UC_ReviewKYC
        usecase "UC-5.2: Approve Provider Profile" as UC_ApproveKYC
        usecase "UC-5.3: Reject KYC with Mandatory Reason" as UC_RejectKYC
        usecase "UC-5.4: Inspect Security Audit Logs" as UC_AuditLogs
    }
}

' Customer Connections
Cust --> UC_RegCust
Cust --> UC_Login
Cust --> UC_Addresses
Cust --> UC_FuzzySearch
Cust --> UC_Spatial
Cust --> UC_Tutors
Cust --> UC_ViewProfile
Cust --> UC_PostProblem
Cust --> UC_DirectBook
Cust --> UC_TrackingMap
Cust --> UC_EscrowPay
Cust --> UC_Invoice
Cust --> UC_Review
Cust --> UC_Dispute

' Provider Connections
Prov --> UC_RegProv
Prov --> UC_Login
Prov --> UC_BidQuote
Prov --> UC_UpdateStatus
Prov --> UC_Invoice

' Admin Connections
Admin --> UC_Login
Admin --> UC_ReviewKYC
Admin --> UC_ApproveKYC
Admin --> UC_RejectKYC
Admin --> UC_AuditLogs

' Gateway
UC_EscrowPay --> Gateway

@enduml
```

---

### 2.2 Subsystem Specializations & Includes/Extends
```plantuml
@startuml Use_Case_Relationships
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

usecase "Direct Book Service" as UC_Book
usecase "Validate Customer Address" as UC_ValAddr
usecase "Hold Payment in Escrow" as UC_Escrow
usecase "Select Date & Time Window" as UC_Slot
usecase "Mark Job Completed" as UC_Complete
usecase "Generate Digital Tax Invoice" as UC_Invoice
usecase "File Service Complaint" as UC_Complaint
usecase "Trigger Fast-Track Instant Refund" as UC_Refund

UC_Book ..> UC_ValAddr : <<include>>
UC_Book ..> UC_Slot : <<include>>
UC_Book ..> UC_Escrow : <<include>>

UC_Complete ..> UC_Invoice : <<include>>
UC_Refund ..> UC_Complaint : <<extend>>

@enduml
```

---

## 3. ENTITY-RELATIONSHIP (ER) DIAGRAM

```plantuml
@startuml LocalFix_ER_Diagram
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam roundCorner 8
skinparam linetype ortho

entity "USERS" as users {
    * id : UUID <<PK>>
    --
    * email : VARCHAR(255) <<UK>>
    * hashed_password : VARCHAR(255)
    * full_name : VARCHAR(100)
    * phone : VARCHAR(20) <<UK>>
    * role : VARCHAR(20) <<customer|provider|admin>>
    * is_active : BOOLEAN
    * is_verified : BOOLEAN
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "CUSTOMER_PROFILES" as cust {
    * id : UUID <<PK>>
    --
    * user_id : UUID <<FK, UK>>
    preferred_locality : VARCHAR(100)
    avatar_url : VARCHAR(500)
    * created_at : TIMESTAMP
}

entity "PROVIDER_PROFILES" as prov {
    * id : UUID <<PK>>
    --
    * user_id : UUID <<FK, UK>>
    business_name : VARCHAR(200)
    organisation_name : VARCHAR(200)
    primary_skill : VARCHAR(100)
    bio : TEXT
    experience_years : INTEGER
    service_address : VARCHAR(255)
    service_area : VARCHAR(150)
    city : VARCHAR(100)
    state : VARCHAR(100)
    pincode : VARCHAR(10)
    * latitude : FLOAT
    * longitude : FLOAT
    * search_radius_km : FLOAT
    * verification_status : VARCHAR(20) <<pending|approved|rejected|verified>>
    aadhaar_last4 : VARCHAR(4)
    aadhaar_number_encrypted : TEXT
    aadhaar_document_path : VARCHAR(500)
    profile_photo_path : VARCHAR(500)
    resume_document_path : VARCHAR(500)
    consent_given : BOOLEAN
    consent_timestamp : TIMESTAMP
    rejection_reason : TEXT
    internal_verification_note : TEXT
    verified_at : TIMESTAMP
    verified_by_admin_id : UUID <<FK>>
    tutor_grades : VARCHAR(255)
    tutor_subjects : VARCHAR(255)
    tutor_mode : VARCHAR(100) <<online|offline|both>>
    specializations : VARCHAR(255)
    avg_rating : FLOAT
    total_reviews : INTEGER
    completed_jobs_count : INTEGER
    is_available : BOOLEAN
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "ADDRESSES" as addr {
    * id : UUID <<PK>>
    --
    * user_id : UUID <<FK>>
    * label : VARCHAR(50)
    * street_address : VARCHAR(255)
    * locality : VARCHAR(100)
    * city : VARCHAR(100)
    * state : VARCHAR(100)
    * postal_code : VARCHAR(10)
    latitude : FLOAT
    longitude : FLOAT
    * is_default : BOOLEAN
    * created_at : TIMESTAMP
}

entity "SERVICE_CATEGORIES" as cats {
    * id : UUID <<PK>>
    --
    * name : VARCHAR(100) <<UK>>
    * slug : VARCHAR(100) <<UK>>
    description : TEXT
    icon_name : VARCHAR(50)
    display_order : INTEGER
    * is_active : BOOLEAN
    * created_at : TIMESTAMP
}

entity "SERVICES" as srvs {
    * id : UUID <<PK>>
    --
    * category_id : UUID <<FK>>
    * name : VARCHAR(150)
    * slug : VARCHAR(150) <<UK>>
    description : TEXT
    * base_price : NUMERIC(10,2)
    * pricing_type : VARCHAR(20) <<fixed|hourly|quote>>
    estimated_duration_mins : INTEGER
    * is_active : BOOLEAN
    * created_at : TIMESTAMP
}

entity "BOOKINGS" as bks {
    * id : UUID <<PK>>
    --
    * booking_reference : VARCHAR(32) <<UK>>
    * customer_id : UUID <<FK>>
    * provider_id : UUID <<FK>>
    service_id : UUID <<FK>>
    request_id : UUID <<FK, UK>>
    quotation_id : UUID <<FK, UK>>
    * address_id : UUID <<FK>>
    * scheduled_date : DATE
    * scheduled_time_slot : VARCHAR(50)
    * total_amount : NUMERIC(10,2)
    * current_status : VARCHAR(20) <<requested|accepted|on_the_way|in_progress|completed|cancelled>>
    cancellation_reason : TEXT
    special_instructions : TEXT
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "PAYMENTS" as pay {
    * id : UUID <<PK>>
    --
    * booking_id : UUID <<FK, UK>>
    * amount : NUMERIC(10,2)
    * platform_fee : NUMERIC(10,2)
    * provider_payout : NUMERIC(10,2)
    * payment_method : VARCHAR(30) <<card|upi|netbanking|cash|mock_upi>>
    * payment_status : VARCHAR(30) <<pending|held_in_escrow|released|refunded|failed>>
    * transaction_reference : VARCHAR(100) <<UK>>
    gateway_response_payload : TEXT
    * created_at : TIMESTAMP
    * updated_at : TIMESTAMP
}

entity "REVIEWS" as revs {
    * id : UUID <<PK>>
    --
    * booking_id : UUID <<FK, UK>>
    * customer_id : UUID <<FK>>
    * provider_id : UUID <<FK>>
    * rating : INTEGER
    comment : TEXT
    * is_verified_purchase : BOOLEAN
    * is_public : BOOLEAN
    * created_at : TIMESTAMP
}

entity "COMPLAINTS" as cmpls {
    * id : UUID <<PK>>
    --
    * booking_id : UUID <<FK>>
    * filed_by_id : UUID <<FK>>
    * complaint_category : VARCHAR(100)
    * description : TEXT
    attachment_url : VARCHAR(500)
    * status : VARCHAR(30) <<open|under_investigation|resolved|rejected>>
    resolution_notes : TEXT
    resolved_by_id : UUID <<FK>>
    resolved_at : TIMESTAMP
    * created_at : TIMESTAMP
}

entity "ADMIN_AUDIT_LOGS" as logs {
    * id : UUID <<PK>>
    --
    * admin_id : UUID <<FK>>
    * action_type : VARCHAR(100)
    * target_entity : VARCHAR(100)
    target_id : UUID
    details : JSON
    ip_address : VARCHAR(45)
    * created_at : TIMESTAMP
}

users ||--o| cust : "1:1 profile"
users ||--o| prov : "1:1 profile"
users ||--o{ addr : "1:M addresses"
users ||--o{ logs : "1:M logs"

cats ||--o{ srvs : "1:M services"

cust ||--o{ bks : "1:M orders"
prov ||--o{ bks : "1:M assigned"
srvs ||--o{ bks : "1:M instances"
addr ||--o{ bks : "1:M delivery"

bks ||--o| pay : "1:1 ledger"
bks ||--o| revs : "1:1 review"
bks ||--o{ cmpls : "1:M disputes"

@enduml
```

---

## 4. UML CLASS DIAGRAM

```plantuml
@startuml LocalFix_Class_Diagram
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam classAttributeIconSize 0
skinparam roundCorner 8
skinparam shadowing false

skinparam package {
    BackgroundColor #F8FAFC
    BorderColor #64748B
    FontColor #0F172A
    FontStyle bold
}

skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2563EB
    HeaderBackgroundColor #EFF6FF
    FontColor #0F172A
    FontSize 11
    ArrowColor #1E293B
}

skinparam enum {
    BackgroundColor #FFFBEB
    BorderColor #D97706
    HeaderBackgroundColor #FEF3C7
    FontColor #78350F
    FontSize 10
}

package "1. Identity & Profiles" {
    enum UserRole {
        CUSTOMER
        PROVIDER
        ADMIN
    }

    enum VerificationStatus {
        PENDING
        UNDER_REVIEW
        APPROVED
        REJECTED
        VERIFIED
        SUSPENDED
    }

    class User {
        +UUID id
        +String email
        +String hashed_password
        +String full_name
        +String phone
        +UserRole role
        +Boolean is_active
        +Boolean is_verified
        +DateTime created_at
        +DateTime updated_at
        +verify_password(plain_pwd: String) : Boolean
        +set_password(plain_pwd: String) : void
        +is_admin() : Boolean
        +is_provider() : Boolean
    }

    class CustomerProfile {
        +UUID id
        +UUID user_id
        +String preferred_locality
        +String avatar_url
        +DateTime created_at
        +get_active_bookings() : List<Booking>
    }

    class ProviderProfile {
        +UUID id
        +UUID user_id
        +String business_name
        +String organisation_name
        +String primary_skill
        +String bio
        +Integer experience_years
        +String service_address
        +String service_area
        +String city
        +String state
        +String pincode
        +Float latitude
        +Float longitude
        +Float search_radius_km
        +VerificationStatus verification_status
        +String aadhaar_last4
        +String aadhaar_document_path
        +String profile_photo_path
        +String resume_document_path
        +Boolean consent_given
        +DateTime consent_timestamp
        +String rejection_reason
        +String internal_verification_note
        +DateTime verified_at
        +UUID verified_by_admin_id
        +String tutor_grades
        +String tutor_subjects
        +String tutor_mode
        +String specializations
        +Float avg_rating
        +Integer total_reviews
        +Integer completed_jobs_count
        +Boolean is_available
        +calculate_distance(cust_lat: Float, cust_lon: Float) : Float
        +update_rating(new_stars: Integer) : void
        +is_eligible_for_discovery() : Boolean
        +submit_kyc(aadhaar_last4: String, doc_path: String) : void
    }

    class Address {
        +UUID id
        +UUID user_id
        +String label
        +String street_address
        +String locality
        +String city
        +String state
        +String postal_code
        +Float latitude
        +Float longitude
        +Boolean is_default
        +get_full_address() : String
        +has_coordinates() : Boolean
    }
}

package "2. Service Catalog & Offerings" {
    enum PricingType {
        FIXED
        HOURLY
        QUOTE_BASED
    }

    class ServiceCategory {
        +UUID id
        +String name
        +String slug
        +String description
        +String icon_name
        +Boolean is_active
        +Integer display_order
        +get_active_services() : List<Service>
    }

    class Service {
        +UUID id
        +UUID category_id
        +String name
        +String description
        +Decimal base_price
        +PricingType pricing_type
        +Integer estimated_duration_mins
        +Boolean is_active
        +calculate_estimate(units: Integer) : Decimal
    }

    class ProviderService {
        +UUID id
        +UUID provider_id
        +UUID service_id
        +Decimal custom_price
        +Boolean is_active
        +get_effective_price() : Decimal
    }

    class ProviderAvailability {
        +UUID id
        +UUID provider_id
        +Integer day_of_week
        +Time start_time
        +Time end_time
        +Boolean is_active
        +is_slot_available(check_time: Time) : Boolean
    }
}

package "3. Booking & Execution" {
    enum BookingStatus {
        REQUESTED
        ACCEPTED
        ON_THE_WAY
        IN_PROGRESS
        COMPLETED
        CANCELLED
        DISPUTED
    }

    class Booking {
        +UUID id
        +String booking_reference
        +UUID customer_id
        +UUID provider_id
        +UUID service_id
        +UUID request_id
        +UUID quotation_id
        +UUID address_id
        +Date scheduled_date
        +String scheduled_time_slot
        +Decimal total_amount
        +BookingStatus current_status
        +String cancellation_reason
        +String special_instructions
        +transition_to(new_status: BookingStatus) : void
        +can_be_cancelled_by(user_id: UUID) : Boolean
        +confirm_completion() : void
    }

    class BookingStatusHistory {
        +UUID id
        +UUID booking_id
        +BookingStatus previous_status
        +BookingStatus new_status
        +UUID changed_by_user_id
        +String change_notes
        +DateTime created_at
    }
}

package "4. Financial & Escrow" {
    enum PaymentMethod {
        CARD
        UPI
        NETBANKING
        CASH
        MOCK_UPI
    }

    enum PaymentStatus {
        PENDING
        HELD_IN_ESCROW
        RELEASED
        REFUNDED
        FAILED
    }

    class Payment {
        +UUID id
        +UUID booking_id
        +UUID customer_id
        +UUID provider_id
        +String transaction_reference
        +Decimal amount
        +PaymentMethod payment_method
        +PaymentStatus payment_status
        +DateTime paid_at
        +hold_in_escrow() : void
        +release_to_provider() : void
        +execute_refund() : void
    }
}

package "5. Custom Requests & Quotations" {
    enum RequestStatus {
        OPEN
        QUOTED
        ACCEPTED
        EXPIRED
        CANCELLED
    }

    enum QuotationStatus {
        SUBMITTED
        ACCEPTED
        REJECTED
        WITHDRAWN
    }

    class ServiceRequest {
        +UUID id
        +UUID customer_id
        +UUID category_id
        +UUID address_id
        +String title
        +String description
        +Date preferred_date
        +String preferred_time_slot
        +String image_url
        +RequestStatus status
        +close_request() : void
        +get_best_quotation() : Quotation
    }

    class Quotation {
        +UUID id
        +UUID request_id
        +UUID provider_id
        +Decimal quoted_amount
        +String work_description
        +Float estimated_duration_hours
        +Date proposed_date
        +String proposed_time_slot
        +String additional_terms
        +QuotationStatus status
        +accept() : void
        +reject() : void
    }
}

package "6. Reputation, Redressal & Audit" {
    class Review {
        +UUID id
        +UUID booking_id
        +UUID customer_id
        +UUID provider_id
        +Integer rating
        +String comment
        +Boolean is_public
        +validate_rating() : Boolean
    }

    enum ComplaintStatus {
        OPEN
        UNDER_INVESTIGATION
        RESOLVED
        REJECTED
    }

    class Complaint {
        +UUID id
        +UUID booking_id
        +UUID filed_by_id
        +String complaint_category
        +String description
        +String attachment_url
        +ComplaintStatus status
        +String resolution_notes
        +UUID resolved_by_id
        +DateTime resolved_at
        +resolve_fast_track(admin_id: UUID, notes: String) : void
        +reject_complaint(admin_id: UUID, notes: String) : void
    }

    class AdminAuditLog {
        +UUID id
        +UUID admin_id
        +String action_type
        +String target_entity
        +UUID target_id
        +JSON details
        +String ip_address
        +DateTime created_at
        +log_action(admin: User, action: String, target: String) : void
    }
}

package "7. In-App Communication" {
    class Conversation {
        +UUID id
        +UUID booking_id
        +UUID customer_id
        +UUID provider_id
        +get_unread_count(user_id: UUID) : Integer
    }

    class Message {
        +UUID id
        +UUID conversation_id
        +UUID sender_id
        +String content
        +Boolean is_read
        +mark_as_read() : void
    }

    class Notification {
        +UUID id
        +UUID user_id
        +String title
        +String message
        +String notification_type
        +String reference_type
        +UUID reference_id
        +Boolean is_read
        +mark_as_read() : void
    }
}

package "8. Domain Engines & Services" {
    class SpatialDiscoveryEngine <<Service>> {
        +compute_haversine(lat1: Float, lon1: Float, lat2: Float, lon2: Float) : Float
        +filter_providers_within_radius(lat: Float, lon: Float, max_radius_km: Float) : List<ProviderProfile>
        +sort_by_proximity_and_rating(providers: List<ProviderProfile>) : List<ProviderProfile>
    }

    class FuzzyAutocompleteEngine <<Component>> {
        +get_levenshtein_distance(s1: String, s2: String) : Integer
        +compute_match_score(query: String, trade_meta: Object) : Integer
        +generate_suggestions(query: String) : List<Suggestion>
    }
}

' ==========================================
' RELATIONSHIPS & ASSOCIATIONS
' ==========================================

' User & Profile Links
User "1" *-- "0..1" CustomerProfile : user_id
User "1" *-- "0..1" ProviderProfile : user_id
User "1" *-- "*" Address : owns
User "1" --> "*" AdminAuditLog : performs
User "1" --> "*" Notification : receives

' Service Catalog Relationships
ServiceCategory "1" *-- "*" Service : categorizes
ProviderProfile "1" *-- "*" ProviderService : offers
Service "1" *-- "*" ProviderService : catalog_ref
ProviderProfile "1" *-- "*" ProviderAvailability : schedules

' Service Requests & Quotations Flow
CustomerProfile "1" --> "*" ServiceRequest : creates
ServiceCategory "1" --> "*" ServiceRequest : categorizes
Address "1" --> "*" ServiceRequest : located_at
ServiceRequest "1" *-- "*" Quotation : receives
ProviderProfile "1" --> "*" Quotation : submits

' Booking Core Links
CustomerProfile "1" --> "*" Booking : books
ProviderProfile "1" --> "*" Booking : services
Service "0..1" --> "*" Booking : service_item
Address "1" --> "*" Booking : service_location
ServiceRequest "0..1" --> "0..1" Booking : originates_from
Quotation "0..1" --> "0..1" Booking : agreed_rate
Booking "1" *-- "*" BookingStatusHistory : status_log

' Payment & Financial
Booking "1" *-- "0..1" Payment : settles_via
CustomerProfile "1" --> "*" Payment : payer
ProviderProfile "1" --> "*" Payment : recipient

' Reviews, Complaints & Audit
Booking "1" *-- "0..1" Review : rated_by
CustomerProfile "1" --> "*" Review : written_by
ProviderProfile "1" --> "*" Review : evaluates
Booking "1" *-- "*" Complaint : disputes
User "1" --> "*" Complaint : files
User "0..1" --> "*" Complaint : resolved_by

' In-App Messaging
Booking "1" *-- "0..1" Conversation : establishes
Conversation "1" *-- "*" Message : contains
User "1" --> "*" Message : sends

' System Engine Queries
SpatialDiscoveryEngine ..> ProviderProfile : filters & ranks
SpatialDiscoveryEngine ..> Address : proximity_center
FuzzyAutocompleteEngine ..> ServiceCategory : searches
FuzzyAutocompleteEngine ..> Service : indexes

@enduml
```

---

## 5. ACTIVITY DIAGRAMS

### 5.1 Activity 1: Provider Onboarding & Admin KYC Inspection
```plantuml
@startuml Activity_Provider_KYC
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

start
:Provider Applicant fills Registration Form;
:Input Personal Details, Experience, Service Locality;
:Enter Aadhaar Last-4 Digits (XXXX-XXXX-1234);

if (Is Teaching / Tutor Trade?) then (yes)
    :Select Teaching Delivery Mode\n(Online, Offline Home Tuition, or Both);
    :Input Curriculum Standards & Subjects;
else (no)
    :Select Standard Trade Skill;
endif

:Upload Government Aadhaar Card & Profile Photo;
:Provide Regulatory Verification Consent;
:Submit Application to LocalFix Backend;

:Backend validates Aadhaar Last-4 & mandatory attributes;
:Quarantine uploaded files in Secure Storage Vault;
:Create ProviderProfile with status = PENDING;

|Administrator|
:Open Pending KYC Verification Dashboard;
:Inspect Applicant Profile, Trade & Address;
:Stream & Review Uploaded Aadhaar & Photo;

if (Are Credentials Authentic and Legible?) then (yes)
    :Click "Approve Verification";
    :Update verification_status = APPROVED;
    :Write Action to Admin Audit Log;
    :Dispatch Approval Notification Email;
    :Profile becomes Discoverable within 10 km;
    stop
else (no)
    :Click "Reject Application";
    :Enter Mandatory Written Rejection Reason;
    :Update verification_status = REJECTED;
    :Write Action to Admin Audit Log;
    :Dispatch Rejection Notice with Reason;
    :Applicant may log in & upload valid docs;
    stop
endif
@enduml
```

---

### 5.2 Activity 2: Customer Discovery, Direct Booking & Escrow Settlement
```plantuml
@startuml Activity_Booking_Escrow
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

start
:Customer enters Search Term (with Fuzzy Autocomplete);
:System computes Levenshtein Distance & renders suggestions;
:Customer selects Category, GPS Locality & Tutor Mode;

:Backend filters APPROVED providers where Haversine Distance <= 10.0 km;
:Customer browses verified profiles & reviews;
:Click "Book Appointment / Tuition Session";

:Select Service, Date, Time Slot & Delivery Address;
:Choose Payment Method (UPI / Card / Netbanking / COD);
:Backend authorizes transaction & locks funds in Escrow Vault\n(status = HELD_IN_ESCROW);
:Create Booking with status = REQUESTED;

|Service Provider|
:Receive Real-time Job Dispatch Notification;
:Accept Booking (status -> ACCEPTED);
:Depart for Job Site (status -> ON_THE_WAY);
:Arrive at Customer Premises (status -> IN_PROGRESS);
:Perform Verified Service / Tuition;
:Mark Job as Completed (status -> COMPLETED);

|Customer|
:Inspect Service Quality & Sign off;
:Release Escrow Payment to Provider (status -> RELEASED);
:System auto-generates Itemized 18% GST Tax Invoice;
:Customer downloads printable PDF Invoice;
:Submit 1-5 Star Rating & Verified Review;
stop
@enduml
```

---

### 5.3 Activity 3: Fast-Track Dispute Redressal & Instant Refund
```plantuml
@startuml Activity_Dispute_Redressal
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

start
:Customer identifies issue on completed booking;
:Open "File Service Complaint" modal;
:Select Issue Category (Quality, Delay, Pricing, Damage);
:Enter descriptive explanation of defect;

if (Customer checks Fast-Track Auto-Resolution?) then (yes)
    :System evaluates Complaint Category;
    if (Category is Standard Quality/Delay?) then (yes)
        :Trigger Instant Automated Resolution;
        :Execute Escrow Ledger Refund to Customer (< 5s);
        :Update Complaint status = RESOLVED;
        :Update Booking status = DISPUTED_REFUNDED;
        :Notify Customer of credited balance;
        stop
    else (Complex Property Damage)
        :Escalate to Senior Support Queue;
    endif
else (no)
    :Route to Admin Arbitration Queue;
endif

|Administrator|
:Senior Officer inspects Complaint Dossier;
:Review Chat History, Time Stamps & Work Details;
:Call Customer & Provider for Mediation;

if (Approve Customer Claim?) then (yes)
    :Authorize Full / Partial Ledger Refund;
    :Update Complaint status = RESOLVED;
else (no)
    :Reject Claim with Evidence Notes;
    :Update Complaint status = REJECTED;
endif

:Write Action to Admin Audit Trail;
stop
@enduml
```

---

## 6. SEQUENCE DIAGRAMS

### 6.1 Sequence 1: Customer Booking, Provider Lifecycle & Completion
```plantuml
@startuml Sequence_Booking_Lifecycle
autonumber
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

actor Customer as C
participant "React Frontend" as UI
participant "FastAPI Backend" as API
database "PostgreSQL DB" as DB
actor "Service Provider" as P

C -> UI : Select Service, Time Slot & Address
UI -> API : POST /api/bookings {service_id, slot, address_id}
API -> DB : INSERT INTO bookings (status='requested')
DB --> API : Created Booking Record (BK-XXXXXX)
API -> P : WebSocket / Push Alert: New Job Request
API --> UI : 201 Created (Booking Details)

P -> UI : Click "Accept Booking"
UI -> API : PATCH /api/bookings/{id}/status {status: 'accepted'}
API -> DB : UPDATE bookings SET current_status = 'accepted'
API -> C : Push Notification: Provider Confirmed Job
API --> UI : 200 OK

P -> UI : Click "Mark On The Way"
UI -> API : PATCH /api/bookings/{id}/status {status: 'on_the_way'}
API -> DB : UPDATE bookings SET current_status = 'on_the_way'
API -> C : Notification: Technician is En Route (GPS Active)
API --> UI : 200 OK

P -> UI : Click "Arrive & Start Work"
UI -> API : PATCH /api/bookings/{id}/status {status: 'in_progress'}
API -> DB : UPDATE bookings SET current_status = 'in_progress'
API --> UI : 200 OK

P -> UI : Click "Mark Job Completed"
UI -> API : PATCH /api/bookings/{id}/status {status: 'completed'}
API -> DB : UPDATE bookings SET current_status = 'completed'
API -> C : Notification: Service Finished. Please Review.
API --> UI : 200 OK

C -> UI : Submit 5-Star Rating & Comment
UI -> API : POST /api/reviews {rating: 5, comment: "Excellent work"}
API -> DB : INSERT INTO reviews; Recompute provider.avg_rating
API --> UI : 201 Review Recorded
@enduml
```

---

### 6.2 Sequence 2: Provider KYC Submission, Aadhaar Review & Admin Decision
```plantuml
@startuml Sequence_KYC_Verification
autonumber
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

actor "Provider Applicant" as P
participant "React Frontend" as UI
participant "Auth Controller" as Auth
participant "Storage Vault" as Vault
database "Database" as DB
actor "Administrator" as A

P -> UI : Submit Form (Aadhaar Last-4, Trade, Tutor Mode)
P -> UI : Upload Aadhaar Card & Profile Photo
UI -> Auth : POST /api/auth/register-provider (Multipart)
Auth -> Vault : Quarantine File Streams (/storage/kyc/)
Auth -> DB : INSERT provider_profiles (verification_status='pending')
DB --> Auth : Profile Created
Auth --> UI : 201 Registration Awaiting KYC Inspection

A -> UI : Open Admin Verification Dashboard
UI -> Auth : GET /api/admin/verifications/pending
Auth -> DB : SELECT * FROM provider_profiles WHERE status='pending'
DB --> Auth : Return Pending Applications
Auth --> UI : Render Dossier Queue

A -> UI : Click "Inspect Application"
UI -> Auth : GET /api/admin/verifications/{id}/document/aadhaar
Auth -> Vault : Read Quarantined Binary Stream
Vault --> Auth : Document Bytes
Auth --> UI : Stream PDF / Image
UI --> A : Display Aadhaar Card & Details

alt Approve Application
    A -> UI : Click "Approve Verification"
    UI -> Auth : POST /api/admin/verifications/{id}/approve
    Auth -> DB : UPDATE provider_profiles SET status='approved'
    Auth -> DB : INSERT INTO admin_audit_logs (action='APPROVE_PROVIDER')
    Auth --> P : Dispatch Email: "Account Approved"
    Auth --> UI : 200 Profile Discoverable Locally (< 10km)
else Reject Application
    A -> UI : Click "Reject" (Enter mandatory reason)
    UI -> Auth : POST /api/admin/verifications/{id}/reject {reason}
    Auth -> DB : UPDATE provider_profiles SET status='rejected', rejection_reason=reason
    Auth -> DB : INSERT INTO admin_audit_logs (action='REJECT_PROVIDER')
    Auth --> P : Dispatch Email: "Verification Rejected - Reason Included"
    Auth --> UI : 200 Rejection Enforced
end
@enduml
```

---

### 6.3 Sequence 3: Payment Checkout, Escrow Holding & Tax Invoicing
```plantuml
@startuml Sequence_Escrow_Invoicing
autonumber
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

actor Customer as C
participant "Checkout UI" as UI
participant "Payment Controller" as Pay
participant "Escrow Ledger" as Escrow
database "Database" as DB

C -> UI : Select Payment Method (UPI / Card / Netbanking / COD)
UI -> Pay : POST /api/payments/checkout {booking_id, method}
Pay -> DB : SELECT total_amount FROM bookings WHERE id = booking_id
DB --> Pay : Amount = ₹899.00
Pay -> Escrow : Lock ₹899.00 (status = HELD_IN_ESCROW)
Escrow --> Pay : Escrow Hold Confirmed
Pay -> DB : INSERT INTO payments (status='held_in_escrow')
Pay --> UI : 200 Payment Authorized & Escrow Secured

note over Pay, DB : Field service performed to completion

C -> UI : Approve Completion
UI -> Pay : POST /api/payments/{booking_id}/release
Pay -> Escrow : Release ₹899.00 (Deduct 10% fee, disburse to provider)
Escrow --> Pay : Payout Settled
Pay -> DB : UPDATE payments SET status='released'

UI -> Pay : GET /api/payments/invoice/{booking_id}
Pay -> DB : Fetch Booking, Provider & Tax Details
Pay -> Pay : Calculate 18% GST (CGST 9% + SGST 9%)
Pay --> UI : Return Itemized Invoice Payload
UI --> C : Render Printable Invoice Modal with PDF Export
@enduml
```

---

## 7. STATE MACHINE DIAGRAMS

### 7.1 State 1: Booking Lifecycle States
```plantuml
@startuml State_Booking_Lifecycle
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

[*] --> REQUESTED : Customer books service

REQUESTED --> ACCEPTED : Provider accepts booking
REQUESTED --> CANCELLED : Customer cancels in grace period
REQUESTED --> CANCELLED : Provider declines / timeout

ACCEPTED --> ON_THE_WAY : Provider departs for address
ACCEPTED --> CANCELLED : Emergency cancellation with reason

ON_THE_WAY --> IN_PROGRESS : Provider arrives & begins work

IN_PROGRESS --> COMPLETED : Work verified & finished
IN_PROGRESS --> DISPUTED : Customer files active dispute

DISPUTED --> COMPLETED : Dispute resolved & accepted
DISPUTED --> CANCELLED : Service abandoned & refunded

COMPLETED --> [*]
CANCELLED --> [*]
@enduml
```

---

### 7.2 State 2: Provider Verification Status States
```plantuml
@startuml State_Provider_Verification
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

[*] --> PENDING : Provider registers with Aadhaar Last-4 & Docs

PENDING --> UNDER_REVIEW : Admin opens verification dossier
PENDING --> REJECTED : Missing mandatory docs / forged data

UNDER_REVIEW --> APPROVED : Admin validates Aadhaar & credentials
UNDER_REVIEW --> REJECTED : Mismatched Aadhaar / illegible docs

APPROVED --> VERIFIED : Completes 3 jobs with avg rating > 4.0
APPROVED --> SUSPENDED : Serious policy violation / complaints

VERIFIED --> SUSPENDED : Regulatory or code of conduct breach

SUSPENDED --> UNDER_REVIEW : Provider files appeal with new KYC
REJECTED --> PENDING : Provider uploads fresh valid documents

VERIFIED --> [*]
@enduml
```

---

### 7.3 State 3: Dispute Resolution States
```plantuml
@startuml State_Dispute_Resolution
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

[*] --> OPEN : Customer submits service complaint

OPEN --> RESOLVED : Fast-Track Auto-Resolution (<5s Instant Refund)
OPEN --> UNDER_INVESTIGATION : Escalated to Senior Admin Queue

UNDER_INVESTIGATION --> RESOLVED : Admin grants refund or free re-service
UNDER_INVESTIGATION --> REJECTED : Admin finds complaint unsubstantiated

RESOLVED --> [*]
REJECTED --> [*]
@enduml
```

---

## 8. COMPONENT & DEPLOYMENT ARCHITECTURE DIAGRAM

```plantuml
@startuml Component_Deployment_Architecture
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial

node "Client Tier (End-User Device)" {
    component [Browser Client] as Browser {
        package "React 18 SPA (Vite)" {
            [TailwindCSS Design System]
            [SearchAutocomplete (Levenshtein)]
            [Leaflet Map GIS Engine]
            [React ErrorBoundary]
        }
    }
}

node "Reverse Proxy & Web Server" {
    component [Nginx Proxy / Port 80, 443] as Nginx
}

node "Application Server Tier" {
    component [FastAPI ASGI App / Port 8000] as FastAPI {
        [Uvicorn Async Event Loop]
        [Spatial Haversine Engine (10km)]
        [Escrow Ledger Controller]
        [Tax Invoice Generator]
        [JWT & RBAC Middleware]
    }
}

node "Storage & Persistence Tier" {
    database "PostgreSQL 16 Engine" as DB {
        [UUID-OSSP Extension]
        [Users & Profiles Tables]
        [Bookings & Status Tracking]
        [Payments & Invoices]
        [Complaints & Audit Logs]
    }
    
    folder "Quarantined Storage Vault" as Vault {
        [/storage/kyc/ (Encrypted Documents)]
        [/storage/photos/ (Avatars)]
    }
}

cloud "External Services" {
    [OpenStreetMap / Carto CDN] as OSM
    [Mock Payment Gateway] as Gateway
}

Browser --> Nginx : HTTPS / WSS
Nginx --> FastAPI : ASGI Proxy
FastAPI --> DB : SQLAlchemy 2.0 ORM Connection Pool
FastAPI --> Vault : Restricted Stream I/O
Browser --> OSM : Vector Cartographic Tiles
FastAPI --> Gateway : Payment Authorization

@enduml
```

---
**End of PlantUML Diagram Specifications**  
*LocalFix Verification, Proximity Discovery & Marketplace Platform*
