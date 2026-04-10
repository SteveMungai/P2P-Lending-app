import { useState, useEffect } from "react";

const API = "http://127.0.0.1:5000";

export default function Sidebar({ onApplyFilters }) {
  const [minAmount, setMinAmount] = useState(1000);
  const [maxAmount, setMaxAmount] = useState(50000);
  const [risk, setRisk] = useState("");
  const [portfolio, setPortfolio] = useState(0);
  const [funds, setFunds] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/api/investor/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setPortfolio(data.portfolio_value || 0);
        setFunds(data.available_funds || 0);
      })
      .catch(err => console.error(err));
  }, [token]);

  const handleApply = () => {
    onApplyFilters({ minAmount, maxAmount, risk });
  };

  return (
    <div className="sidebar">
      <div className="investor-summary">
        <h4>INVESTOR SUMMARY</h4>

        <p>Portfolio Value</p>
        <span>KES {portfolio.toLocaleString()}</span>

        <p>Available Funds</p>
        <span>KES {funds.toLocaleString()}</span>
      </div>

      <button onClick={handleApply}>APPLY FILTERS</button>
    </div>
  );
}