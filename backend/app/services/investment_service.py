from app.models.investments import Investment
from app.models.loan import Loan
from app.extensions import db
from sqlalchemy import func

def invest(data):
    # Validate required fields
    required_fields = ["investor_id", "loan_id", "amount"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Get the loan
    loan = Loan.query.get(data["loan_id"])
    if not loan:
        raise ValueError("Loan not found")

    # Check amount
    if data["amount"] <= 0:
        raise ValueError("Investment amount must be greater than 0")

    # Create investment
    investment = Investment(
        investor_id=data["investor_id"],
        loan_id=data["loan_id"],
        amount_invested=data["amount"]
    )
    db.session.add(investment)

    try:
        # Commit investment first
        db.session.flush()  # flush to include this investment in the query

        # Calculate total funded including current investment
        total = db.session.query(func.sum(Investment.amount_invested))\
            .filter_by(loan_id=data["loan_id"]).scalar() or 0

        # Update loan status if fully funded
        if total >= loan.amount_requested:
            loan.status = "funded"

        db.session.commit()
        return investment

    except Exception as e:
        db.session.rollback()
        raise e