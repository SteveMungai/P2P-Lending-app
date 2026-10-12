import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/marketplace.css";
import Sidebar from "../components/Sidebar";
import CreateLoanModal from "../components/CreateLoanModal";
import LoanCard from "../components/Loancard";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

const API = "http://127.0.0.1:5000";
const NO_FILTERS = { minAmount: null, maxAmount: null, risk: "" };

export default function Marketplace() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(NO_FILTERS);
  const [resetKey, setResetKey] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchLoans = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(`${API}/api/loans/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch loans");
        return res.json();
      })
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching loans:", err);
        setError("Unable to load loans");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  /* auto-hide the success toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* Filtering happens in the browser: the list endpoint already returns
     `amount` and `risk` for every loan. */
  const visibleLoans = useMemo(
    () =>
      loans.filter((loan) => {
        const amount = Number(loan.amount) || 0;
        if (filters.minAmount !== null && amount < filters.minAmount) return false;
        if (filters.maxAmount !== null && amount > filters.maxAmount) return false;
        if (filters.risk && loan.risk !== filters.risk) return false;
        return true;
      }),
    [loans, filters]
  );

  const filtersActive =
    filters.minAmount !== null || filters.maxAmount !== null || !!filters.risk;

  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setResetKey((k) => k + 1); // tells the sidebar to empty its inputs
  };

  const openCreateLoan = () => {
    if (!token) {
      navigate("/auth");
      return;
    }
    setShowCreate(true);
  };

  const handleLoanCreated = () => {
    setShowCreate(false);
    setToast("Your loan request is live on the marketplace.");
    fetchLoans();
  };

  return (
    <div className="marketplace">
      <TopBar />

      <div className="marketplace-body">
        <Sidebar
          onApplyFilters={setFilters}
          onResetFilters={clearFilters}
          onCreateLoan={openCreateLoan}
          resetKey={resetKey}
        />

        <div className="content">
          <div className="content-header">
            <h3>AVAILABLE OPPORTUNITIES</h3>
            <button
              className="clear-btn"
              onClick={clearFilters}
              disabled={!filtersActive}
            >
              CLEAR FILTERS
            </button>
          </div>

          <div className="loan-grid">
            {loading && <p>Loading loans...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && visibleLoans.length === 0 && (
              <p>
                {filtersActive
                  ? "No loans match your filters."
                  : "No loans found"}
              </p>
            )}

            {!loading &&
              !error &&
              visibleLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
          </div>
        </div>
      </div>

      <Footer />

      {showCreate && (
        <CreateLoanModal
          onClose={() => setShowCreate(false)}
          onCreated={handleLoanCreated}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}