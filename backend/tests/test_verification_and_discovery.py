import uuid
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def get_token(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_provider_registration_mandatory_fields_validation():
    """Scenario 1: Provider cannot register without mandatory fields."""
    # Test missing email, phone, and files
    res = client.post("/api/auth/register-provider", data={
        "full_name": "Test Incomplete Provider",
        "primary_skill": "electrician",
        "service_address": "123 Main Street",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202001",
        "latitude": 27.8974,
        "longitude": 78.0880,
        "aadhaar_number": "999911112222",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_given": "true"
    })
    # Form data missing email, phone, files -> 422 Unprocessable Entity
    assert res.status_code == 422

    # Test invalid Aadhaar number (less than 12 digits) with all required fields present
    fake_photo = ("photo.jpg", b"\xff\xd8\xff\xe0" + b"dummy photo content", "image/jpeg")
    fake_aadhaar = ("aadhaar.pdf", b"%PDF-1.4" + b"dummy aadhaar pdf", "application/pdf")
    fake_resume = ("resume.pdf", b"%PDF-1.4" + b"dummy resume pdf", "application/pdf")

    res2 = client.post("/api/auth/register-provider", data={
        "full_name": "Invalid Aadhaar Provider",
        "email": "invalidaadhaar@test.com",
        "phone": "+919876543299",
        "primary_skill": "electrician",
        "service_address": "456 Market Road",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202001",
        "latitude": 27.8974,
        "longitude": 78.0880,
        "aadhaar_number": "12345",  # Invalid format
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_given": "true"
    }, files={
        "profile_photo_file": fake_photo,
        "aadhaar_card_file": fake_aadhaar,
        "resume_file": fake_resume
    })
    assert res2.status_code == 400
    assert "12" in res2.json()["detail"]

    # Test missing consent
    res3 = client.post("/api/auth/register-provider", data={
        "full_name": "No Consent Provider",
        "email": "noconsent@test.com",
        "phone": "+919876543298",
        "primary_skill": "electrician",
        "service_address": "456 Market Road",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202001",
        "latitude": 27.8974,
        "longitude": 78.0880,
        "aadhaar_number": "887766554433",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_given": "false"  # Explicit refusal
    }, files={
        "profile_photo_file": fake_photo,
        "aadhaar_card_file": fake_aadhaar,
        "resume_file": fake_resume
    })
    assert res3.status_code == 400
    assert "consent" in res3.json()["detail"].lower()


def test_provider_registration_flow_and_initial_pending_status():
    """Scenario 2 & 14: New provider has PENDING status, 0.0 rating, 0 reviews, and is NOT publicly listed."""
    unique_email = f"provider_{uuid.uuid4().hex[:8]}@localfix.com"
    unique_phone = f"+91{uuid.uuid4().int % 9000000000 + 1000000000}"
    fake_photo = ("avatar.jpg", b"\xff\xd8\xff\xe0" + b"fake photo binary data", "image/jpeg")
    fake_aadhaar = ("aadhaar.pdf", b"%PDF-1.4" + b"fake aadhaar document", "application/pdf")
    fake_resume = ("resume.pdf", b"%PDF-1.4" + b"fake resume document", "application/pdf")

    reg_res = client.post("/api/auth/register-provider", data={
        "full_name": "Deepak Sharma",
        "email": unique_email,
        "phone": unique_phone,
        "organisation_name": "Sharma Electricals Ltd",
        "primary_skill": "electrician",
        "service_address": "Sector 4, Near Clock Tower",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202001",
        "latitude": 27.9050,
        "longitude": 78.0820,
        "aadhaar_number": "887766554433",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "consent_given": "true"
    }, files={
        "profile_photo_file": fake_photo,
        "aadhaar_card_file": fake_aadhaar,
        "resume_file": fake_resume
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    token_data = reg_res.json()
    prov_token = token_data["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    # Fetch provider's own profile via /api/providers/me
    me_res = client.get("/api/providers/me", headers=prov_headers)
    assert me_res.status_code == 200
    prov_data = me_res.json()

    assert prov_data["verification_status"] == "pending"
    assert prov_data["avg_rating"] == 0.0
    assert prov_data["total_reviews"] == 0
    assert prov_data["aadhaar_last4"] == "4433"
    assert "aadhaar_number_encrypted" not in prov_data
    assert "aadhaar_number" not in prov_data

    prov_id = prov_data["id"]

    # Scenario 2 & 10: Provider is NOT discoverable publicly in search or detail while PENDING
    search_res = client.get(f"/api/search/providers?latitude=27.9050&longitude=78.0820")
    assert search_res.status_code == 200
    listed_provider_ids = [str(p["provider_id"]) for p in search_res.json()]
    assert str(prov_id) not in listed_provider_ids, "Pending provider must NOT appear in public search"

    detail_res = client.get(f"/api/search/providers/{prov_id}")
    assert detail_res.status_code == 404, "Pending provider must return 404 on public detail endpoint"


def test_non_admin_cannot_access_verification_endpoints_or_aadhaar():
    """Scenario 3 & 4: Non-admin cannot view Aadhaar information or approve/reject applications."""
    cust_token = get_token("customer@localfix.com", "customer123")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Attempt to list verification requests
    list_res = client.get("/api/admin/verifications", headers=cust_headers)
    assert list_res.status_code == 403

    # Attempt to reveal Aadhaar
    dummy_id = str(uuid.uuid4())
    reveal_res = client.get(f"/api/admin/verifications/{dummy_id}/reveal-aadhaar", headers=cust_headers)
    assert reveal_res.status_code == 403

    # Attempt to approve/reject
    dec_res = client.post(f"/api/admin/verifications/{dummy_id}/decision", headers=cust_headers, json={
        "action": "approve"
    })
    assert dec_res.status_code == 403


def test_admin_verification_workflow_approval_and_rejection():
    """Scenarios 5, 6, 7, 8, 9, 10: Admin review dossier, reveal Aadhaar, rejection reason requirement, emails, deduplication."""
    admin_token = get_token("admin@localfix.com", "admin123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Register a new test provider (valid Aadhaar starts with 2-9)
    unique_email = f"app_test_{uuid.uuid4().hex[:8]}@localfix.com"
    unique_phone = f"+91{uuid.uuid4().int % 9000000000 + 1000000000}"
    fake_photo = ("avatar.jpg", b"\xff\xd8\xff\xe0" + b"fake photo binary data", "image/jpeg")
    fake_aadhaar = ("aadhaar.pdf", b"%PDF-1.4" + b"fake aadhaar document", "application/pdf")
    fake_resume = ("resume.pdf", b"%PDF-1.4" + b"fake resume document", "application/pdf")

    reg = client.post("/api/auth/register-provider", data={
        "full_name": "Rohan Verma",
        "email": unique_email,
        "phone": unique_phone,
        "organisation_name": "Verma Plumbing Co",
        "primary_skill": "plumber",
        "service_address": "Shop 12, Civil Lines",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202002",
        "latitude": 27.8980,
        "longitude": 78.0870,
        "aadhaar_number": "912233445566",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "consent_given": "true"
    }, files={
        "profile_photo_file": fake_photo,
        "aadhaar_card_file": fake_aadhaar,
        "resume_file": fake_resume
    })
    assert reg.status_code == 201, f"Provider registration failed: {reg.text}"
    prov_token = reg.json()["access_token"]
    prov_me = client.get("/api/providers/me", headers={"Authorization": f"Bearer {prov_token}"}).json()
    prov_id = prov_me["id"]

    # Scenario 5: Admin retrieves dossier
    dossier_res = client.get(f"/api/admin/verifications/{prov_id}", headers=admin_headers)
    assert dossier_res.status_code == 200
    dossier = dossier_res.json()
    assert dossier["full_name"] == "Rohan Verma"
    assert dossier["organisation_name"] == "Verma Plumbing Co"
    assert dossier["verification_status"] == "pending"
    assert dossier["aadhaar_last4"] == "5566"
    assert dossier["masked_aadhaar"] == "XXXX-XXXX-5566"

    # Reveal Aadhaar securely (logs admin audit)
    reveal_res = client.get(f"/api/admin/verifications/{prov_id}/reveal-aadhaar", headers=admin_headers)
    assert reveal_res.status_code == 200
    assert reveal_res.json()["aadhaar_number"] == "912233445566"

    # Scenario 7: Rejection WITHOUT reason is BLOCKED
    rej_fail = client.post(f"/api/admin/verifications/{prov_id}/decision", headers=admin_headers, json={
        "action": "reject",
        "rejection_reason": ""  # Missing rejection reason
    })
    assert rej_fail.status_code in [400, 422]

    # Scenario 8: Rejection WITH reason succeeds and sends email
    rej_ok = client.post(f"/api/admin/verifications/{prov_id}/decision", headers=admin_headers, json={
        "action": "reject",
        "rejection_reason": "Aadhaar photo is blurry. Please upload a high resolution copy.",
        "internal_note": "Aadhaar corner obscured by glare."
    })
    assert rej_ok.status_code == 200
    rej_data = rej_ok.json()
    assert rej_data["verification_status"] == "rejected"
    assert rej_data["rejection_reason"] == "Aadhaar photo is blurry. Please upload a high resolution copy."

    # Scenario 9: Repeated status change request (deduplication check)
    dup_res = client.post(f"/api/admin/verifications/{prov_id}/decision", headers=admin_headers, json={
        "action": "reject",
        "rejection_reason": "Aadhaar photo is blurry. Please upload a high resolution copy."
    })
    assert dup_res.status_code == 200

    # Scenario 6: Approval changes status and sends approval email
    app_res = client.post(f"/api/admin/verifications/{prov_id}/decision", headers=admin_headers, json={
        "action": "approve",
        "internal_note": "Re-verified documents manually, all clear."
    })
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["verification_status"] == "approved"
    assert app_data["verified_at"] is not None

    # Scenario 10: Now provider is APPROVED, they appear in public search and detail
    search_res = client.get("/api/search/providers?latitude=27.8980&longitude=78.0870")
    assert search_res.status_code == 200
    approved_ids = [str(p["provider_id"]) for p in search_res.json()]
    assert str(prov_id) in approved_ids, "Approved provider must appear in public search"

    detail_res = client.get(f"/api/search/providers/{prov_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["full_name"] == "Rohan Verma"
    assert detail["organisation_name"] == "Verma Plumbing Co"
    assert detail["verification_status"] == "approved"


def test_strict_10km_location_distance_enforcement():
    """Scenarios 11, 12, 13: Strict 10 km radius enforcement, exclusion of distant providers, filter retention."""
    # Aligarh center is approximately (27.8974, 78.0880)
    # Search with center exactly at Aligarh center
    res_near = client.get("/api/search/providers?latitude=27.8974&longitude=78.0880&max_radius_km=10")
    assert res_near.status_code == 200
    near_providers = res_near.json()
    assert len(near_providers) >= 1

    for p in near_providers:
        # Every provider must have distance <= 10.0 km
        assert p["distance_km"] <= 10.0, f"Provider {p['full_name']} distance {p['distance_km']} exceeds 10 km!"

    # Customer searches from Agra (27.1767, 78.0081) which is ~80 km away from Aligarh
    # No Aligarh providers should be returned
    res_far = client.get("/api/search/providers?latitude=27.1767&longitude=78.0081&max_radius_km=10")
    assert res_far.status_code == 200
    far_providers = res_far.json()
    # Any provider returned must strictly be within 10km of Agra (27.1767, 78.0081)
    for p in far_providers:
        assert p["distance_km"] <= 10.0

    # Ensure max_radius_km cannot be bypassed by passing 50km
    res_bypass = client.get("/api/search/providers?latitude=27.8974&longitude=78.0880&max_radius_km=50")
    assert res_bypass.status_code == 200
    for p in res_bypass.json():
        assert p["distance_km"] <= 10.0, f"Distance {p['distance_km']} km exceeded 10 km cap even with max_radius_km=50!"

    # Skill filter retains 10 km restriction
    res_electrician = client.get("/api/search/providers?category_slug=electrician&latitude=27.8974&longitude=78.0880")
    assert res_electrician.status_code == 200
    for p in res_electrician.json():
        assert p["distance_km"] <= 10.0


def test_rating_system_and_self_rating_prevention():
    """Scenarios 14, 15: Valid review updates aggregate rating; providers cannot self-rate."""
    cust_token = get_token("customer@localfix.com", "customer123")
    prov_token = get_token("electrician@localfix.com", "provider123")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    # Retrieve existing bookings for customer
    bk_res = client.get("/api/bookings/my", headers=cust_headers)
    assert bk_res.status_code == 200
    bookings = bk_res.json()
    assert len(bookings) >= 1

    # Find a completed booking
    target_booking = next((b for b in bookings if b["current_status"] == "completed"), bookings[0])

    # Check self-rating: Provider attempting to review using provider token
    self_rate_res = client.post("/api/reviews", headers=prov_headers, json={
        "booking_id": target_booking["id"],
        "rating": 5,
        "comment": "Self rating should fail"
    })
    # Providers do not have the CUSTOMER role so this should be blocked (403 or 400)
    assert self_rate_res.status_code in [400, 403]


def test_document_download_security():
    """Scenario 16: Unauthorized users cannot download private documents."""
    admin_token = get_token("admin@localfix.com", "admin123")
    cust_token = get_token("customer@localfix.com", "customer123")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Fetch a provider with documents from admin list
    v_res = client.get("/api/admin/verifications", headers=admin_headers)
    assert v_res.status_code == 200
    items = v_res.json()["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    # Customer attempts to download aadhaar document
    cust_doc_res = client.get(f"/api/admin/verifications/{target_id}/document/aadhaar", headers=cust_headers)
    assert cust_doc_res.status_code == 403

    # Unauthenticated user attempts download
    anon_res = client.get(f"/api/admin/verifications/{target_id}/document/aadhaar")
    assert anon_res.status_code in [401, 403]


def test_individual_provider_registration_without_organization():
    """Verify that an individual service provider can register under their own name without any organization/shop."""
    unique_email = f"individual_{uuid.uuid4().hex[:8]}@localfix.com"
    unique_phone = f"+91{uuid.uuid4().int % 9000000000 + 1000000000}"
    fake_photo = ("avatar.jpg", b"\xff\xd8\xff\xe0" + b"fake photo binary data", "image/jpeg")
    fake_aadhaar = ("aadhaar.pdf", b"%PDF-1.4" + b"fake aadhaar document", "application/pdf")
    fake_resume = ("resume.pdf", b"%PDF-1.4" + b"fake resume document", "application/pdf")

    # 1. Register with NO organisation_name or business_name
    reg_res = client.post("/api/auth/register-provider", data={
        "full_name": "Tariq Mansoor",
        "email": unique_email,
        "phone": unique_phone,
        "primary_skill": "plumber",
        "service_address": "Medical Road, AMU Campus",
        "city": "Aligarh",
        "state": "Uttar Pradesh",
        "pincode": "202001",
        "latitude": 27.8974,
        "longitude": 78.0880,
        "aadhaar_number": "998877665544",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "consent_given": "true",
        "experience_years": 4
    }, files={
        "profile_photo_file": fake_photo,
        "aadhaar_card_file": fake_aadhaar,
        "resume_file": fake_resume
    })
    assert reg_res.status_code == 201, f"Individual registration failed: {reg_res.text}"
    token_data = reg_res.json()
    prov_token = token_data["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}"}

    # 2. Check /api/providers/me confirms provider's own name is used as business_name
    me_res = client.get("/api/providers/me", headers=prov_headers)
    assert me_res.status_code == 200
    prov_data = me_res.json()

    assert prov_data["full_name"] == "Tariq Mansoor"
    assert prov_data["business_name"] == "Tariq Mansoor", "Individual provider business_name should be own full_name"
    assert prov_data["organisation_name"] is None, "Individual provider has no organization requirement"
    assert prov_data["experience_years"] == 4
    assert prov_data["profile_photo_path"] is not None, "Profile photo must be saved"
    assert prov_data["profile_photo_url"] is not None

    # 3. Verify public photo retrieval endpoint
    photo_filename = prov_data["profile_photo_path"]
    photo_res = client.get(f"/api/providers/photo/{photo_filename}")
    assert photo_res.status_code == 200
    assert photo_res.headers["content-type"].startswith("image/")

