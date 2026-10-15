#Small helpers shared by several routes.
from decimal import Decimal, InvalidOperation

from flask import request

from app.errors import ApiError

RISK_LEVELS = ("Low", "Medium", "High")
LOAN_STATUSES = ("open", "funded", "closed")


def risk_from_rate(rate):
    # Risk is derived from the interest rate 
    rate = rate or 0
    if rate <= 10:
        return "Low"
    if rate <= 18:
        return "Medium"
    return "High"


def absolute_image_url(path):
    """Turn "/static/images/x.jpg" into a full URL the React app can load."""
    if not path:
        return None
    if path.startswith(("http://", "https://")):
        return path
    return request.url_root.rstrip("/") + "/" + path.lstrip("/")


def parse_money(value, field="amount"):
    # Validate a money amount and return it as Decimal (max 2 decimals, > 0)
    if value is None or isinstance(value, bool):
        raise ApiError(f"{field} must be a number")
    try:
        amount = Decimal(str(value).strip())
    except InvalidOperation:
        raise ApiError(f"{field} must be a number")
    if not amount.is_finite():
        raise ApiError(f"{field} must be a number")
    if amount != amount.quantize(Decimal("0.01")):
        raise ApiError(f"{field} can have at most 2 decimal places")
    if amount <= 0:
        raise ApiError(f"{field} must be greater than 0")
    return amount


def parse_int(value, field):
    # A whole number. 12 and "12" and 12.0 are fine; 12.5 and True are not
    if isinstance(value, bool):
        raise ApiError(f"{field} must be a whole number")
    if isinstance(value, float):
        if not value.is_integer():
            raise ApiError(f"{field} must be a whole number")
        return int(value)
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(f"{field} must be a whole number")


def json_body():
    #The request JSON as a dict, or a clean 400
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("A JSON body is required")
    return data
