import os

import pytest

from app import create_app
from app.extensions import db


@pytest.fixture()
def app():
    app = create_app({
        "TESTING": True,
        # set TEST_DATABASE_URL to run the suite against PostgreSQL instead of SQLite
        "SQLALCHEMY_DATABASE_URI": os.getenv("TEST_DATABASE_URL", "sqlite://").replace("postgresql://", "postgresql+psycopg2://", 1),
        "JWT_SECRET_KEY": "test-secret-key-that-is-long-enough-12345",
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register_and_login(client, name, email, password="Password123!"):
    r = client.post("/api/auth/register", json={
        "full_name": name, "email": email, "password": password})
    assert r.status_code == 201, r.get_json()
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    data = r.get_json()
    return {"id": data["user"]["id"], "headers": {"Authorization": f"Bearer {data['token']}"}}


@pytest.fixture()
def borrower(client):
    return register_and_login(client, "Bea Borrower", "bea@example.com")


@pytest.fixture()
def investor(client, app):
    u = register_and_login(client, "Ian Investor", "ian@example.com")
    from app.models.user import User
    user = db.session.get(User, u["id"])
    user.balance = 10000          # known starting balance
    db.session.commit()
    return u


@pytest.fixture()
def loan(client, borrower):
    r = client.post("/api/loans/", headers=borrower["headers"], json={
        "amount_requested": 5000, "interest_rate": 12,
        "duration_months": 12, "purpose": "Shop stock"})
    assert r.status_code == 201
    return r.get_json()["loan_id"]
