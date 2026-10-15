import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE = `${process.env.PUBLIC_URL || ""}/default-loan.svg`;

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  if (!loan) return null;

  return (
    <div className="loan-card">
      <img
        src={loan.image || FALLBACK_IMAGE}
        alt={loan.name || "Loan"}
        onError={(e) => {
          // broken or unreachable image -> placeholder (guard against a loop)
          if (!e.currentTarget.src.endsWith("/default-loan.svg")) {
            e.currentTarget.src = FALLBACK_IMAGE;
          }
        }}
      />

      <h4>{loan.name || "Unnamed Loan"}</h4>

      <p>Purpose: {loan.purpose || "Personal Loan"}</p>
      <p>Term: {loan.term || 0} months</p>

      <p>Amount: KES {(loan.amount || 0).toLocaleString()}</p>

      <p>Risk: {loan.risk || "N/A"}</p>
      <p>Interest: {loan.rate || 0}%</p>

      <button
        className="invest-btn"
        onClick={() => navigate(`/loans/${loan.id}`)}
      >
        Invest
      </button>
    </div>
  );
}
