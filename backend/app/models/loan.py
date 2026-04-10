from app.extensions import db
from datetime import datetime

class Loan(db.Model):
    __tablename__ = "loans"

    id = db.Column(db.Integer, primary_key=True)
    borrower_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount_requested = db.Column(db.Numeric(12, 2), nullable=False)
    interest_rate = db.Column(db.Float, nullable=False)
    duration_months = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default="open", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    amount_funded = db.Column(db.Numeric(12, 2), default=0)
    purpose = db.Column(db.String(200))

    # Relationship to access borrower easily
    borrower = db.relationship("User", backref=db.backref("loans", lazy=True))

    def to_dict(self):
        """Serialize loan for JSON responses."""
        return {
            "id": self.id,
            "borrower_id": self.borrower_id,
            "amount_requested": float(self.amount_requested),
            "amount_funded": float(self.amount_funded),
            "interest_rate": self.interest_rate,
            "duration_months": self.duration_months,
            "status": self.status,
            "purpose": self.purpose,
            "created_at": self.created_at.isoformat()
        }

    def __repr__(self):
        return f"<Loan {self.id} - Borrower {self.borrower_id} - {self.amount_requested}>"