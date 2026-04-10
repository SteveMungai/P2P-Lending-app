from app.models.repayments import Repayment
from app.extensions import db

def record_repayment(data):
    # Validate required fields
    if "loan_id" not in data or "amount" not in data:
        raise ValueError("Missing required fields: loan_id or amount")

    repayment = Repayment(
        loan_id=data["loan_id"],
        amount_paid=data["amount"]
    )

    try:
        db.session.add(repayment)
        db.session.commit()
        return repayment  # returns the repayment object
    except Exception as e:
        db.session.rollback()  # rollback on error
        raise e