from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app.errors import ApiError
from app.extensions import db
from app.models.investments import Investment
from app.models.user import User

user_bp = Blueprint("users", __name__)

# Logged-in users can see who is on the platform (names only, no emails)
@user_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.order_by(User.full_name).all()
    return jsonify([{"id": u.id, "name": u.full_name} for u in users]), 200


# Current user's investor summary (used by the marketplace sidebar)
@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        raise ApiError("User not found", 404)

    # Portfolio value = everything this user has invested so far
    portfolio_value = (
        db.session.query(func.coalesce(func.sum(Investment.amount_invested), 0))
        .filter(Investment.investor_id == user.id)
        .scalar()
    )

    return jsonify({
        "id": user.id,
        "full_name": user.full_name,
        "portfolio_value": float(portfolio_value),
        "available_funds": float(user.balance),
    }), 200
