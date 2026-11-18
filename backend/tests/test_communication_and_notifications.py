import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.communication import Notification, Conversation, Message
from app.models.booking import Booking
from app.models.user import User

client = TestClient(app)

CUSTOMER_CREDS = {"email": "customer@localfix.com", "password": "customer123"}
PROVIDER_CREDS = {"email": "electrician@localfix.com", "password": "provider123"}


def get_token(creds):
    res = client.post("/api/auth/login", json=creds)
    assert res.status_code == 200, f"Login failed for {creds['email']}: {res.text}"
    return res.json()["access_token"]


def test_notifications_lifecycle():
    token = get_token(CUSTOMER_CREDS)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ensure test notifications exist for the customer
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == CUSTOMER_CREDS["email"]).first()
        assert user is not None

        # Add a couple of unread test notifications
        notif1 = Notification(
            user_id=user.id,
            title="Booking Confirmed",
            message="Your electrician booking has been confirmed.",
            notification_type="BOOKING_STATUS",
            is_read=False
        )
        notif2 = Notification(
            user_id=user.id,
            title="Quotation Received",
            message="You received a new quote for AC repair.",
            notification_type="QUOTATION",
            is_read=False
        )
        db.add_all([notif1, notif2])
        db.commit()
        db.refresh(notif1)
        db.refresh(notif2)
        notif1_id = notif1.id
        notif2_id = notif2.id
    finally:
        db.close()

    # 2. Fetch notifications
    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 2
    unread_ids = [n["id"] for n in notifs if not n["is_read"]]
    assert str(notif1_id) in unread_ids
    assert str(notif2_id) in unread_ids

    # 3. Mark single notification as read
    patch_res = client.patch(f"/api/notifications/{notif1_id}/read", headers=headers)
    assert patch_res.status_code == 200

    # Verify notif1 is now read
    res_after = client.get("/api/notifications", headers=headers)
    found1 = next(n for n in res_after.json() if n["id"] == str(notif1_id))
    assert found1["is_read"] is True

    # 4. Mark all as read
    all_res = client.patch("/api/notifications/read-all", headers=headers)
    assert all_res.status_code == 200

    res_all_read = client.get("/api/notifications", headers=headers)
    assert all(n["is_read"] is True for n in res_all_read.json())


def test_booking_chat_messages_rest_and_security():
    cust_token = get_token(CUSTOMER_CREDS)
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Find an active booking for this customer
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == CUSTOMER_CREDS["email"]).first()
        booking = (
            db.query(Booking)
            .filter(Booking.customer.has(user_id=user.id))
            .first()
        )
        assert booking is not None, "Customer should have at least one booking from seed"
        booking_id = booking.id
    finally:
        db.close()

    # 1. Fetch message history
    history_res = client.get(f"/api/messages/booking/{booking_id}", headers=cust_headers)
    assert history_res.status_code == 200
    assert isinstance(history_res.json(), list)

    # 2. Send a new message via REST
    send_res = client.post(
        f"/api/messages/booking/{booking_id}",
        headers=cust_headers,
        json={"content": "Hello, please bring spare wiring tools as discussed."}
    )
    assert send_res.status_code == 201
    msg_data = send_res.json()
    assert msg_data["content"] == "Hello, please bring spare wiring tools as discussed."
    assert msg_data["sender_name"] is not None

    # 3. Verify message is in history
    history_after = client.get(f"/api/messages/booking/{booking_id}", headers=cust_headers)
    assert history_after.status_code == 200
    contents = [m["content"] for m in history_after.json()]
    assert "Hello, please bring spare wiring tools as discussed." in contents

    # 4. Security: Anonymous user cannot read or post messages
    anon_get = client.get(f"/api/messages/booking/{booking_id}")
    assert anon_get.status_code in [401, 403]

    anon_post = client.post(
        f"/api/messages/booking/{booking_id}",
        json={"content": "Malicious injected chat message"}
    )
    assert anon_post.status_code in [401, 403]
