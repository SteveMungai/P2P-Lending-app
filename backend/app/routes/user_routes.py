from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User

user_bp = Blueprint("users", __name__)

# Create a user
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.json

    user = User(
        full_name=data["full_name"],
        email=data["email"]
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created",
        "user_id": user.id
    })


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
    ])