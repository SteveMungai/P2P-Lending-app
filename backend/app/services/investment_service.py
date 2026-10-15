from app.errors import ApiError
from app.extensions import db
from app.models.investments import Investment
from app.models.loan import Loan
from app.models.user import User
from app.utils import parse_int, parse_money


def invest(investor_id, data):
    """Invest in a loan as `investor_id` (always taken from the login token).

    Everything happens in ONE transaction, so money can never be taken from
    the investor without the loan being credited (or the other way round):
      1. validate the request
      2. check the loan is open, has room, and the investor can afford it
      3. deduct the investor's balance, raise loans.amount_funded
      4. mark the loan "funded" when the goal is reached
    """
    if "loan_id" not in data:
        raise ApiError("Missing required field: loan_id")
    if "amount_invested" not in data:
        raise ApiError("Missing required field: amount_invested")

    loan_id = parse_int(data["loan_id"], "loan_id")
    amount = parse_money(data["amount_invested"], "amount_invested")

    try:
        # Lock the rows (PostgreSQL) so two people can't over-fund the same
        # loan, or spend the same balance twice, at the same moment.
        loan = db.session.query(Loan).filter_by(id=loan_id).with_for_update().first()
        if not loan:
            raise ApiError("Loan not found", 404)

        investor = (
            db.session.query(User).filter_by(id=investor_id).with_for_update().first()
        )
        if not investor:
            raise ApiError("User not found", 404)

        if loan.borrower_id == investor.id:
            raise ApiError("You can't invest in your own loan", 403)
        if loan.status != "open":
            raise ApiError("This loan is no longer open for funding")

        funded = loan.amount_funded or 0
        remaining = loan.amount_requested - funded
        if amount > remaining:
            raise ApiError(
                f"Only KES {remaining:,.2f} is still needed for this loan"
            )
        if investor.balance < amount:
            raise ApiError(
                f"Insufficient balance. You have KES {investor.balance:,.2f} available"
            )

        investor.balance = investor.balance - amount
        investor.total_invested = (investor.total_invested or 0) + amount
        loan.amount_funded = funded + amount
        if loan.amount_funded >= loan.amount_requested:
            loan.status = "funded"

        investment = Investment(
            investor_id=investor.id, loan_id=loan.id, amount_invested=amount
        )
        db.session.add(investment)
        db.session.commit()
        return investment
    except Exception:
        db.session.rollback()
        raise
