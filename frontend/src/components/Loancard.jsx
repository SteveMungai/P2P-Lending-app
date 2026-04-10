import { useNavigate } from "react-router-dom";

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  if (!loan) return null;

  return (
    <div className="loan-card">
      {/* Safe image fallback */}
      <img
        src={loan.image || "/default-loan.jpg"}
        alt={loan.name || "Loan"}
      />

      <h4>{loan.name || "Unnamed Loan"}</h4>

      <p>Purpose: {loan.purpose || "Personal Loan"}</p>
      <p>Term: {loan.term || 0} months</p>

      {/* Format money */}
      <p>
        Amount: KES{" "}
        {(loan.amount || 0).toLocaleString()}
      </p>

      <p>Risk: {loan.risk || "N/A"}</p>
      <p>Interest: {loan.rate || 0}%</p>

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