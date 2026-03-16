from app.extensions import db
from datetime import datetime

class Investment(db.Model):
    __tablename__ = "investments"

    id = db.Column(db.Integer, primary_key=True)
    investor_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    loan_id = db.Column(db.Integer, db.ForeignKey("loans.id"))
    amount_invested = db.Column(db.Numeric(12,2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)