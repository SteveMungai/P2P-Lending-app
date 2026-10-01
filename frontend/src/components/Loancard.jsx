import { useNavigate } from "react-router-dom";

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  if (!loan) return null;

  return (
    <div className="loan-card">

      {/* Loan image */}
      <img
        src={loan.image || "/default-loan.jpg"}
        alt={loan.name || "Loan"}
      />

      {/* Loan name */}
      <h4>{loan.name || "Unnamed Loan"}</h4>

      {/* Loan information */}
      <div className="loan-info">

        <div className="info-item">
          <span className="label">Purpose</span>
          <span>{loan.purpose || "Personal Loan"}</span>
        </div>

        <div className="info-item">
          <span className="label">Term</span>
          <span>{loan.term || 0} months</span>
        </div>

        <div className="info-item">
          <span className="label">Amount</span>
          <span>
            KES {(loan.amount || 0).toLocaleString()}
          </span>
        </div>

        <div className="info-item">
          <span className="label">Risk</span>
          <span>{loan.risk || "N/A"}</span>
        </div>

        <div className="info-item">
          <span className="label">Interest</span>
          <span>{loan.rate || 0}%</span>
        </div>

      </div>

      {/* Navigate to loan details */}
      <button
        className="invest-btn"
        onClick={() => navigate(`/loans/${loan.id}`)}
      >
        Invest
      </button>

    </div>
  );
}

