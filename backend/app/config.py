import os
from datetime import timedelta

from dotenv import load_dotenv

# Reads backend/.env if it exists.
load_dotenv()


def _database_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        return url
    # Some hosts still hand out "postgres://", which SQLAlchemy 2 rejects.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    # Name the driver we install (psycopg2-binary) so a plain "postgresql://"
    # keeps working whichever SQLAlchemy version is installed.
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    # Flask-JWT-Extended defaults to 15 minutes, which logs users out mid-session.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "480"))
    )

    # Comma-separated list of frontend origins allowed to call the API.
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if o.strip()
    ]
