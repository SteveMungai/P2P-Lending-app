from flask import Flask
from app.config import Config
from app.extensions import db, migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

       # PostgreSQL connection
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:Postgre1@localhost:5432/p2p_lending"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    from backend.routes.user_routes import user_bp
    from backend.routes.loan_routes import loan_bp
    from backend.routes.investment_routes import investment_bp
    from backend.routes.repayment_routes import repayment_bp

    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(loan_bp, url_prefix="/loans")
    app.register_blueprint(investment_bp, url_prefix="/investments")
    app.register_blueprint(repayment_bp, url_prefix="/repayments")

    return app
