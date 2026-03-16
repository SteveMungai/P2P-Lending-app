from app import create_app

app = create_app()

@app.route("/")
def home():
    return "P2P Lending Backend Running"

if __name__ == "__main__":
    app.run(debug=True)