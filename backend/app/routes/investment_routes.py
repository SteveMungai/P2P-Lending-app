from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.investments import Investment
from app.services.investment_service import invest
from app.utils import json_body

investment_bp = Blueprint("investments", __name__)


# Invest in a loan. The investor is the logged-in user - never the request body.
@investment_bp.route("/", methods=["POST"])
@jwt_required()
def create_investment():
    data = json_body()
    investment = invest(int(get_jwt_identity()), data)

    loan = investment.loan
    total = float(loan.amount_requested)
    funded = float(loan.amount_funded or 0)

    return jsonify({
        "message": "Investment successful",
        "investment_id": investment.id,
        "available_funds": float(investment.investor.balance),
        "loan": {
            "id": loan.id,
            "status": loan.status,
            "funded": funded,
            "progress": min(int(funded / total * 100), 100) if total else 0,
        },
    }), 201


# The logged-in user's own investments
@investment_bp.route("/", methods=["GET"])
@jwt_required()
def get_my_investments():
    investments = (
        Investment.query.filter_by(investor_id=int(get_jwt_identity()))
        .order_by(Investment.created_at.desc(), Investment.id.desc())
        .all()
    )
    return jsonify([
        {
            "id": inv.id,
            "loan_id": inv.loan_id,
            "amount": float(inv.amount_invested),
            "purpose": inv.loan.purpose if inv.loan else None,
            "loan_status": inv.loan.status if inv.loan else None,
            "created_at": inv.created_at.isoformat(),
        }
        for inv in investments
    ]), 200
