from app.models.loan import Loan
from app.extensions import db

def create_loan(data):
    # Validate required fields
    required_fields = ["borrower_id", "amount_requested","amount_funded", "interest_rate", "duration_months"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate numeric values
    for field in ["amount_requested", "interest_rate", "duration_months"]:
        if isinstance(data[field], bool) or not isinstance(data[field], (int, float)):
            raise ValueError(f"{field} must be a number")

    purpose = (data.get("purpose") or "").strip()
    if len(purpose) > 200:
        raise ValueError("Purpose must be 200 characters or fewer")

    if data["amount_requested"] <= 0:
        raise ValueError("Amount must be greater than 0")
    if not (0 < data["interest_rate"] <= 100):
        raise ValueError("Interest rate must be between 0 and 100")
    if data["duration_months"] <= 0:
        raise ValueError("Duration must be greater than 0 months")

    # Create loan instance
    loan = Loan(
        borrower_id=data["borrower_id"],
        amount_requested=data["amount_requested"],
        amount_funded=data["amount_funded"],
        interest_rate=data["interest_rate"],
        duration_months=int(data["duration_months"]),
        purpose=purpose or None
    )

    try:
        db.session.add(loan)
        db.session.commit()
        return loan  # returns the created loan object
    except Exception as e:
        db.session.rollback()  # rollback on error
        raise e