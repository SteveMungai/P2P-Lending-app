import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LoanDetails = () => {
  const { id } = useParams();

  // Dummy data for now (later replace with API call)
  const loan = {
    id: id,
    principal: 100000,
    interestRate: 14,
    term: "1.5 Years",
    funded: 50000,
    lender: "Joe Kubai",
    yearsOnApp: 2,
    totalInvested: 200000,
    purpose: "Enterprise Expansion"
  };

  const fundingPercentage = (loan.funded / loan.principal) * 100;

  return (
    <>
      <Navbar />

      <div className="loan-details-container">

        {/* LOAN INFO */}
        <div className="card loan-info">
          <h2>Loan Info</h2>

          <div className="loan-grid">
            <div>
              <p className="label">Principal</p>
              <h3>KES {loan.principal.toLocaleString()}</h3>

              <p className="label">Interest Rate</p>
              <h3>{loan.interestRate}%</h3>
            </div>

            <div>
              <p className="label">Term</p>
              <h3>{loan.term}</h3>

              <p className="label">Amount Funded</p>
              <h3>KES {loan.funded.toLocaleString()}</h3>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${fundingPercentage}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {fundingPercentage}% Funded — Remaining KES{" "}
              {(loan.principal - loan.funded).toLocaleString()}
            </p>
          </div>
        </div>

        {/* LENDER INFO */}
        <div className="card lender-info">
          <h2>Lender's Info</h2>

          <div className="loan-grid">
            <div>
              <p className="label">Name</p>
              <h3>{loan.lender}</h3>

              <p className="label">Years on App</p>
              <h3>{loan.yearsOnApp}</h3>
            </div>

            <div>
              <p className="label">Most Funds</p>
              <h3>{loan.purpose}</h3>

              <p className="label">Total Invested</p>
              <h3>KES {loan.totalInvested.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* INVEST SECTION */}
        <div className="card invest-section">
          <h2>Invest</h2>

          <div className="invest-grid">
            <div>
              <label>Purpose</label>
              <select>
                <option>Enterprise Expansion</option>
                <option>Medical</option>
                <option>School Fees</option>
              </select>

              <label>Investment Amount</label>
              <input type="number" placeholder="Enter amount" />
            </div>

            <div>
              <label>Credit Card Number</label>
              <input type="text" placeholder="XXXX XXXX XXXX XXXX" />

              <label>CVV</label>
              <input type="text" placeholder="123" />
            </div>
          </div>

          <button className="primary-btn">Invest</button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default LoanDetails;