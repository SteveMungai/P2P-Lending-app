from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.loan import Loan
from app.models.investments import Investment
from app.models.repayments import Repayment
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random

app = create_app()

def seed_users():
    print("Seeding Users...")

    users_data = [
        {"full_name": "Alice Johnson", "email": "alice@example.com", "image_url": "", "rating": 4.5},
        {"full_name": "Bob Smith", "email": "bob@example.com", "image_url": "", "rating": 4.0},
        {"full_name": "Charlie Brown", "email": "charlie@example.com", "image_url": "", "rating": 3.8},
        {"full_name": "Diana Prince", "email": "diana@example.com", "image_url": "", "rating": 4.9},
        {"full_name": "Ethan Hunt", "email": "ethan@example.com", "image_url": "", "rating": 4.2},
    ]

    for u in users_data:
        existing = User.query.filter_by(email=u["email"]).first()
        if existing:
            print(f"  Skipping {u['email']} — already exists.")
            continue

        hashed_password = bcrypt.generate_password_hash("Password123!").decode("utf-8")
        user = User(
            full_name=u["full_name"],
            email=u["email"],
            password=hashed_password,
            image_url=u["image_url"]
        )
        db.session.add(user)

    db.session.commit()
    print("Users seeded.")


def seed_loans():
    print("Seeding Loans...")
    all_users = User.query.all()
    loans_data = []
    for i in range(1, 6):
        borrower = random.choice(all_users)
        loan = Loan(
            borrower_id=borrower.id,
            amount_requested=random.randint(1000, 10000),
            interest_rate=random.choice([5, 7, 10]),
            duration_months=random.choice([6, 12, 24]),
            status=random.choice(["open", "funded", "closed"]),
            created_at=datetime.now(timezone.utc),
            amount_funded=0,
            purpose=f"Loan purpose {i}"
        )
        db.session.add(loan)
        loans_data.append(loan)
    db.session.commit()
    print("Loans seeded.")
    return loans_data


def seed_investments(loans):
    print("Seeding Investments...")
    all_users = User.query.all()

    for loan in loans:
        num_investors = random.randint(1, 3)
        investors = random.sample(all_users, num_investors)
        for investor in investors:
            amount = Decimal(str(round(random.uniform(
                float(loan.amount_requested) * 0.1,
                float(loan.amount_requested) * 0.5
            ), 2)))
            inv = Investment(
                investor_id=investor.id,
                loan_id=loan.id,
                amount_invested=amount,
                created_at=datetime.now(timezone.utc)
            )
            db.session.add(inv)
            loan.amount_funded += amount
        if loan.amount_funded >= loan.amount_requested:
            loan.status = "funded"
    db.session.commit()
    print("Investments seeded.")


def seed_repayments(loans):
    print("Seeding Repayments...")
    for loan in loans:
        if loan.status in ["funded", "closed"]:
            num_payments = random.randint(1, loan.duration_months)
            for i in range(num_payments):
                payment_date = loan.created_at + timedelta(days=30 * (i + 1))
                amount_paid = Decimal(str(round(
                    (float(loan.amount_requested) * (1 + float(loan.interest_rate) / 100)) / loan.duration_months, 2
                )))
                repayment = Repayment(
                    loan_id=loan.id,
                    amount_paid=amount_paid,
                    payment_date=payment_date
                )
                db.session.add(repayment)
    db.session.commit()
    print("Repayments seeded.")


def calculate_user_balances():
    print("Calculating user balances...")
    all_users = User.query.all()
    for user in all_users:
        lent = db.session.query(db.func.sum(Investment.amount_invested)).filter_by(investor_id=user.id).scalar() or 0
        user_loans = Loan.query.filter_by(borrower_id=user.id).all()
        owed = sum([float(loan.amount_requested) for loan in user_loans])
        print(f"{user.full_name}: Lent=${lent}, Owes=${owed}")
    print("Balances calculated.")


if __name__ == "__main__":
    print("Starting seeding process...")
    with app.app_context():
        seed_users()
        loans = seed_loans()
        seed_investments(loans)
        seed_repayments(loans)
        calculate_user_balances()
        print("Seeding complete!")
        