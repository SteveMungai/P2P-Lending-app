from flask import Blueprint, request, jsonify
from app.extensions import db, bcrypt
from app.models.user import User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)


# Register a new user
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        full_name=data.get("full_name"),
        email=data.get("email"),
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created",
        "user": user.to_dict()  # returns all random values
    }), 201


# Login user
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    user = User.query.filter_by(email=data.get("email")).first()

    if not user or not bcrypt.check_password_hash(user.password, data.get("password")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))  # cast to str to avoid JWT warning

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict()  # returns all random values
    }), 200