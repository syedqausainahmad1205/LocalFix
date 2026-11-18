from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_spatial_provider_search():
    # 1. Search for electricians near Aligarh center (27.8974, 78.0880)
    res = client.get("/api/search/providers?category_slug=electrician&max_radius_km=15")
    assert res.status_code == 200
    providers = res.json()
    assert len(providers) >= 1
    p = providers[0]
    assert p["verification_status"] == "verified"
    assert "distance_km" in p
    assert p["distance_km"] < 15.0
    assert any("Electrician" in s["category_name"] for s in p["services"])


def test_complete_marketplace_lifecycle_journey():
    # --- Step 1: Customer and Provider Logins ---
    cust_token = get_token("customer@localfix.com", "customer123")
    prov_token = get_token("electrician@localfix.com", "provider123")
    admin_token = get_token("admin@localfix.com", "admin123")

    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    prov_headers = {"Authorization": f"Bearer {prov_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # --- Step 2: Customer retrieves categories & addresses ---
    cats_res = client.get("/api/categories")
    categories = cats_res.json()
    elec_cat = next(c for c in categories if c["slug"] == "electrician")

    addrs_res = client.get("/api/customers/addresses", headers=cust_headers)
    assert addrs_res.status_code == 200
    addresses = addrs_res.json()
    assert len(addresses) >= 1
    address_id = addresses[0]["id"]

    # --- Step 3: Customer posts a Service Request ---
    req_date = (date.today() + timedelta(days=2)).isoformat()
    req_res = client.post("/api/requests", headers=cust_headers, json={
        "category_id": elec_cat["id"],
        "address_id": address_id,
        "title": "Short circuit in kitchen switchboard",
        "description": "Main circuit breaker trips whenever the refrigerator turns on. Need urgent inspection.",
        "preferred_date": req_date,
        "preferred_time_slot": "10:00 AM - 01:00 PM"
    })
    assert req_res.status_code == 201
    service_request = req_res.json()
    request_id = service_request["id"]
    assert service_request["status"] == "open"

    # --- Step 4: Provider views open requests and submits a Quotation ---
    avail_res = client.get("/api/requests/available", headers=prov_headers)
    assert avail_res.status_code == 200
    avail_requests = avail_res.json()
    assert any(r["id"] == request_id for r in avail_requests)

    quote_res = client.post("/api/quotations", headers=prov_headers, json={
        "request_id": request_id,
        "quoted_amount": 350.00,
        "work_description": "Comprehensive insulation testing and replacement of faulty 16A modular switch.",
        "estimated_duration_hours": 1.0,
        "proposed_date": req_date,
        "proposed_time_slot": "10:00 AM - 01:00 PM",
        "additional_terms": "Includes 30 days service warranty."
    })
    assert quote_res.status_code == 201
    quotation = quote_res.json()
    quote_id = quotation["id"]
    assert quotation["status"] == "submitted"

    # --- Step 5: Customer accepts Quotation (creates confirmed booking) ---
    accept_res = client.post(f"/api/quotations/{quote_id}/accept", headers=cust_headers)
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    booking_id = accept_data["booking_id"]
    assert accept_data["status"] == "confirmed"

    # --- Step 6: Customer checks booking detail & payment ---
    bk_res = client.get(f"/api/bookings/{booking_id}", headers=cust_headers)
    assert bk_res.status_code == 200
    booking_data = bk_res.json()
    assert booking_data["current_status"] == "confirmed"
    assert float(booking_data["total_amount"]) == 350.00
    assert len(booking_data["status_history"]) >= 1

    # --- Step 7: Provider updates job execution lifecycle ---
    # on_the_way
    s1 = client.patch(f"/api/bookings/{booking_id}/status", headers=prov_headers, json={
        "new_status": "on_the_way",
        "change_notes": "Departed workshop on motorcycle towards customer address in Civil Lines."
    })
    assert s1.status_code == 200
    assert s1.json()["current_status"] == "on_the_way"

    # in_progress
    s2 = client.patch(f"/api/bookings/{booking_id}/status", headers=prov_headers, json={
        "new_status": "in_progress",
        "change_notes": "Arrived on-site. Testing socket voltages with multimeter."
    })
    assert s2.status_code == 200
    assert s2.json()["current_status"] == "in_progress"

    # completed
    s3 = client.patch(f"/api/bookings/{booking_id}/status", headers=prov_headers, json={
        "new_status": "completed",
        "change_notes": "Faulty switch replaced. Wiring secured and tested under load."
    })
    assert s3.status_code == 200
    assert s3.json()["current_status"] == "completed"

    # --- Step 8: Customer submits a review on the completed booking ---
    rev_res = client.post("/api/reviews", headers=cust_headers, json={
        "booking_id": booking_id,
        "rating": 5,
        "comment": "Excellent and prompt work! Arrived on time and resolved the kitchen circuit issue."
    })
    assert rev_res.status_code == 201
    review_data = rev_res.json()
    assert review_data["rating"] == 5

    # --- Step 9: Verify duplicate review prevention ---
    dup_res = client.post("/api/reviews", headers=cust_headers, json={
        "booking_id": booking_id,
        "rating": 4,
        "comment": "Trying to review again"
    })
    assert dup_res.status_code == 400
    assert "already been submitted" in dup_res.json()["detail"]

    # --- Step 10: Admin checks platform analytics ---
    analytics_res = client.get("/api/admin/analytics", headers=admin_headers)
    assert analytics_res.status_code == 200
    metrics = analytics_res.json()["metrics"]
    assert metrics["total_bookings"] >= 1
    assert metrics["completed_bookings"] >= 1
    assert metrics["verified_providers"] >= 1
