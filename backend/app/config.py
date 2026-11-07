import os
from datetime import timedelta
from urllib.parse import urlsplit

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
    # Supabase only accepts encrypted connections
    host = urlsplit(url).hostname or ""
    if host.endswith((".supabase.com", ".supabase.co")) and "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def build_engine_options(serverless):
    """Connection-pool settings.

    On Vercel every warm function instance keeps its own pool, and the number
    of instances is not under our control. Supabase therefore recommends a pool
    of 1 per instance there (with its transaction pooler doing the real pooling).
    Everywhere else the normal SQLAlchemy pool is fine.
    """
    options = {
        "pool_pre_ping": True,  # drop connections that went stale while a function was frozen
        "pool_recycle": 300,
    }
    if serverless:
        options.update(pool_size=1, max_overflow=0)
    return options


ON_VERCEL = bool(os.getenv("VERCEL"))


class Config:
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = build_engine_options(ON_VERCEL)

    # Behind a proxy (Vercel, Render, ...) trust X-Forwarded-Proto/Host so generated links
    # (e.g. borrower image URLs) use https and the public host name. Automatic on Vercel.
    TRUST_PROXY = os.getenv("TRUST_PROXY") == "1" or ON_VERCEL

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
