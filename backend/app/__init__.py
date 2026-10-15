from flask import Flask

from app.cli import register_cli
from app.config import Config
from app.errors import register_error_handlers
from app.extensions import bcrypt, cors, db, jwt, migrate
from app.routes.auth_routes import auth_bp
from app.routes.investment_routes import investment_bp
from app.routes.loan_routes import loan_bp
from app.routes.repayment_routes import repayment_bp
from app.routes.user_routes import user_bp


def create_app(test_config=None):
    # Images live in backend/static
    app = Flask(__name__, static_folder="../static", static_url_path="/static")

    # "/api/loans" and "/api/loans/" both work .
    app.url_map.strict_slashes = False

    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    # Fail fast with a helpful message instead of a confusing crash later.
    missing = [
        name
        for name in ("SQLALCHEMY_DATABASE_URI", "JWT_SECRET_KEY")
        if not app.config.get(name)
    ]
    if missing:
        raise RuntimeError(
            "Missing configuration: "
            + ", ".join(missing)
            + ". Copy backend/.env.example to backend/.env and fill it in."
        )
    if len(app.config["JWT_SECRET_KEY"]) < 32 and not app.config.get("TESTING"):
        raise RuntimeError(
            "JWT_SECRET_KEY must be at least 32 characters. Generate one with: "
            'python -c "import secrets; print(secrets.token_urlsafe(48))"'
        )

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=False)

    register_error_handlers(app, jwt)
    register_cli(app)

    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(loan_bp, url_prefix="/api/loans")
    app.register_blueprint(investment_bp, url_prefix="/api/investments")
    app.register_blueprint(repayment_bp, url_prefix="/api/repayments")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app
