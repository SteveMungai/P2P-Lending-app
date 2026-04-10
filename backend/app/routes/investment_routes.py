from flask import Blueprint, request, jsonify
from app.services.investment_service import invest
from app.models.investments import Investment
from app.models.loan import Loan  

investment_bp = Blueprint("investments", __name__)


#  Create an investment
@investment_bp.route("/", methods=["POST"])
def create_investment():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    investment = invest(data)

    return jsonify({
        "message": "Investment successful",
        "investment_id": investment.id
    }), 201


#  Get all investments
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
    ]), 200


#  Get loans for a specific user 
@investment_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_loans(user_id):
    loans = Loan.query.filter_by(borrower_id=user_id).all()

    return jsonify([
        {
            "id": l.id,
            "amount": float(getattr(l, "amount_requested", 0)),
            "status": getattr(l, "status", "pending")
        }
        for l in loans
    ]), 200