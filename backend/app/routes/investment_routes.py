from flask import Blueprint, request, jsonify
from app.services.investment_service import invest
from app.models.investments import Investment

investment_bp = Blueprint("investments", __name__)


# Invest in loan
@investment_bp.route("/", methods=["POST"])
def create_investment():

    investment = invest(request.json)

    return jsonify({
        "message": "Investment successful",
        "investment_id": investment.id
    })


# Get all investments
@investment_bp.route("/", methods=["GET"])
def get_investments():

    investments = Investment.query.all()

    return jsonify([
        {
            "id": inv.id,
            "loan_id": inv.loan_id,
            "investor_id": inv.investor_id,
            "amount": float(inv.amount_invested)
        }
        for inv in investments
    ])