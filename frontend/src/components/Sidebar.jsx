import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlusCircle, FiPlus, FiSliders, FiX } from "react-icons/fi";

const API = "http://127.0.0.1:5000";

const formatKES = (value) => {
  const n = Number(value || 0);
  return `KES ${n.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Marketplace sidebar.
 *
 * Desktop (> 900px): sticky column – stays in view while the loan grid scrolls.
 * Mobile  (<= 900px): a compact sticky bar (summary + quick actions) and a
 *                     slide-in drawer that holds the full sidebar.
 *
 * Props
 *  - onApplyFilters({ minAmount, maxAmount, risk })
 *  - onResetFilters()           called when the user clears the filters
 *  - onCreateLoan()             opens the "Create loan" modal (rendered by the page)
 *  - resetKey                   bump this number to clear the local filter inputs
 */
export default function Sidebar({
  onApplyFilters,
  onResetFilters,
  onCreateLoan,
  resetKey,
}) {
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [risk, setRisk] = useState("");

  const [portfolio, setPortfolio] = useState(0);
  const [funds, setFunds] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const token = localStorage.getItem("token");

  /* ── Investor summary ─────────────────────────────────────────── */
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    setSummaryLoading(true);

    fetch(`${API}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Summary request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setPortfolio(data.portfolio_value || 0);
        setFunds(data.available_funds || 0);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setSummaryLoading(false));

    return () => controller.abort();
  }, [token]);

  /* ── Clear inputs when the page asks for a reset ──────────────── */
  useEffect(() => {
    setMinAmount("");
    setMaxAmount("");
    setRisk("");
  }, [resetKey]);

  /* ── Drawer: close on Esc, lock page scroll while open ────────── */
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (e) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const rangeInvalid =
    minAmount !== "" &&
    maxAmount !== "" &&
    Number(minAmount) > Number(maxAmount);

  const handleApply = () => {
    if (rangeInvalid) return;
    onApplyFilters?.({
      minAmount: minAmount === "" ? null : Number(minAmount),
      maxAmount: maxAmount === "" ? null : Number(maxAmount),
      risk,
    });
    setDrawerOpen(false);
  };

  const handleReset = () => {
    setMinAmount("");
    setMaxAmount("");
    setRisk("");
    onResetFilters?.();
    setDrawerOpen(false);
  };

  const handleCreate = () => {
    setDrawerOpen(false);
    onCreateLoan?.();
  };

  const summaryValue = (value) => (summaryLoading ? "…" : formatKES(value));

  return (
    <>
      {/* ── MOBILE: compact sticky bar ─────────────────────────── */}
      <div className="sidebar-mobile-bar">
        <div className="msum" aria-label="Investor summary">
          <div>
            <small>Portfolio</small>
            <b>{token ? summaryValue(portfolio) : "—"}</b>
          </div>
          <div>
            <small>Available</small>
            <b>{token ? summaryValue(funds) : "—"}</b>
          </div>
        </div>

        <button
          type="button"
          className="mbar-btn mbar-btn--accent"
          onClick={handleCreate}
          aria-label="Create a loan"
        >
          <FiPlus />
        </button>
        <button
          type="button"
          className="mbar-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open filters"
          aria-expanded={drawerOpen}
          aria-controls="marketplace-sidebar"
        >
          <FiSliders />
        </button>
      </div>

      {drawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR (desktop column / mobile drawer) ───────────── */}
      <aside
        id="marketplace-sidebar"
        className={`sidebar${drawerOpen ? " is-open" : ""}`}
        aria-label="Marketplace sidebar"
      >
        <div className="sidebar-head-mobile">
          <span>Menu</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        {/* Investor summary */}
        <section className="investor-summary">
          <h4 className="summary-title">Investor Summary</h4>

          {token ? (
            <>
              <div className="summary-stat">
                <span className="summary-label">Portfolio Value</span>
                <span className="summary-value">{summaryValue(portfolio)}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Available Funds</span>
                <span className="summary-value summary-value--accent">
                  {summaryValue(funds)}
                </span>
              </div>
            </>
          ) : (
            <p className="summary-empty">
              <Link to="/auth">Log in</Link> to see your portfolio and funds.
            </p>
          )}
        </section>

        {/* Create loan */}
        <button type="button" className="create-loan-btn" onClick={handleCreate}>
          <FiPlusCircle />
          <span>Create a Loan</span>
        </button>

        {/* Filters */}
        <section className="filters">
          <h4 className="filters-title">Filters</h4>

          <div className="field">
            <label htmlFor="filter-min">Min amount (KES)</label>
            <input
              id="filter-min"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="e.g. 1,000"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="filter-max">Max amount (KES)</label>
            <input
              id="filter-max"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="e.g. 50,000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>

          {rangeInvalid && (
            <p className="field-error" role="alert">
              Min amount can’t be higher than max amount.
            </p>
          )}

          <div className="field">
            <label htmlFor="filter-risk">Risk level</label>
            <select
              id="filter-risk"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
            >
              <option value="">Any risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="apply-btn"
              onClick={handleApply}
              disabled={rangeInvalid}
            >
              Apply Filters
            </button>
            <button type="button" className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>
        </section>
      </aside>
    </>
  );
}