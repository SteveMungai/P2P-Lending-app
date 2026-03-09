import { useNavigate } from "react-router-dom";
import "../styles/marketplace.css";

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  return (
    <div
      className="loan-card"
      onClick={() => navigate(`/loan/${loan.id}`)}
      style={{ cursor: "pointer" }}
    >
      <img src={loan.image} alt={loan.name} />
      <h3>{loan.purpose}</h3>
      <p>{loan.term}</p>
      <p>Rate: {loan.rate}</p>
      <p>Risk: {loan.risk}</p>
    </div>
  );
}