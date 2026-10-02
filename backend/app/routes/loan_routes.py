from flask import Blueprint, request, jsonify
from app.extensions import db
from app.services.loan_service import create_loan
from app.models.loan import Loan
from app.models.user import User

loan_bp = Blueprint("loan", __name__)


# ---------- Helpers ----------

def get_risk(rate):
    rate = float(rate or 0)
    if rate <= 10:
        return "Low"
    elif rate <= 18:
        return "Medium"
    return "High"


def serialize_loan(loan, user=None):
    """Shape used by the marketplace cards (LoanCard)."""
    funded = float(getattr(loan, "amount_funded", 0) or 0)
    total = float(loan.amount_requested or 0)
    progress = int((funded / total) * 100) if total else 0

    return {
        "id": loan.id,
        "borrower_id": loan.borrower_id,  
        "name": user.full_name if user else "Unknown",
        "has_image": bool(user and user.image_data),
        "amount": total,
        "funded": funded,
        "progress": progress,
        "rate": float(loan.interest_rate or 0),
        "term": loan.duration_months,
        "risk": get_risk(loan.interest_rate),
        "purpose": getattr(loan, "purpose", None) or "Personal Loan",
        "status": loan.status,
    }


def users_by_id(loans):
    """Fetch all borrowers for a list of loans in one query."""
    ids = {l.borrower_id for l in loans}
    if not ids:
        return {}
    return {u.id: u for u in User.query.filter(User.id.in_(ids)).all()}


# ---------- Routes ----------

# Create a loan
@loan_bp.route("/", methods=["POST"])
def create():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    loan = create_loan(data)
    return jsonify({"message": "Loan created", "loan_id": loan.id}), 201


# Get single loan by ID (details page)
@loan_bp.route("/<int:loan_id>", methods=["GET"])
def get_one(loan_id):
    loan = db.session.get(Loan, loan_id)
    if not loan:
        return jsonify({"error": "Loan not found"}), 404

    user = db.session.get(User, loan.borrower_id)

    data = serialize_loan(loan, user)
    data.update({
        "image": f"/api/users/{loan.borrower_id}/image" if user and user.image_data else None,
        "email": user.email if user else None,
        "rating": float(user.rating) if user and user.rating else 0,
        "total_invested": float(user.total_invested) if user and user.total_invested else 0,
        "created_at": loan.created_at.isoformat() if loan.created_at else None,
    })

    return jsonify(data), 200


# Get loans with optional filters (same shape as get_all)
@loan_bp.route("/filter", methods=["GET"])
def get_loans():
    min_amount = request.args.get("minAmount", type=int)
    max_amount = request.args.get("maxAmount", type=int)
    risk = request.args.get("risk")

    query = Loan.query
    if min_amount:
        query = query.filter(Loan.amount_requested >= min_amount)
    if max_amount:
        query = query.filter(Loan.amount_requested <= max_amount)

    # Risk is derived from interest rate, so filter on the same ranges
    if risk:
        risk = risk.capitalize()
        if risk == "Low":
            query = query.filter(Loan.interest_rate <= 10)
        elif risk == "Medium":
            query = query.filter(Loan.interest_rate > 10, Loan.interest_rate <= 18)
        elif risk == "High":
            query = query.filter(Loan.interest_rate > 18)

    loans = query.all()
    users = users_by_id(loans)

    return jsonify([serialize_loan(l, users.get(l.borrower_id)) for l in loans]), 200


# Get all loans with user info and progress
@loan_bp.route("/", methods=["GET"])
def get_all():
    loans = Loan.query.all()
    users = users_by_id(loans)

    return jsonify([serialize_loan(l, users.get(l.borrower_id)) for l in loans]), 200


# Get loans for a specific user
@loan_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_loans(user_id):
    loans = Loan.query.filter_by(borrower_id=user_id).all()
    return jsonify([
        {
            "id": l.id,
            "amount": float(l.amount_requested),
            "status": l.status
        } for l in loans
    ]), 200


# Search loans by purpose (same shape as get_all)
@loan_bp.route("/search", methods=["GET"])
def search_loans():
    q = request.args.get("q", "")
    if not q:
        return jsonify([]), 200

    loans = Loan.query.filter(Loan.purpose.ilike(f"%{q}%")).all()
    users = users_by_id(loans)

    return jsonify([serialize_loan(l, users.get(l.borrower_id)) for l in loans]), 200