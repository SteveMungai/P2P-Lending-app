import re

from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.errors import ApiError
from app.extensions import bcrypt, db
from app.models.user import User
from app.utils import json_body

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _text(data, field, label):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ApiError(f"{label} is required")
    return value.strip()


# Register a new user
@auth_bp.route("/register", methods=["POST"])
def register():
    data = json_body()

    full_name = _text(data, "full_name", "Full name")
    email = _text(data, "email", "Email").lower()
    password = data.get("password")

    if len(full_name) > 120:
        raise ApiError("Full name is too long")
    if len(email) > 120 or not EMAIL_RE.match(email):
        raise ApiError("Enter a valid email address")
    if not isinstance(password, str) or len(password) < 8:
        raise ApiError("Password must be at least 8 characters")
    if len(password.encode("utf-8")) > 72:  # bcrypt's hard limit
        raise ApiError("Password must be 72 bytes or fewer")

    if User.query.filter(func.lower(User.email) == email).first():
        raise ApiError("Email already registered", 409)

    user = User(
        full_name=full_name,
        email=email,
        password=bcrypt.generate_password_hash(password).decode("utf-8"),
    )
    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:  # someone registered the same email a moment ago
        db.session.rollback()
        raise ApiError("Email already registered", 409)

    return jsonify({"message": "User created", "user": user.to_dict()}), 201


# Login user
@auth_bp.route("/login", methods=["POST"])
def login():
    data = json_body()

    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or not email or not password:
        raise ApiError("Email and password are required")

    user = User.query.filter(func.lower(User.email) == email.strip().lower()).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        raise ApiError("Invalid credentials", 401)

    token = create_access_token(identity=str(user.id))  # str avoids a JWT warning

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
    }), 200
