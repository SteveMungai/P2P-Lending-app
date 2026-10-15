"""One place that turns every failure into a JSON response."""
from flask import jsonify
from werkzeug.exceptions import HTTPException

from app.extensions import db


class ApiError(Exception):
    """Raise anywhere (services or routes) to return {"error": message}."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def register_error_handlers(app, jwt):
    @app.errorhandler(ApiError)
    def handle_api_error(err):
        db.session.rollback()
        return jsonify({"error": err.message}), err.status

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        # 404 / 405 / 400 ... as JSON instead of an HTML page
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        db.session.rollback()
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Internal server error"}), 500

    # Flask-JWT-Extended answers with {"msg": ...} and sometimes 422.
    # Normalise to {"error": ...} + 401 so the frontend has one case to handle.
    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({"error": "Authentication required"}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({"error": "Invalid session. Please log in again."}), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"error": "Your session has expired. Please log in again."}), 401
