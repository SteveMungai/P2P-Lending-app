from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.models.loan import Loan 

user_bp = Blueprint("users", __name__)

# Create a user
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()

    # Validate required fields
    if not data or "full_name" not in data or "email" not in data:
        return jsonify({"error": "full_name and email are required"}), 400

    # check if email already exists
    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    user = User(
        full_name=data["full_name"],
        email=data["email"]
    )

    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "message": "User created",
            "user_id": user.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Get all users
@user_bp.route("/", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([
        {
            "id": user.id,
            "name": user.full_name,
            "email": user.email
        }
        for user in users
    ]), 200