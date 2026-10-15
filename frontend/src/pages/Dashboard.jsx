import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import { apiFetch, clearSession } from "../utils/api";
import "../styles/dashboard.css";

const kes = (n) => `KES ${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const [loans, setLoans] = useState([]); 
  const [repayments, setRepayments] = useState([]);
  const [investments, setInvestments] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch("/api/loans/mine"),
      apiFetch("/api/repayments/"),
      apiFetch("/api/investments/"),
    ])
      .then(([loansRes, repaymentsRes, investmentsRes]) => {
        if (cancelled) return;

        // expired / invalid login -> back to the login page
        if ([loansRes, repaymentsRes, investmentsRes].some((r) => r.status === 401)) {
          clearSession();
          navigate("/auth", { replace: true });
          return;
        }
        if (![loansRes, repaymentsRes, investmentsRes].every((r) => r.ok)) {
          setError("Some of your data could not be loaded. Please try again.");
        }

        setLoans(Array.isArray(loansRes.data) ? loansRes.data : []);
        setRepayments(Array.isArray(repaymentsRes.data) ? repaymentsRes.data : []);
        setInvestments(Array.isArray(investmentsRes.data) ? investmentsRes.data : []);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        if (!cancelled) setError("Unable to reach the server.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Totals (all of these now belong to the logged-in user)
  const totalBorrowed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalPaid = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalLent = investments.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Credit history: share of the user's loans that are closed
  const totalLoans = loans.length;
  const completedLoans = loans.filter((l) => l.status === "closed").length;
  const repaymentRatio = totalLoans > 0 ? completedLoans / totalLoans : 0;

  let rating = "N/A";
  if (totalLoans > 0) {
    rating = "C";
    if (repaymentRatio > 0.8) rating = "A+";
    else if (repaymentRatio > 0.6) rating = "A";
    else if (repaymentRatio > 0.4) rating = "B";
  }

  if (loading) {
    return <div className="loading-screen">Loading your financial overview...</div>;
  }

  return (
    <div className="dashboard-container">
      <TopBar />

      <div className="dashboard-content">
        {error && <p className="error">{error}</p>}

        <div className="top-section">
          {/* USER INFO */}
          <div className="card">
            <h3>User Info</h3>
            <div className="stats-grid">
              <StatCard title="Credit History Rating" value={rating} />
              <StatCard title="Total Amount Lent" value={kes(totalLent)} />
              <StatCard title="Next Payment Due" value="--" />
              <StatCard title="Total Amount Borrowed" value={kes(totalBorrowed)} />
              <StatCard title="Total Amount Paid" value={kes(totalPaid)} />
            </div>
          </div>

          {/* ACTIVE LOANS */}
          <div className="card">
            <h3>Active Loans</h3>
            {loans.length === 0 ? (
              <p>No loans found.</p>
            ) : (
              loans.map((loan) => {
                const paid = repayments
                  .filter((r) => r.loan_id === loan.id)
                  .reduce((sum, r) => sum + (r.amount || 0), 0);

                const percent =
                  loan.amount > 0 ? Math.min((paid / loan.amount) * 100, 100) : 0;

                return (
                  <div className="loan-row" key={loan.id}>
                    <div>
                      <p>Loan #{loan.id}</p>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div>{kes(loan.amount)}</div>
                    <ProgressBar percent={percent} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="card transaction-card">
          <h3>Transaction History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {repayments.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>Loan #{r.loan_id} Repayment</td>
                  <td>{kes(r.amount)}</td>
                  <td>
                    <StatusBadge status="Completed" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {repayments.length === 0 && (
            <p style={{ textAlign: "center", padding: "1rem" }}>No transactions yet.</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
