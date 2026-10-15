import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { apiFetch, getStoredUser } from "../utils/api";

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState("");
  const [investing, setInvesting] = useState(false);

  const [balance, setBalance] = useState(null);

  const token = localStorage.getItem("token");
  const user = getStoredUser();

  // Fetch loan details
  const fetchLoan = async () => {
    try {
      const res = await apiFetch(`/api/loans/${id}`, { auth: false });

      if (!res.ok) throw new Error(res.data?.error || `Failed to fetch loan: ${res.status}`);
      setLoan(res.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load loan details");
    } finally {
      setLoading(false);
    }
  };

  // Live balance from the server 
  const fetchBalance = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/api/users/me");
      if (res.ok) setBalance(res.data.available_funds);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLoan();
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInvest = async () => {
    if (!token) {
      alert("Please log in to invest");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (Number(amount) > remaining) {
      alert("Investment amount cannot exceed remaining amount");
      return;
    }

    setInvesting(true);

    try {
      // The investor is identified by the login token on the server.
      const res = await apiFetch("/api/investments/", {
        method: "POST",
        body: { loan_id: loan.id, amount_invested: Number(amount) },
      });

      if (res.ok && res.data?.investment_id) {
        alert(`Successfully invested KES ${Number(amount).toLocaleString()}`);
        setAmount("");
        if (typeof res.data.available_funds === "number") {
          setBalance(res.data.available_funds);
        }
        // Refresh loan data
        await fetchLoan();
      } else {
        // Show the actual error message from backend
        const errorMsg = res.data?.error || "Investment failed";
        alert(errorMsg);
        console.error("Investment error:", res.data);
      }
    } catch (err) {
      console.error("Network or parsing error:", err);
      alert("Investment failed. Please check your connection and try again.");
    } finally {
      setInvesting(false);
    }
  };

  if (loading) return <><TopBar /><p style={{ padding: "20px" }}>Loading loan details...</p><Footer /></>;
  if (error || !loan) return <><TopBar /><p style={{ padding: "20px" }}>{error || "Loan not found"}</p><Footer /></>;

  const fundingPercentage = loan.amount
    ? Math.min(((loan.funded || 0) / loan.amount) * 100, 100)
    : 0;

  const remaining = (loan.amount || 0) - (loan.funded || 0);
  const isOwnLoan = !!user && user.id === loan.borrower_id;
  const canInvest = loan.status === "open" && remaining > 0 && !isOwnLoan;

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
              <p className="label">Credit History Rating</p>
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
            <p>Please <Link to="/auth">log in</Link> to invest.</p>
          ) : (
            <>
              <div className="invest-grid">
                <div>
                  <label>Your Balance</label>
                  <p>{balance === null ? "…" : `KES ${balance.toLocaleString()}`}</p>

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
                    {loan.status?.toUpperCase() || "UNKNOWN"}
                  </p>

                  <label>Amount Still Needed</label>
                  <p>KES {remaining.toLocaleString()}</p>
                </div>
              </div>

              <button
                className="primary-btn"
                onClick={handleInvest}
                disabled={investing || !canInvest}
              >
                {investing
                  ? "Processing..."
                  : isOwnLoan
                  ? "This is your loan"
                  : loan.status === "funded"
                  ? "Fully Funded"
                  : loan.status === "closed"
                  ? "Closed"
                  : "Invest Now"}
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