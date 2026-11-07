import pytest

from app import create_app
from app.extensions import db
from app.models.loan import Loan
from app.models.user import User
from tests.conftest import register_and_login


#  configuration / secrets
def test_app_refuses_to_start_without_secrets(monkeypatch):
    monkeypatch.setattr("app.config.Config.JWT_SECRET_KEY", None)
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        create_app({"SQLALCHEMY_DATABASE_URI": "sqlite://"})


def test_app_refuses_short_jwt_secret():
    with pytest.raises(RuntimeError, match="at least 32"):
        create_app({"SQLALCHEMY_DATABASE_URI": "sqlite://", "JWT_SECRET_KEY": "short"})


# generic API behaviour 
def test_unknown_route_returns_json_404(client):
    r = client.get("/api/nope")
    assert r.status_code == 404 and "error" in r.get_json()


def test_wrong_method_returns_json_405(client):
    r = client.delete("/api/loans/")
    assert r.status_code == 405 and "error" in r.get_json()


def test_trailing_slash_is_optional(client, loan):
    assert client.get("/api/loans").status_code == 200
    assert client.get("/api/loans/").status_code == 200


def test_missing_and_bad_tokens_are_401_json(client):
    r = client.get("/api/users/me")
    assert r.status_code == 401 and r.get_json()["error"]
    r = client.get("/api/users/me", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401 and r.get_json()["error"]


# ── auth ───────────────────────────────────────────────────────────────
def test_register_validation(client):
    bad = [
        {},
        {"full_name": "A", "email": "not-an-email", "password": "Password123!"},
        {"full_name": "A", "email": "a@b.co", "password": "short"},
        {"full_name": "A", "email": "a@b.co"},                       # no password (used to be a 500)
        {"full_name": "A", "email": "a@b.co", "password": "x" * 100},  # > 72 bytes
    ]
    for body in bad:
        r = client.post("/api/auth/register", json=body)
        assert r.status_code == 400, body


def test_register_duplicate_email_is_case_insensitive(client):
    register_and_login(client, "One", "dup@example.com")
    r = client.post("/api/auth/register", json={
        "full_name": "Two", "email": "DUP@Example.com", "password": "Password123!"})
    assert r.status_code == 409


def test_login_rules(client):
    register_and_login(client, "Log In", "login@example.com")
    assert client.post("/api/auth/login", json={"email": "LOGIN@example.com", "password": "Password123!"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "login@example.com", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "login@example.com"}).status_code == 400   # used to crash
    assert client.post("/api/auth/login", json={}).status_code == 400


# ── users ──────────────────────────────────────────────────────────────
def test_old_create_user_route_is_gone(client):
    r = client.post("/api/users/", json={"full_name": "X", "email": "x@y.zz"})
    assert r.status_code == 405


def test_user_list_needs_login_and_hides_emails(client, borrower):
    assert client.get("/api/users/").status_code == 401
    r = client.get("/api/users/", headers=borrower["headers"])
    assert r.status_code == 200
    assert all(set(u) == {"id", "name"} for u in r.get_json())


def test_me_returns_summary(client, investor):
    r = client.get("/api/users/me", headers=investor["headers"])
    assert r.status_code == 200
    assert r.get_json()["available_funds"] == 10000
    assert r.get_json()["portfolio_value"] == 0


# ── loans ──────────────────────────────────────────────────────────────
def test_create_loan_requires_login_and_ignores_spoofed_fields(client, borrower):
    assert client.post("/api/loans/", json={}).status_code == 401
    r = client.post("/api/loans/", headers=borrower["headers"], json={
        "amount_requested": 1000, "interest_rate": 5, "duration_months": 6,
        "borrower_id": 999, "amount_funded": 999})
    assert r.status_code == 201
    loan = db.session.get(Loan, r.get_json()["loan_id"])
    assert loan.borrower_id == borrower["id"] and loan.amount_funded == 0


@pytest.mark.parametrize("body", [
    {"amount_requested": -5, "interest_rate": 12, "duration_months": 12},
    {"amount_requested": "abc", "interest_rate": 12, "duration_months": 12},
    {"amount_requested": 100, "interest_rate": 150, "duration_months": 12},
    {"amount_requested": 100, "interest_rate": 10, "duration_months": 0},
    {"amount_requested": 100, "interest_rate": 10, "duration_months": 12.5},
    {"amount_requested": 100.123, "interest_rate": 10, "duration_months": 12},
    {"interest_rate": 10, "duration_months": 3},
])
def test_create_loan_validation(client, borrower, body):
    assert client.post("/api/loans/", headers=borrower["headers"], json=body).status_code == 400


def _make(client, who, amount, rate, purpose):
    r = client.post("/api/loans/", headers=who["headers"], json={
        "amount_requested": amount, "interest_rate": rate,
        "duration_months": 12, "purpose": purpose})
    assert r.status_code == 201
    return r.get_json()["loan_id"]


def test_filters_and_search(client, borrower):
    _make(client, borrower, 1000, 5, "Fish pond")        # Low
    _make(client, borrower, 5000, 12, "Taxi repairs")     # Medium
    _make(client, borrower, 9000, 25, "50%_off stock")    # High

    def ids(qs):
        r = client.get("/api/loans/" + qs)
        assert r.status_code == 200, r.get_json()
        return sorted(l["amount"] for l in r.get_json())

    assert ids("") == [1000, 5000, 9000]
    assert ids("?risk=Low") == [1000]
    assert ids("?risk=medium") == [5000]
    assert ids("?risk=High") == [9000]
    assert ids("?minAmount=2000&maxAmount=6000") == [5000]
    assert ids("?minAmount=0&maxAmount=1000") == [1000]          # 0 is a real value
    assert ids("?status=open") == [1000, 5000, 9000]
    assert ids("?status=funded") == []
    assert ids("?q=taxi") == [5000]
    assert ids("?q=bea") == [1000, 5000, 9000]                   # borrower name
    assert ids("?q=%25") == [9000]                               # '%' is literal, not a wildcard
    # the formerly broken routes
    assert client.get("/api/loans/filter?risk=High").status_code == 200
    assert client.get("/api/loans/search?q=fish").get_json()[0]["name"] == "Bea Borrower"
    # bad input is a clean 400
    for qs in ("?risk=Extreme", "?minAmount=abc", "?status=nope", "?maxAmount=-1"):
        assert client.get("/api/loans/" + qs).status_code == 400, qs


def test_loan_card_shape_and_privacy(client, loan):
    card = client.get("/api/loans/").get_json()[0]
    for key in ("id", "name", "image", "amount", "funded", "progress", "rate", "term", "risk", "purpose", "status"):
        assert key in card
    assert isinstance(card["amount"], float)
    one = client.get(f"/api/loans/{loan}").get_json()
    assert "email" not in one and one["rating"] is not None
    assert client.get("/api/loans/999").status_code == 404


def test_my_loans_and_user_loans_are_private(client, borrower, investor, loan):
    assert client.get("/api/loans/mine").status_code == 401
    mine = client.get("/api/loans/mine", headers=borrower["headers"]).get_json()
    assert [l["id"] for l in mine] == [loan]
    assert client.get("/api/loans/mine", headers=investor["headers"]).get_json() == []
    assert client.get(f"/api/loans/user/{borrower['id']}", headers=borrower["headers"]).status_code == 200
    assert client.get(f"/api/loans/user/{borrower['id']}", headers=investor["headers"]).status_code == 403


def test_image_urls_are_absolute(client, borrower, loan):
    user = db.session.get(User, borrower["id"])
    user.image_url = "/images/borrower1.jpg"
    db.session.commit()
    assert client.get("/api/loans/").get_json()[0]["image"] == "http://localhost/images/borrower1.jpg"


def test_images_are_served_from_public_folder(client):
    r = client.get("/images/borrower1.jpg")
    assert r.status_code == 200 and r.mimetype == "image/jpeg"
    missing = client.get("/images/does-not-exist.jpg")
    assert missing.status_code == 404 and "error" in missing.get_json()


# ── investments ────────────────────────────────────────────────────────
def invest(client, who, loan_id, amount, **extra):
    return client.post("/api/investments/", headers=who["headers"],
                       json={"loan_id": loan_id, "amount_invested": amount, **extra})


def test_investing_requires_login(client, loan):
    r = client.post("/api/investments/", json={"loan_id": loan, "amount_invested": 100})
    assert r.status_code == 401


def test_investing_moves_money_and_updates_loan(client, investor, loan):
    r = invest(client, investor, loan, 2000)
    assert r.status_code == 201, r.get_json()
    body = r.get_json()
    assert body["available_funds"] == 8000
    assert body["loan"]["funded"] == 2000 and body["loan"]["progress"] == 40 and body["loan"]["status"] == "open"

    me = client.get("/api/users/me", headers=investor["headers"]).get_json()
    assert me["available_funds"] == 8000 and me["portfolio_value"] == 2000
    card = client.get("/api/loans/").get_json()[0]
    assert card["funded"] == 2000 and card["progress"] == 40


def test_loan_becomes_funded_when_goal_reached_then_closes_to_investors(client, investor, loan):
    assert invest(client, investor, loan, 5000).status_code == 201
    assert client.get(f"/api/loans/{loan}").get_json()["status"] == "funded"
    r = invest(client, investor, loan, 1)
    assert r.status_code == 400 and "no longer open" in r.get_json()["error"]


def test_investor_comes_from_token_not_body(client, investor, borrower, loan):
    r = invest(client, investor, loan, 100, investor_id=borrower["id"])
    assert r.status_code == 201
    mine = client.get("/api/investments/", headers=investor["headers"]).get_json()
    assert mine[0]["amount"] == 100
    assert mine[0]["risk"] == "Medium" and mine[0]["rate"] == 12   # used by the dashboard's risk mix
    assert client.get("/api/investments/", headers=borrower["headers"]).get_json() == []


@pytest.mark.parametrize("amount, status, text", [
    (20000, 400, "Only KES 5,000.00"),     # more than the loan still needs
    (0, 400, "greater than 0"),
    (-5, 400, "greater than 0"),
    ("abc", 400, "number"),
    (True, 400, "number"),
    (10.555, 400, "2 decimal"),
])
def test_invalid_amounts_are_400_not_500(client, investor, loan, amount, status, text):
    r = invest(client, investor, loan, amount)
    assert r.status_code == status and text in r.get_json()["error"]


def test_insufficient_balance_changes_nothing(client, investor, loan):
    user = db.session.get(User, investor["id"])
    user.balance = 100
    db.session.commit()
    r = invest(client, investor, loan, 500)
    assert r.status_code == 400 and "Insufficient" in r.get_json()["error"]
    assert client.get("/api/users/me", headers=investor["headers"]).get_json()["available_funds"] == 100
    assert client.get(f"/api/loans/{loan}").get_json()["funded"] == 0


def test_cannot_invest_in_own_loan_or_missing_loan(client, borrower, investor, loan):
    assert invest(client, borrower, loan, 100).status_code == 403
    assert invest(client, investor, 999, 100).status_code == 404
    assert client.post("/api/investments/", headers=investor["headers"], json={"loan_id": loan}).status_code == 400
    assert client.post("/api/investments/", headers=investor["headers"], json={}).status_code == 400


def test_old_investment_user_route_is_gone(client, investor):
    assert client.get("/api/investments/user/1", headers=investor["headers"]).status_code == 404


# ── repayments ─────────────────────────────────────────────────────────
def repay(client, who, loan_id, amount):
    return client.post("/api/repayments/", headers=who["headers"], json={"loan_id": loan_id, "amount_paid": amount})


def test_repayment_rules(client, borrower, investor, loan):
    assert client.post("/api/repayments/", json={}).status_code == 401
    assert repay(client, borrower, loan, 100).status_code == 400          # still open
    invest(client, investor, loan, 5000)
    assert repay(client, investor, loan, 100).status_code == 403          # not the borrower
    assert repay(client, borrower, loan, -1).status_code == 400
    assert repay(client, borrower, 999, 100).status_code == 404
    assert repay(client, borrower, loan, 450).status_code == 201

    mine = client.get("/api/repayments/", headers=borrower["headers"]).get_json()
    assert len(mine) == 1 and mine[0]["amount"] == 450 and isinstance(mine[0]["date"], str)
    assert client.get("/api/repayments/", headers=investor["headers"]).get_json() == []
    assert client.get("/api/repayments/").status_code == 401
    assert client.get("/api/repayments/user/1", headers=borrower["headers"]).status_code == 404


# ── maintenance command ────────────────────────────────────────────────
def test_reconcile_funding_command(app, client, investor, loan):
    from app.models.investments import Investment
    # simulate data saved by the OLD buggy code: investment exists, loan untouched
    db.session.add(Investment(investor_id=investor["id"], loan_id=loan, amount_invested=5000))
    db.session.commit()
    result = app.test_cli_runner().invoke(args=["reconcile-funding"])
    assert "Reconciled 1 loan(s)" in result.output
    one = client.get(f"/api/loans/{loan}").get_json()
    assert one["funded"] == 5000 and one["status"] == "funded"


# ── deployment (Vercel / Supabase) ─────────────────────────────────────
def test_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.get_json() == {"status": "ok", "database": "ok"}


def test_health_reports_database_down(client, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("db down")
    monkeypatch.setattr(db.session, "execute", boom)
    r = client.get("/api/health")
    assert r.status_code == 503 and r.get_json()["database"] == "unreachable"


def test_supabase_urls_get_sslmode_and_driver(monkeypatch):
    from app.config import _database_url
    monkeypatch.setenv("DATABASE_URL", "postgres://postgres.abc:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres")
    assert _database_url() == (
        "postgresql+psycopg2://postgres.abc:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require")
    # an explicit sslmode is never overridden, and non-Supabase hosts are left alone
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db.abc.supabase.co:5432/postgres?sslmode=verify-full")
    assert _database_url().endswith("?sslmode=verify-full")
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost:5432/p2p_lending")
    assert _database_url() == "postgresql+psycopg2://u:p@localhost:5432/p2p_lending"


def test_serverless_pool_is_a_single_connection():
    from app.config import build_engine_options
    assert build_engine_options(True)["pool_size"] == 1 and build_engine_options(True)["max_overflow"] == 0
    assert "pool_size" not in build_engine_options(False)
    assert build_engine_options(False)["pool_pre_ping"] is True


def test_image_links_use_https_behind_a_proxy(borrower, loan):
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://", "TRUST_PROXY": True,
                      "JWT_SECRET_KEY": "test-secret-key-that-is-long-enough-12345"})
    with app.app_context():
        db.create_all()
        u = User(full_name="P", email="p@x.test", password="x", image_url="/images/borrower1.jpg")
        db.session.add(u); db.session.commit()
        db.session.add(Loan(borrower_id=u.id, amount_requested=100, interest_rate=5, duration_months=3))
        db.session.commit()
        r = app.test_client().get("/api/loans/", headers={"X-Forwarded-Proto": "https", "X-Forwarded-Host": "api.example.com"})
        assert r.get_json()[0]["image"] == "https://api.example.com/images/borrower1.jpg"
        db.session.remove(); db.drop_all()
