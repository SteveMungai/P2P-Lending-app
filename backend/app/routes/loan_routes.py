from flask import Blueprint, request, jsonify
from app.services.loan_service import create_loan
from app.models.loan import Loan
from app.models.user import User

loan_bp = Blueprint("loan", __name__)


# Create a loan
@loan_bp.route("/", methods=["POST"])
def create():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    loan = create_loan(data)
    return jsonify({"message": "Loan created", "loan_id": loan.id}), 201


# Get single loan by ID
@loan_bp.route("/<int:loan_id>", methods=["GET"])
def get_one(loan_id):
    loan = Loan.query.get(loan_id)
    if not loan:
        return jsonify({"error": "Loan not found"}), 404

    user = User.query.get(loan.borrower_id)
    funded = float(getattr(loan, "amount_funded", 0) or 0)
    total = float(loan.amount_requested)
    progress = int((funded / total) * 100) if total else 0

    def get_risk(rate):
        if rate <= 10:
            return "Low"
        elif rate <= 18:
            return "Medium"
        else:
            return "High"

    return jsonify({
        "id": loan.id,
        "name": user.full_name if user else "Unknown",
        "image": getattr(user, "image_url", None) if user else None,
        "email": user.email if user else None,
        "rating": float(user.rating) if user and user.rating else 0,
        "total_invested": float(user.total_invested) if user and user.total_invested else 0,
        "amount": total,
        "funded": funded,
        "progress": progress,
        "rate": loan.interest_rate,
        "term": loan.duration_months,
        "risk": get_risk(loan.interest_rate),
        "purpose": getattr(loan, "purpose", "Personal Loan"),
        "status": loan.status,
        "created_at": loan.created_at.isoformat() if loan.created_at else None
    }), 200


# Get loans with optional filters
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
    if risk:
        query = query.filter(Loan.risk == risk)

    loans = query.all()
    return jsonify([loan.to_dict() if hasattr(loan, "to_dict") else {
        "id": loan.id,
        "amount": float(getattr(loan, "amount_requested", 0)),
        "status": getattr(loan, "status", "pending")
    } for loan in loans]), 200


# Get all loans with user info and progress
@loan_bp.route("/", methods=["GET"])
def get_all():
    loans = Loan.query.all()

    def get_risk(rate):
        if rate <= 10:
            return "Low"
        elif rate <= 18:
            return "Medium"
        else:
            return "High"

    result = []
    for loan in loans:
        user = User.query.get(loan.borrower_id)
        funded = getattr(loan, "amount_funded", 0) or 0
        total = loan.amount_requested
        progress = int((funded / total) * 100) if total else 0

        result.append({
            "id": loan.id,
            "name": user.full_name if user else "Unknown",
            "image": getattr(user, "image_url", None) if user else None,
            "amount": total,
            "funded": funded,
            "progress": progress,
            "rate": loan.interest_rate,
            "term": loan.duration_months,
            "risk": get_risk(loan.interest_rate),
            "purpose": getattr(loan, "purpose", "Personal Loan")
        })

    return jsonify(result), 200


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


# Search loans by purpose
@loan_bp.route("/search", methods=["GET"])
def search_loans():
    query = request.args.get("q", "")
    if not query:
        return jsonify([]), 200

    loans = Loan.query.filter(Loan.purpose.ilike(f"%{query}%")).all()
    return jsonify([
        {
            "id": l.id,
            "amount": float(getattr(l, "amount_requested", 0)),
            "status": getattr(l, "status", "pending"),
            "purpose": getattr(l, "purpose", "Personal Loan"),
            "rate": getattr(l, "interest_rate", 0),
            "term": getattr(l, "duration_months", 0)
        } for l in loans
    ]), 200