from app.extensions import db
from datetime import datetime

class Investment(db.Model):
    __tablename__ = "investments"

    id = db.Column(db.Integer, primary_key=True)
    investor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    loan_id = db.Column(db.Integer, db.ForeignKey("loans.id"), nullable=False)
    amount_invested = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    investor = db.relationship("User", backref=db.backref("investments", lazy=True))
    loan = db.relationship("Loan", backref=db.backref("investments", lazy=True))

    def to_dict(self):
        """Serialize investment for JSON responses."""
        return {
            "id": self.id,
            "investor_id": self.investor_id,
            "loan_id": self.loan_id,
            "amount_invested": float(self.amount_invested),
            "created_at": self.created_at.isoformat()
        }

    def __repr__(self):
        return f"<Investment {self.id} - Investor {self.investor_id} - Loan {self.loan_id} - Amount {self.amount_invested}>"