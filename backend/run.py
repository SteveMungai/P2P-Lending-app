import os

from app import create_app

app = create_app()


@app.route("/")
def home():
    return "P2P Lending Backend Running"


if __name__ == "__main__":
    # Debug mode exposes an interactive debugger - only enable it locally.
    app.run(debug=os.getenv("FLASK_DEBUG") == "1")
