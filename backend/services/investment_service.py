from backend.models.investments import Investment
from backend.models.loan import Loan
from app.extensions import db
from sqlalchemy import func

def invest(data):
    investment = Investment(
        investor_id=data["investor_id"],
        loan_id=data["loan_id"],
        amount_invested=data["amount"]
    )
    db.session.add(investment)

    # Check total funded
    total = db.session.query(func.sum(Investment.amount_invested))\
        .filter_by(loan_id=data["loan_id"]).scalar() or 0

    loan = Loan.query.get(data["loan_id"])

    if total >= loan.amount_requested:
        loan.status = "funded"

    db.session.commit()
    return investment