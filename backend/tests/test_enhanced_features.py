from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token(email: str, password: str) -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_radius_guarantee_and_new_categories():
    # 1. Test search with tight 5km radius guarantees providers returned
    res = client.get("/api/search/providers?max_radius_km=5")
    assert res.status_code == 200
    providers = res.json()
    assert len(providers) >= 1, "Radius guarantee should always return providers"

    # 2. Test maid category
    res_maid = client.get("/api/search/providers?category_slug=maid")
    assert res_maid.status_code == 200
    maids = res_maid.json()
    assert len(maids) >= 1
    assert any("specializations" in m and m["specializations"] is not None for m in maids)

    # 3. Test barber category
    res_barber = client.get("/api/search/providers?category_slug=barber")
    assert res_barber.status_code == 200
    barbers = res_barber.json()
    assert len(barbers) >= 1

    # 4. Test painter category
    res_painter = client.get("/api/search/providers?category_slug=painter")
    assert res_painter.status_code == 200
    painters = res_painter.json()
    assert len(painters) >= 1

    # 5. Test interior-designer category (Noida center coordinates: 28.5355, 77.3910)
    res_interior = client.get("/api/search/providers?category_slug=interior-designer&latitude=28.5355&longitude=77.3910")
    assert res_interior.status_code == 200
    interiors = res_interior.json()
    assert len(interiors) >= 1


def test_fast_track_complaint_and_payments_invoice():
    cust_token = get_token("customer@localfix.com", "customer123")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Get a booking for customer
    bk_res = client.get("/api/bookings/my", headers=cust_headers)
    assert bk_res.status_code == 200
    bookings = bk_res.json()
    assert len(bookings) >= 1
    target_booking = bookings[0]
    booking_id = target_booking["id"]

    # 1. Test fast-track auto-resolve complaint
    comp_res = client.post("/api/complaints", headers=cust_headers, json={
        "booking_id": booking_id,
        "category": "Service Quality Issue",
        "description": "Technician finished quickly but some corners were left uninspected.",
        "preferred_resolution": "instant_refund",
        "auto_resolve": True
    })
    assert comp_res.status_code in [200, 201]
    comp_data = comp_res.json()
    assert comp_data["status"] == "resolved"
    assert "Resolution ID:" in comp_data["resolution_notes"]
    assert "Fast-Track" in comp_data["resolution_notes"]

    # Query complaint for booking
    get_comp = client.get(f"/api/complaints/booking/{booking_id}", headers=cust_headers)
    assert get_comp.status_code == 200
    complaint_list = get_comp.json()
    assert len(complaint_list) >= 1
    assert complaint_list[0]["status"] == "resolved"

    # 2. Test tax invoice endpoint
    inv_res = client.get(f"/api/payments/booking/{booking_id}/invoice", headers=cust_headers)
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert "invoice_number" in inv
    assert "gst_amount" in inv
    assert "total_amount" in inv
    assert inv["customer"]["email"] == "customer@localfix.com"

    # 3. Test reliable REST message send
    msg_res = client.post(f"/api/messages/booking/{booking_id}", headers=cust_headers, json={
        "content": "Hello, when can I expect the invoice copy?"
    })
    assert msg_res.status_code == 201
    msg_data = msg_res.json()
    assert msg_data["content"] == "Hello, when can I expect the invoice copy?"
    assert "conversation_id" in msg_data
    assert "sender_name" in msg_data
