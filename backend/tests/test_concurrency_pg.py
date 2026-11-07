"""Needs real row locking, so it only runs against PostgreSQL:

    TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/p2p_test pytest
"""
import os
import threading

import pytest
from flask_jwt_extended import create_access_token

from app.extensions import bcrypt, db
from app.models.investments import Investment
from app.models.loan import Loan
from app.models.user import User

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL", "").startswith("postgres"),
    reason="row-locking test needs PostgreSQL (set TEST_DATABASE_URL)",
)


def _user(name, balance):
    u = User(full_name=name, email=f"{name}@race.test", balance=balance,
             password=bcrypt.generate_password_hash("x").decode())
    db.session.add(u)
    db.session.commit()
    return u.id


def _fire(app, tokens, loan_id, amount):
    statuses, barrier = [], threading.Barrier(len(tokens))

    def go(token):
        client = app.test_client()
        barrier.wait()  # everyone submits at the same instant
        r = client.post("/api/investments/", headers={"Authorization": f"Bearer {token}"},
                        json={"loan_id": loan_id, "amount_invested": amount})
        statuses.append(r.status_code)

    threads = [threading.Thread(target=go, args=(t,)) for t in tokens]
    [t.start() for t in threads]
    [t.join() for t in threads]
    return statuses


def test_simultaneous_investments_never_overfund_a_loan(app):
    borrower = _user("borrower", 0)
    investors = [_user(f"inv{i}", 10000) for i in range(8)]
    loan = Loan(borrower_id=borrower, amount_requested=5000, interest_rate=10,
                duration_months=12, amount_funded=0)
    db.session.add(loan)
    db.session.commit()
    tokens = [create_access_token(identity=str(i)) for i in investors]

    statuses = _fire(app, tokens, loan.id, 1000)   # 8 x 1000 into a 5000 loan

    db.session.expire_all()
    loan = db.session.get(Loan, loan.id)
    total = sum(i.amount_invested for i in Investment.query.filter_by(loan_id=loan.id))
    assert statuses.count(201) == 5
    assert loan.amount_funded == 5000 == total
    assert loan.status == "funded"


def test_same_balance_cannot_be_spent_twice(app):
    borrower = _user("borrower", 0)
    poor = _user("poor", 1500)
    loan = Loan(borrower_id=borrower, amount_requested=9000, interest_rate=10,
                duration_months=12, amount_funded=0)
    db.session.add(loan)
    db.session.commit()
    token = create_access_token(identity=str(poor))

    statuses = _fire(app, [token, token], loan.id, 1000)   # 2 x 1000 with only 1500

    db.session.expire_all()
    assert statuses.count(201) == 1
    assert db.session.get(User, poor).balance == 500
