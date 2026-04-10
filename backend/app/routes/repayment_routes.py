from flask import Blueprint, request, jsonify
from app.services.repayment_service import record_repayment
from app.models.repayments import Repayment
from app.models.loan import Loan  
from app.extensions import db

repayment_bp = Blueprint("repayments", __name__)

#  Record repayment
@repayment_bp.route("/", methods=["POST"])
def create_repayment():
    data = request.get_json()
    if not data or "loan_id" not in data or "amount" not in data:
        return jsonify({"error": "loan_id and amount are required"}), 400

    try:
        repayment = record_repayment(data)
        return jsonify({
            "message": "Repayment recorded",
            "repayment_id": repayment.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Get all repayments
@repayment_bp.route("/", methods=["GET"])
def get_repayments():
    repayments = Repayment.query.all()
    return jsonify([
        {
            "id": r.id,
            "loan_id": r.loan_id,
            "amount": float(r.amount_paid),
            "date": r.payment_date
        }
        for r in repayments
    ]), 200


# Get loans for a specific user
@repayment_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_loans(user_id):
    loans = Loan.query.filter_by(borrower_id=user_id).all()
    return jsonify([
        {
            "id": l.id,
            "amount": float(l.amount_requested),
            "status": l.status
        } for l in loans
    ]), 200