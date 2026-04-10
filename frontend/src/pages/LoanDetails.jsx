import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

const API = "http://localhost:5000";

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState("");
  const [investing, setInvesting] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetch(`${API}/api/loans/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch loan");
        return res.json();
      })
      .then((data) => setLoan(data))
      .catch((err) => {
        console.error(err);
        setError("Unable to load loan details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleInvest = () => {
    if (!token) {
      alert("Please log in to invest");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setInvesting(true);
    fetch(`${API}/api/investments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        loan_id: loan.id,
        investor_id: user?.id,
        amount_invested: Number(amount),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.investment_id) {
          alert(`Successfully invested KES ${Number(amount).toLocaleString()}`);
          setAmount("");
          // Refresh loan data to update progress
          return fetch(`${API}/api/loans/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((updated) => setLoan(updated));
        } else {
          alert(data.error || "Investment failed");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Investment failed");
      })
      .finally(() => setInvesting(false));
  };

  if (loading) return <><TopBar /><p style={{ padding: "20px" }}>Loading loan details...</p><Footer /></>;
  if (error || !loan) return <><TopBar /><p style={{ padding: "20px" }}>{error || "Loan not found"}</p><Footer /></>;

  const fundingPercentage = loan.amount
    ? Math.min(((loan.funded || 0) / loan.amount) * 100, 100)
    : 0;

  const remaining = (loan.amount || 0) - (loan.funded || 0);

  return (
    <>
      <TopBar />

      <div className="loan-details-container">

        {/* LOAN INFO */}
        <div className="card loan-info">
          <h2>Loan Info</h2>
          <div className="loan-grid">
            <div>
              <p className="label">Principal</p>
              <h3>KES {(loan.amount || 0).toLocaleString()}</h3>

              <p className="label">Interest Rate</p>
              <h3>{loan.rate || 0}%</h3>
            </div>
            <div>
              <p className="label">Term</p>
              <h3>{loan.term || "N/A"} months</h3>

              <p className="label">Risk Level</p>
              <h3>{loan.risk || "N/A"}</h3>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${fundingPercentage}%` }}
              />
            </div>
            <p className="progress-text">
              {fundingPercentage.toFixed(1)}% Funded — Remaining KES{" "}
              {remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* BORROWER INFO */}
        <div className="card lender-info">
          <h2>Borrower Info</h2>
          <div className="loan-grid">
            <div>
              <p className="label">Name</p>
              <h3>{loan.name || "N/A"}</h3>

              <p className="label">Purpose</p>
              <h3>{loan.purpose || "N/A"}</h3>
            </div>
            <div>
              <p className="label">Rating</p>
              <h3>⭐ {loan.rating || "N/A"}</h3>

              <p className="label">Total Invested In</p>
              <h3>KES {(loan.total_invested || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* INVEST SECTION */}
        <div className="card invest-section">
          <h2>Invest in this Loan</h2>

          {!token ? (
            <p>Please <a href="/auth">log in</a> to invest.</p>
          ) : (
            <>
              <div className="invest-grid">
                <div>
                  <label>Your Balance</label>
                  <p>KES {(user?.balance || 0).toLocaleString()}</p>

                  <label>Investment Amount (KES)</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    max={remaining}
                  />
                </div>

                <div>
                  <label>Loan Status</label>
                  <p style={{
                    color: loan.status === "funded" ? "green" :
                           loan.status === "open" ? "orange" : "gray",
                    fontWeight: "bold"
                  }}>
                    {loan.status?.toUpperCase()}
                  </p>

                  <label>Amount Still Needed</label>
                  <p>KES {remaining.toLocaleString()}</p>
                </div>
              </div>

              <button
                className="primary-btn"
                onClick={handleInvest}
                disabled={investing || loan.status === "funded"}
              >
                {investing ? "Processing..." : loan.status === "funded" ? "Fully Funded" : "Invest Now"}
              </button>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default LoanDetails;