from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, bcrypt, jwt
from app.routes.user_routes import user_bp
from app.routes.loan_routes import loan_bp
from app.routes.investment_routes import investment_bp
from app.routes.repayment_routes import repayment_bp
from app.routes.auth_routes import auth_bp

def create_app():
    app = Flask(__name__)

    # Database setup
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:Postgre1@localhost:5432/p2p_lending"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # JWT setup
    app.config["JWT_SECRET_KEY"] = "SecureKey!5%"

    #  Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    #  CORS 
    CORS(app, origins="*", supports_credentials=False)

    # Register blueprints
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(loan_bp, url_prefix="/api/loans")
    app.register_blueprint(investment_bp, url_prefix="/api/investments")
    app.register_blueprint(repayment_bp, url_prefix="/api/repayments")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app