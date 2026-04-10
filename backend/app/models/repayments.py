from app.extensions import db
from datetime import datetime

class Repayment(db.Model):
    __tablename__ = "repayments"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey("loans.id"), nullable=False)
    amount_paid = db.Column(db.Numeric(12, 2), nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # One-to-many relationship to access the loan directly
    loan = db.relationship("Loan", backref=db.backref("repayments", lazy=True))

    def to_dict(self):
        """Serialize repayment for JSON responses."""
        return {
            "id": self.id,
            "loan_id": self.loan_id,
            "amount_paid": float(self.amount_paid),
            "payment_date": self.payment_date.isoformat()
        }

    def __repr__(self):
        return f"<Repayment {self.id} - Loan {self.loan_id} - {self.amount_paid}>"