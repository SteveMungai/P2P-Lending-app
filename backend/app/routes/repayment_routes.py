from flask import Blueprint, request, jsonify
from app.services.repayment_service import record_repayment
from app.models.repayments import Repayment

repayment_bp = Blueprint("repayments", __name__)


# Record repayment
@repayment_bp.route("/", methods=["POST"])
def create_repayment():

    repayment = record_repayment(request.json)

    return jsonify({
        "message": "Repayment recorded",
        "repayment_id": repayment.id
    })


# Get repayments
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
    ])