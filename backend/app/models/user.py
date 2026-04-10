from app.extensions import db
from datetime import datetime
import random

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Auto-assign values when regisering a new user
    balance = db.Column(db.Numeric(10, 2), nullable=False, default=lambda: round(random.uniform(1000, 50000), 2))
    credit_score = db.Column(db.Integer, nullable=False, default=lambda: random.randint(300, 850))
    rating = db.Column(db.Numeric(3, 1), nullable=False, default=lambda: round(random.uniform(3.0, 5.0), 1))
    total_loans = db.Column(db.Integer, nullable=False, default=lambda: random.randint(0, 10))
    total_invested = db.Column(db.Numeric(10, 2), nullable=False, default=lambda: round(random.uniform(0, 20000), 2))

    def to_dict(self):
        """Serialize user info for JSON responses (without password)."""
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
            "balance": float(self.balance),
            "credit_score": self.credit_score,
            "rating": float(self.rating),
            "total_loans": self.total_loans,
            "total_invested": float(self.total_invested)
        }

    def __repr__(self):
        return f"<User {self.full_name} ({self.email})>"