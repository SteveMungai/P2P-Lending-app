from io import BytesIO
from flask import Blueprint, request, jsonify, send_file, abort
from werkzeug.security import generate_password_hash

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

    if not data.get("password"):
        return jsonify({"error": "password is required"}), 400

    # Check if email already exists
    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
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


# Serve a user's profile image from PostgreSQL
@user_bp.route("/<int:user_id>/image", methods=["GET"])
def get_user_image(user_id):
    user = db.session.get(User, user_id)
    if not user or not user.image_data:
        abort(404)

    return send_file(
        BytesIO(user.image_data),
        mimetype=user.image_mimetype or "image/jpeg",
        max_age=86400,
    )


# Upload / replace a user's profile image (multipart/form-data, field: "image")
@user_bp.route("/<int:user_id>/image", methods=["POST"])
def upload_user_image(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    file = request.files.get("image")
    if not file or not file.mimetype.startswith("image/"):
        return jsonify({"error": "An image file is required"}), 400

    user.image_data = file.read()
    user.image_mimetype = file.mimetype

    try:
        db.session.commit()
        return jsonify({"message": "Image uploaded"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500