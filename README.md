# P2P Lending Platform

A full-stack peer-to-peer (P2P) lending platform that connects borrowers with lenders, allowing users to request loans, invest in available loans, track repayments, and manage transactions through a centralized platform.

The application is built with **React**, **Flask**, and **PostgreSQL**, with a focus on secure authentication, RESTful APIs, relational database design, simulated financial transactions, and credit-risk assessment.

---

## Features

### Authentication & User Management

* User registration and login
* JWT-based authentication
* Secure password hashing
* User profile management
* Role-based access control
* Protected routes

### Loan Management

* Create loan requests
* Specify loan amount, purpose, interest rate, and repayment period
* View loan application status
* Track active and completed loans
* View repayment schedules
* Loan lifecycle management

### Loan Marketplace

* Browse available loan opportunities
* Search and filter loans
* View loan details
* View funding progress
* View loan risk/credit information
* Invest in available loans

### Investments

* Invest in available loans
* Track active investments
* View investment history
* Track repayments received from investments

### Credit Scoring

* Simulated credit scoring system
* Credit-risk categorization
* Credit information displayed alongside loan listings

### Wallet & Transactions

* Simulated wallet system
* Deposit/top-up functionality
* Withdraw funds
* Invest available balance
* Receive repayment funds
* View transaction history

### Repayments

* Generate repayment schedules
* Track upcoming repayments
* Record loan repayments
* Calculate outstanding balances
* Track completed repayments


### Admin Dashboard

* Monitor users
* Review loan applications
* Monitor transactions
* Monitor repayments
* View platform statistics
* Manage users and loans

## Getting Started

### Prerequisites

Make sure you have the following installed:

Node.js
Python 3.x
PostgreSQL
Git
Clone the Repository
git clone https://github.com/SteveMungai/P2P-Lending-app.git

cd P2P-Lending-app
Backend Setup

Create and activate a virtual environment:

python -m venv venv

Windows:

venv\Scripts\activate

Install the required dependencies:

pip install -r requirements.txt

Configure the PostgreSQL database and environment variables.

Example:

DATABASE_URL=postgresql://username:password@localhost/p2p_lending
JWT_SECRET_KEY=your_secret_key

Run database migrations:

flask db upgrade
python seed.py

Start the Flask server:

flask run
Frontend Setup

Navigate to the frontend:

cd client

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will then be available through the local development URL.

API

The Flask backend exposes RESTful API endpoints for interacting with the application.

Example endpoint categories include:

/auth
/users
/loans
/investments
/transactions
/repayments

Authenticated endpoints use JWT tokens to ensure that user-specific information is only returned to the appropriate account.

Financial Data Flow

A typical investment workflow is:

User logs in
      ↓
Browses Marketplace
      ↓
Selects a Loan
      ↓
Views Loan Details
      ↓
Makes an Investment
      ↓
Investment is recorded
      ↓
Transaction is created
      ↓
Available funds are updated
      ↓
Dashboard reflects new investment
      ↓
Active Loans / Investments updated

This ensures that the dashboard is based on actual application data rather than static or hard-coded values.
