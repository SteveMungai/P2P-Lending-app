import random
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.loan import Loan

app = create_app()

names = [
    "James Mwangi", "Mary Wanjiku", "David Otieno",
    "Grace Njeri", "Peter Kamau", "Faith Achieng"
]

with app.app_context():

    # Create Users first
    users = []
    for i, name in enumerate(names):
        user = User(
            full_name=name,
              email=name.lower().replace(" ", "") + "@gmail.com",
            image_url=f"/static/images/borrower{i+1}.jpg"
        )
        db.session.add(user)
        users.append(user)

    db.session.commit()  

    #  Create Loans
    for i in range(15):
        borrower = random.choice(users)

        loan = Loan(
            borrower_id=borrower.id,
            amount_requested=random.randint(10000, 200000),
            interest_rate=random.randint(8, 25),
            duration_months=random.choice([3, 6, 12, 18, 24])
        )

        db.session.add(loan)

    db.session.commit()

    print("Users and Loans seeded successfully!")