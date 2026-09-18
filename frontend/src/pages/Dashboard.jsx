import React, { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import "../styles/dashboard.css";

const API = "http://127.0.0.1:5000";

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };


    Promise.all([
      fetch(`${API}/loans`, { headers }).then(res => res.json()),
      fetch(`${API}/repayments`, { headers }).then(res => res.json()),
      fetch(`${API}/users`, { headers }).then(res => res.json())
    ])
      .then(([loansData, repaymentsData, usersData]) => {
        setLoans(Array.isArray(loansData) ? loansData : []);
        setRepayments(Array.isArray(repaymentsData) ? repaymentsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch(err => console.error("Error fetching dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Simple derived values
  const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalPaid = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalLent = loans
  .filter(l => l.investments_id === users.id)
  .reduce((sum, l) => sum + (l.amount || 0), 0);

  const totalLoans = loans.length;
const completedLoans = loans.filter(l => l.status === "closed").length;

const repaymentRatio = totalLoans > 0
  ? completedLoans / totalLoans
  : 0;

let rating = "C";

if (repaymentRatio > 0.8) rating = "A+";
else if (repaymentRatio > 0.6) rating = "A";
else if (repaymentRatio > 0.4) rating = "B";

  if (loading) {
    return <div className="loading-screen">Loading your financial overview...</div>;
  }

  return (
    <div className="dashboard-container">
      <TopBar />

      <div className="dashboard-content">
        <div className="top-section">
          
          {/* USER INFO */}
          <div className="card">
            <h3>User Info</h3>
            <div className="stats-grid">
              <StatCard title="Credit History Rating" value={rating} />
              <StatCard title="Total Amount Lent" value={`$${totalLent.toLocaleString()}`} />
              <StatCard title="Next Payment Due" value="--" />
              <StatCard title="Total Amount Borrowed" value={`$${totalBorrowed.toLocaleString()}`} />
              <StatCard title="Total Amount Paid" value={`$${totalPaid.toLocaleString()}`} />
            </div>
          </div>

          {/* ACTIVE LOANS */}
          <div className="card">
            <h3>Active Loans</h3>
            {loans.length === 0 ? <p>No loans found.</p> : loans.map((loan) => {
              const paid = repayments
                .filter(r => r.loan_id === loan.id)
                .reduce((sum, r) => sum + (r.amount || 0), 0);

              const percent = loan.amount > 0
                ? Math.min((paid / loan.amount) * 100, 100)
                : 0;

              return (
                <div className="loan-row" key={loan.id}>
                  <div>
                    <p>Loan #{loan.id}</p>
                    <StatusBadge status={loan.status} />
                  </div>
                  <div>${loan.amount?.toLocaleString()}</div>
                  <ProgressBar percent={percent} />
                </div>
              );
            })}
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
                  <td>${r.amount}</td>
                  <td>
                    <StatusBadge status="Completed" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {repayments.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>No transactions yet.</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}