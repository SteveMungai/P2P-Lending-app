import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"; 

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  if (!loan) return null;

  return (
    <div className="loan-card">
      <div className="loan-image">
        <img
          src={
            loan.borrower_id
              ? `${API_URL}/api/users/${loan.borrower_id}/image`
              : "/default-loan.jpg"
          }
          alt={loan.borrower || "Borrower"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null; // prevents an infinite loop if the fallback also fails
            e.currentTarget.src = "/default-loan.jpg";
          }}
        />
      </div>

      <div className="loan-body">
        <h4>{loan.name || "Unnamed Loan"}</h4>

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
            <span>KES {Number(loan.amount || 0).toLocaleString("en-KE")}</span>
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

        <button className="invest-btn" onClick={() => navigate(`/loans/${loan.id}`)}>
          Invest
        </button>
      </div>
    </div>
  );
}