from app.models.repayment import Repayment
from app.extensions import db

def record_repayment(data):
    repayment = Repayment(
        loan_id=data["loan_id"],
        amount_paid=data["amount"]
    )
    db.session.add(repayment)
    db.session.commit()
    return repayment