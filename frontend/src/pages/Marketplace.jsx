import { useState } from "react";
import "../styles/marketplace.css";
import Sidebar from "../components/Sidebar";
import LoanCard from "../components/Loancard";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

const initialLoans = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  name: `Borrower ${index + 1}`,
  purpose: "Business",
  term: "12 months",
  remaining: "KES 3,500",
  risk: ["High", "Medium", "Low"][index % 3],
  rate: "12%",
  image: `https://i.pravatar.cc/150?img=${index + 10}`
}));

export default function Marketplace() {
  const [loans, setLoans] = useState(initialLoans);

  const clearFilters = () => {
    setLoans(initialLoans);
  };

  return (
    <div className="marketplace">
      <TopBar />

      <div className="marketplace-body">
        <Sidebar clearFilters={clearFilters} />

        <div className="content">
          <div className="content-header">
            <h3>AVAILABLE OPPORTUNITIES</h3>
            <button className="clear-btn" onClick={clearFilters}>
              CLEAR FILTERS
            </button>
          </div>

          <div className="loan-grid">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}