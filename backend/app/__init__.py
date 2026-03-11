from flask import Flask
from app.config import Config
from app.extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes.user_routes import user_bp
    from app.routes.loan_routes import loan_bp
    from app.routes.investment_routes import investment_bp
    from app.routes.repayment_routes import repayment_bp

    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(loan_bp, url_prefix="/loans")
    app.register_blueprint(investment_bp, url_prefix="/investments")
    app.register_blueprint(repayment_bp, url_prefix="/repayments")

    return app
