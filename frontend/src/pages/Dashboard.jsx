import React from "react";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <TopBar />

      <div className="dashboard-content">

        {/* USER INFO + INVESTMENTS ROW */}
        <div className="top-section">

          {/* USER INFO */}
          <div className="card">
            <h3>User Info</h3>

            <div className="stats-grid">
              <StatCard title="Rating" value="A+" />
              <StatCard title="Total Amount Lent" value="$100,000" />
              <StatCard title="Next Payment Due" value="5th March 2026" />
              <StatCard title="Total Amount Borrowed" value="$250,000" />
              <StatCard title="Total Amount Paid" value="$200,000" />
            </div>
          </div>

          {/* ACTIVE LOANS */}
          <div className="card">
            <h3>Active Loans</h3>

            <div className="loan-row">
              <div>
                <p>Asset Purchase</p>
                <small>20th March 2026</small>
              </div>
              <div>$4000</div>
              <ProgressBar percent={60} />
            </div>

            <div className="loan-row">
              <div>
                <p>Personal Finance</p>
                <small>20th March 2026</small>
              </div>
              <div>$5</div>
              <ProgressBar percent={20} />
            </div>

            <div className="loan-row">
              <div>
                <p>Education</p>
                <small>7th March 2026</small>
              </div>
              <div>$200</div>
              <ProgressBar percent={45} />
            </div>

            <div className="loan-row">
              <div>
                <p>Debt Repayment</p>
                <small>5th March 2026</small>
              </div>
              <div>$10</div>
              <ProgressBar percent={80} />
            </div>

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
              <tr>
                <td>Feb 15th 2026</td>
                <td>Business Expansion</td>
                <td>$500</td>
                <td><StatusBadge status="Pending" /></td>
              </tr>
              <tr>
                <td>Oct 13th 2025</td>
                <td>Emergency</td>
                <td>$250</td>
                <td><StatusBadge status="Completed" /></td>
              </tr>
              <tr>
                <td>Jan 11th 2025</td>
                <td>Business Expansion</td>
                <td>$35,000</td>
                <td><StatusBadge status="Failed" /></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <Footer />
    </div>
  );
}