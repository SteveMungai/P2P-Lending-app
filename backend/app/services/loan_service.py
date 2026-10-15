from app.errors import ApiError
from app.extensions import db
from app.models.loan import Loan
from app.utils import parse_int, parse_money


def create_loan(borrower_id, data):
    """Create an open loan request for `borrower_id` (the logged-in user)."""
    for field in ("amount_requested", "interest_rate", "duration_months"):
        if field not in data:
            raise ApiError(f"Missing required field: {field}")

    amount = parse_money(data["amount_requested"], "amount_requested")

    rate = data["interest_rate"]
    if isinstance(rate, bool) or not isinstance(rate, (int, float)):
        raise ApiError("interest_rate must be a number")
    if not (0 < rate <= 100):
        raise ApiError("Interest rate must be between 0 and 100")

    months = parse_int(data["duration_months"], "duration_months")
    if not (1 <= months <= 120):
        raise ApiError("Duration must be between 1 and 120 months")

    purpose = data.get("purpose")
    if purpose is not None and not isinstance(purpose, str):
        raise ApiError("Purpose must be text")
    purpose = (purpose or "").strip()
    if len(purpose) > 200:
        raise ApiError("Purpose must be 200 characters or fewer")

    loan = Loan(
        borrower_id=borrower_id,
        amount_requested=amount,
        amount_funded=0,  # a new loan has nothing funded yet
        interest_rate=float(rate),
        duration_months=months,
        purpose=purpose or None,
    )

    try:
        db.session.add(loan)
        db.session.commit()
        return loan
    except Exception:
        db.session.rollback()
        raise
