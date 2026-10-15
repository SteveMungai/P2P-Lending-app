from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.loan import Loan
from app.models.repayments import Repayment
from app.services.repayment_service import record_repayment
from app.utils import json_body

repayment_bp = Blueprint("repayments", __name__)


# Record a repayment (borrower only)
@repayment_bp.route("/", methods=["POST"])
@jwt_required()
def create_repayment():
    repayment = record_repayment(int(get_jwt_identity()), json_body())
    return jsonify({
        "message": "Repayment recorded",
        "repayment_id": repayment.id,
    }), 201


# Repayments made on the logged-in user's own loans
@repayment_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_repayments():
    repayments = (
        Repayment.query.join(Loan, Repayment.loan_id == Loan.id)
        .filter(Loan.borrower_id == int(get_jwt_identity()))
        .order_by(Repayment.payment_date.desc(), Repayment.id.desc())
        .all()
    )
    return jsonify([
        {
            "id": r.id,
            "loan_id": r.loan_id,
            "amount": float(r.amount_paid),
            "date": r.payment_date.isoformat(),
        }
        for r in repayments
    ]), 200
