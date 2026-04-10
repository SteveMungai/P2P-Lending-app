import { useState, useEffect } from "react";
import "../styles/marketplace.css";
import Sidebar from "../components/Sidebar";
import LoanCard from "../components/Loancard";  
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

export default function Marketplace() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchLoans = () => {
    setLoading(true);
    setError(null);

    fetch("http://127.0.0.1:5000/api/loans/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch loans");
        }
        return res.json();
      })
      .then((data) => {
        //  ensure it's always an array
        setLoans(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching loans:", err);
        setError("Unable to load loans");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const clearFilters = () => {
    fetchLoans();
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
            {/* Loading state */}
            {loading && <p>Loading loans...</p>}

            {/*  Error state */}
            {error && <p className="error">{error}</p>}

            {/* Empty state */}
            {!loading && !error && loans.length === 0 && (
              <p>No loans found</p>
            )}

            {/* Normal render */}
            {!loading &&
              !error &&
              loans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}