from backend.models.loan import Loan
from app.extensions import db

def create_loan(data):
    loan = Loan(
        borrower_id=data["borrower_id"],
        amount_requested=data["amount"],
        interest_rate=data["interest_rate"],
        duration_months=data["duration"]
    )
    db.session.add(loan)
    db.session.commit()
    return loan