from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_
from sqlalchemy.orm import contains_eager

from app.errors import ApiError
from app.extensions import db
from app.models.loan import Loan
from app.models.user import User
from app.services.loan_service import create_loan
from app.utils import (
    LOAN_STATUSES,
    RISK_LEVELS,
    absolute_image_url,
    json_body,
    risk_from_rate,
)

loan_bp = Blueprint("loan", __name__)


# ── helpers ─────────────────────────────────────────────────────────────
def serialize_loan(loan):
    """The shape the marketplace cards (and the dashboard) use."""
    borrower = loan.borrower
    total = float(loan.amount_requested)
    funded = float(loan.amount_funded or 0)
    return {
        "id": loan.id,
        "borrower_id": loan.borrower_id,
        "name": borrower.full_name if borrower else "Unknown",
        "image": absolute_image_url(borrower.image_url) if borrower else None,
        "amount": total,
        "funded": funded,
        "progress": min(int(funded / total * 100), 100) if total else 0,
        "rate": loan.interest_rate,
        "term": loan.duration_months,
        "risk": risk_from_rate(loan.interest_rate),
        "purpose": loan.purpose or "Personal Loan",
        "status": loan.status,
        "created_at": loan.created_at.isoformat() if loan.created_at else None,
    }


def _number_arg(name):
    raw = request.args.get(name)
    if raw in (None, ""):
        return None
    try:
        value = float(raw)
    except ValueError:
        raise ApiError(f"{name} must be a number")
    if value != value or value in (float("inf"), float("-inf")) or value < 0:
        raise ApiError(f"{name} must be a positive number")
    return value


def build_loan_query():
    """Shared by GET /, /filter and /search.

    Query string (all optional):
      q          text to look for in the purpose or borrower name
      minAmount  / maxAmount   loan size in KES
      risk       Low | Medium | High   (worked out from the interest rate)
      status     open | funded | closed
    """
    query = Loan.query.join(User, Loan.borrower_id == User.id).options(
        contains_eager(Loan.borrower)
    )

    q = (request.args.get("q") or "").strip()
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{escaped}%"
        query = query.filter(
            or_(Loan.purpose.ilike(like, escape="\\"), User.full_name.ilike(like, escape="\\"))
        )

    min_amount = _number_arg("minAmount")
    max_amount = _number_arg("maxAmount")
    if min_amount is not None:
        query = query.filter(Loan.amount_requested >= min_amount)
    if max_amount is not None:
        query = query.filter(Loan.amount_requested <= max_amount)

    risk = (request.args.get("risk") or "").strip().capitalize()
    if risk:
        if risk not in RISK_LEVELS:
            raise ApiError("risk must be Low, Medium or High")
        if risk == "Low":
            query = query.filter(Loan.interest_rate <= 10)
        elif risk == "Medium":
            query = query.filter(Loan.interest_rate > 10, Loan.interest_rate <= 18)
        else:
            query = query.filter(Loan.interest_rate > 18)

    status = (request.args.get("status") or "").strip().lower()
    if status:
        if status not in LOAN_STATUSES:
            raise ApiError("status must be open, funded or closed")
        query = query.filter(Loan.status == status)

    return query.order_by(Loan.created_at.desc(), Loan.id.desc())


#routes 
# Create a loan (the logged-in user becomes the borrower)
@loan_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    loan = create_loan(int(get_jwt_identity()), json_body())
    return jsonify({"message": "Loan created", "loan_id": loan.id}), 201


# List loans. Accepts every filter above, e.g. /api/loans/?status=open&risk=Low
@loan_bp.route("/", methods=["GET"])
def get_all():
    return jsonify([serialize_loan(l) for l in build_loan_query().all()]), 200


# Kept for backwards compatibility: same as GET /api/loans/ with filters.

@loan_bp.route("/filter", methods=["GET"])
def filter_loans():
    return get_all()


# Kept for backwards compatibility: same as GET /api/loans/?q=...
# It now returns the same card shape as the list .
@loan_bp.route("/search", methods=["GET"])
def search_loans():
    return get_all()


# Loans the logged-in user has requested (used by the dashboard)
@loan_bp.route("/mine", methods=["GET"])
@jwt_required()
def get_my_loans():
    loans = (
        Loan.query.join(User, Loan.borrower_id == User.id)
        .options(contains_eager(Loan.borrower))
        .filter(Loan.borrower_id == int(get_jwt_identity()))
        .order_by(Loan.created_at.desc(), Loan.id.desc())
        .all()
    )
    return jsonify([serialize_loan(l) for l in loans]), 200


# A user may only list their own loans
@loan_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_loans(user_id):
    if user_id != int(get_jwt_identity()):
        raise ApiError("You can only view your own loans", 403)
    return get_my_loans()


# Single loan with borrower details
@loan_bp.route("/<int:loan_id>", methods=["GET"])
def get_one(loan_id):
    loan = db.session.get(Loan, loan_id)
    if not loan:
        raise ApiError("Loan not found", 404)

    data = serialize_loan(loan)
    borrower = loan.borrower
    data.update({
        
        "rating": float(borrower.rating) if borrower and borrower.rating else 0,
        "total_invested": float(borrower.total_invested) if borrower and borrower.total_invested else 0,
    })
    return jsonify(data), 200
