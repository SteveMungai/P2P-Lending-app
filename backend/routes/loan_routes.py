from flask import Blueprint, request, jsonify
from app.services.loan_service import create_loan
from app.models.loan import Loan

loan_bp = Blueprint("loan", __name__)

@loan_bp.route("/", methods=["POST"])
def create():
    loan = create_loan(request.json)
    return jsonify({"message": "Loan created", "loan_id": loan.id})

@loan_bp.route("/", methods=["GET"])
def get_all():
    loans = Loan.query.all()
    return jsonify([
        {
            "id": loan.id,
            "amount": float(loan.amount_requested),
            "status": loan.status
        } for loan in loans
    ])