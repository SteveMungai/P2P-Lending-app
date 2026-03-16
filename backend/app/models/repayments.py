from app.extensions import db
from datetime import datetime

class Repayment(db.Model):
    __tablename__ = "repayments"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey("loans.id"))
    amount_paid = db.Column(db.Numeric(12,2), nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)