import { useState, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { API_URL as API } from "../config";


// Same thresholds the backend uses to label risk (loan_routes.get_risk)
const riskFromRate = (rate) => {
  if (!rate || Number.isNaN(rate)) return null;
  if (rate <= 10) return "Low";
  if (rate <= 18) return "Medium";
  return "High";
};

const INITIAL = { amount: "", rate: "", term: "", purpose: "" };

/**
 * "Create a loan" dialog.
 *
 * Props
 *  - onClose()      close without saving
 *  - onCreated()    called after the API confirms the loan was created
 */
export default function CreateLoanModal({ onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef(null);

  const token = localStorage.getItem("token");

  /* focus first field, close on Esc, lock page scroll */
  useEffect(() => {
    firstFieldRef.current?.focus();

    const onKeyDown = (e) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, submitting]);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const amount = Number(form.amount);
    const rate = Number(form.rate);
    const term = Number(form.term);

    if (!form.amount || !(amount > 0)) next.amount = "Enter an amount above 0.";
    if (!form.rate || !(rate > 0 && rate <= 100))
      next.rate = "Rate must be between 0 and 100.";
    if (!form.term || !Number.isInteger(term) || term < 1 || term > 120)
      next.term = "Enter whole months (1–120).";
    if (!form.purpose.trim()) next.purpose = "Tell investors what it's for.";
    else if (form.purpose.trim().length > 200)
      next.purpose = "Keep it under 200 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/loans/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount_requested: Number(form.amount),
          interest_rate: Number(form.rate),
          duration_months: Number(form.term),
          purpose: form.purpose.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 422) {
        throw new Error("Your session has expired. Please log in again.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Could not create the loan.");
      }

      onCreated?.(data);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const risk = riskFromRate(Number(form.rate));

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-loan-title"
      >
        <div className="modal-header">
          <div>
            <h3 id="create-loan-title">Create a loan</h3>
            <p>Request funding from investors on LendConnect.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="loan-amount">Amount needed (KES)</label>
            <input
              id="loan-amount"
              ref={firstFieldRef}
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="e.g. 25000"
              value={form.amount}
              onChange={update("amount")}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="loan-rate">Interest rate (%)</label>
              <input
                id="loan-rate"
                type="number"
                inputMode="decimal"
                min="0.1"
                max="100"
                step="0.1"
                placeholder="e.g. 12"
                value={form.rate}
                onChange={update("rate")}
                aria-invalid={!!errors.rate}
              />
              {errors.rate && <span className="form-error">{errors.rate}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="loan-term">Term (months)</label>
              <input
                id="loan-term"
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                placeholder="e.g. 12"
                value={form.term}
                onChange={update("term")}
                aria-invalid={!!errors.term}
              />
              {errors.term && <span className="form-error">{errors.term}</span>}
            </div>
          </div>

          {risk && (
            <p className="risk-hint">
              Investors will see this as a{" "}
              <span className={`risk-pill risk-pill--${risk.toLowerCase()}`}>
                {risk} risk
              </span>{" "}
              loan.
            </p>
          )}

          <div className="form-field">
            <label htmlFor="loan-purpose">Purpose</label>
            <input
              id="loan-purpose"
              type="text"
              maxLength={200}
              placeholder="e.g. Stock for my shop"
              value={form.purpose}
              onChange={update("purpose")}
              aria-invalid={!!errors.purpose}
            />
            {errors.purpose && (
              <span className="form-error">{errors.purpose}</span>
            )}
          </div>

          {submitError && (
            <p className="form-error form-error--banner" role="alert">
              {submitError}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
