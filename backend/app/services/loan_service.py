from app.models.loan import Loan
from app.extensions import db

def create_loan(data):
    # Validate required fields
    required_fields = ["borrower_id", "amount", "interest_rate", "duration"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate numeric values
    if data["amount"] <= 0:
        raise ValueError("Amount must be greater than 0")
    if not (0 < data["interest_rate"] <= 100):
        raise ValueError("Interest rate must be between 0 and 100")
    if data["duration"] <= 0:
        raise ValueError("Duration must be greater than 0 months")

    # Create loan instance
    loan = Loan(
        borrower_id=data["borrower_id"],
        amount_requested=data["amount"],
        interest_rate=data["interest_rate"],
        duration_months=data["duration"]
    )

    try:
        db.session.add(loan)
        db.session.commit()
        return loan  # returns the created loan object
    except Exception as e:
        db.session.rollback()  # rollback on error
        raise e