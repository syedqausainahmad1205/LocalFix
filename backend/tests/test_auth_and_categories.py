from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_welcome():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "LocalFix API"
    assert data["locality"] in ["All Cities", "Aligarh"]


def test_get_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) >= 6
    names = [c["name"] for c in categories]
    assert "Electrician" in names
    assert "Plumber" in names


def test_login_and_me():
    # 1. Login as seeded customer
    response = client.post("/api/auth/login", json={
        "email": "customer@localfix.com",
        "password": "customer123"
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["role"] == "customer"
    token = token_data["access_token"]

    # 2. Access /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user = me_resp.json()
    assert user["email"] == "customer@localfix.com"
    assert user["full_name"] == "Mohd Zaid"
    assert user["customer_profile"] is not None
    assert user["customer_profile"]["preferred_locality"] == "Civil Lines, Aligarh"


import uuid
import random


def test_register_new_customer():
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    unique_phone = f"+9198{random.randint(10000000, 99999999)}"
    response = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "securepassword123",
        "full_name": "Tariq Mansoor",
        "phone": unique_phone,
        "role": "customer"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert data["role"] == "customer"
    assert "access_token" in data
