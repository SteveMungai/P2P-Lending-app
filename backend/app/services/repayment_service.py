from app.errors import ApiError
from app.extensions import db
from app.models.loan import Loan
from app.models.repayments import Repayment
from app.utils import parse_int, parse_money


def record_repayment(user_id, data):
    """Record a repayment made by `user_id`, who must be the loan's borrower."""
    if "loan_id" not in data:
        raise ApiError("Missing required field: loan_id")
    if "amount_paid" not in data:
        raise ApiError("Missing required field: amount_paid")

    loan_id = parse_int(data["loan_id"], "loan_id")
    amount = parse_money(data["amount_paid"], "amount_paid")

    loan = db.session.get(Loan, loan_id)
    if not loan:
        raise ApiError("Loan not found", 404)
    if loan.borrower_id != user_id:
        raise ApiError("Only the borrower can repay this loan", 403)
    if loan.status == "open":
        raise ApiError("This loan hasn't been fully funded yet")
    if loan.status == "closed":
        raise ApiError("This loan is already closed")

    try:
        repayment = Repayment(loan_id=loan.id, amount_paid=amount)
        db.session.add(repayment)
        db.session.commit()
        return repayment
    except Exception:
        db.session.rollback()
        raise
