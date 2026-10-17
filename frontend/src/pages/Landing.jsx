import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiEye,
  FiLock,
  FiPieChart,
  FiSliders,
  FiTrendingUp,
  FiUserPlus,
  FiSearch,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HScroller from "../components/HScroller";
import RiskReturnMatrix from "../components/RiskReturnMatrix";
import { ILLUSTRATIVE } from "../data/riskReturn";
import { apiFetch } from "../utils/api";
import "../styles/landing.css";

const FALLBACK_IMAGE = `${process.env.PUBLIC_URL || ""}/default-loan.svg`;
const kes = (n) => `KES ${Math.round(Number(n) || 0).toLocaleString()}`;
const GRADE = { Low: "A", Medium: "B", High: "C" };

const STEPS = [
  {
    icon: <FiUserPlus />,
    title: "Create your account",
    text: "Sign up in a minute with your name and email. No paperwork to start browsing.",
  },
  {
    icon: <FiSearch />,
    title: "Choose how to take part",
    text: "Fund as much or as little of a loan as you like, or request a loan of your own.",
  },
  {
    icon: <FiPieChart />,
    title: "Follow your money",
    text: "Your dashboard shows what you've lent, what you've borrowed and every repayment.",
  },
];

const BENEFITS = [
  {
    icon: <FiEye />,
    title: "See the risk first",
    text: "Every loan shows its risk grade, interest rate and term before you invest a shilling.",
  },
  {
    icon: <FiSliders />,
    title: "You decide how much",
    text: "Fund part of a loan, or all of it. A loan stays open until the full amount is funded.",
  },
  {
    icon: <FiBarChart2 />,
    title: "Compare honestly",
    text: "Our risk and return matrix sets loan returns beside savings and index funds, bad years included.",
  },
  {
    icon: <FiLock />,
    title: "Built with care",
    text: "Passwords are stored hashed, and every action is tied to your signed-in session.",
  },
];

const FAQ = [
  {
    q: "Can I lose money?",
    a: "Yes. If a borrower doesn't repay, you can lose part or all of what you funded. That is why every loan shows a risk grade, and why we suggest spreading your money across several loans.",
  },
  {
    q: "Can I fund just part of a loan?",
    a: "Yes. You choose the amount. The loan stays open until its full amount has been funded, then it closes to new investors.",
  },
  {
    q: "How are loans graded?",
    a: "Grades follow the interest rate: up to 10% is Grade A (low risk), 10–18% is Grade B (medium risk) and above 18% is Grade C (high risk). Higher rates reflect a higher chance of late or missed payments.",
  },
  {
    q: "What do “advertised” and “net” return mean?",
    a: "Advertised is the interest a borrower agrees to pay. Net is what is left after the share lost to late or missed payments. Net is the number to compare with a savings account or an index fund.",
  },
  {
    q: "Are the numbers in the matrix real?",
    a: ILLUSTRATIVE
      ? "The sample returns in the matrix are illustrative. They show you how to read the chart and are not a forecast or a promise. The counts and average interest rates marked “Live” come straight from the marketplace."
      : "The matrix shows results from past loans on the platform. Past results are not a guide to future returns.",
  },
  {
    q: "Can I borrow here too?",
    a: "Yes. Create an account, then use “Create a Loan” in the marketplace sidebar. Say how much you need, the interest rate you'll pay, the term and what it's for, and investors can start funding it.",
  },
];

function LoanTile({ loan }) {
  return (
    <article className="lp-loan">
      <div className="lp-loan-top">
        <img
          src={loan.image || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith("/default-loan.svg")) e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div>
          <h3>{loan.purpose}</h3>
          <p>{loan.name}</p>
        </div>
        <span className={`lp-chip lp-risk lp-risk--${loan.risk.toLowerCase()}`}>
          Grade {GRADE[loan.risk]}
        </span>
      </div>

      <p className="lp-loan-amount">{kes(loan.amount)}</p>
      <dl className="lp-loan-meta">
        <div>
          <dt>Interest</dt>
          <dd>{loan.rate}%</dd>
        </div>
        <div>
          <dt>Term</dt>
          <dd>{loan.term} mo</dd>
        </div>
        <div>
          <dt>Funded</dt>
          <dd>{loan.progress}%</dd>
        </div>
      </dl>
      <div className="lp-meter" aria-hidden="true">
        <span style={{ width: `${loan.progress}%` }} />
      </div>

      <Link className="lp-loan-link" to={`/loans/${loan.id}`}>
        View loan <FiArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [state, setState] = useState("loading"); // loading | ok | error


  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/loans/?status=open", { auth: false })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok || !Array.isArray(res.data)) throw new Error("bad response");
        setLoans(res.data);
        setState("ok");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshot = useMemo(() => {
    if (!loans.length) return null;
    return {
      count: loans.length,
      total: loans.reduce((s, l) => s + l.amount, 0),
      avgRate: loans.reduce((s, l) => s + (Number(l.rate) || 0), 0) / loans.length,
      newest: loans[0],
    };
  }, [loans]);

  return (
    <div className="lp">
      <Navbar />

      <main>
        {/*  HERO  */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-chip lp-chip--soft">Peer-to-peer lending, in the open</span>
              <h1>
                Lend with clarity.
                <br />
                <span>Borrow with confidence.</span>
              </h1>
              <p>
                LendConnect connects people who need a loan with people who want to fund one. Every
                request shows its interest rate, term and risk grade up front, so you always know what
                you are getting into.
              </p>

              <div className="lp-actions">
                <button className="lp-btn lp-btn--primary" onClick={() => navigate("/marketplace")}>
                  Start investing <FiArrowRight aria-hidden="true" />
                </button>
                <button className="lp-btn lp-btn--ghost" onClick={() => navigate("/marketplace?new=1")}>
                  Request a loan
                </button>
              </div>

              <ul className="lp-trust">
                <li>
                  <FiEye aria-hidden="true" /> Risk grade on every loan
                </li>
                <li>
                  <FiSliders aria-hidden="true" /> Fund any amount
                </li>
                <li>
                  <FiTrendingUp aria-hidden="true" /> One clear dashboard
                </li>
              </ul>
            </div>

            <aside className="lp-snapshot" aria-label="Marketplace right now">
              <header>
                <span className="lp-live-dot" aria-hidden="true" />
                Marketplace right now
              </header>

              {state === "loading" && <div className="lp-skeleton" aria-busy="true" />}

              {state === "error" && (
                <p className="lp-snapshot-empty">
                  We couldn’t load live numbers just now. The marketplace is still available.
                </p>
              )}

              {state === "ok" && !snapshot && (
                <p className="lp-snapshot-empty">
                  No open loan requests yet. Be the first to ask for funding.
                </p>
              )}

              {snapshot && (
                <>
                  <dl className="lp-snapshot-stats">
                    <div>
                      <dt>Open requests</dt>
                      <dd>{snapshot.count}</dd>
                    </div>
                    <div>
                      <dt>Total requested</dt>
                      <dd>{kes(snapshot.total)}</dd>
                    </div>
                    <div>
                      <dt>Average interest</dt>
                      <dd>{snapshot.avgRate.toFixed(1)}%</dd>
                    </div>
                  </dl>
                  <Link className="lp-snapshot-newest" to={`/loans/${snapshot.newest.id}`}>
                    <span>
                      <small>Newest request</small>
                      {snapshot.newest.purpose}
                    </span>
                    <strong>{kes(snapshot.newest.amount)}</strong>
                  </Link>
                </>
              )}
            </aside>
          </div>
        </section>

        {/* HOW IT WORKS  */}
        <section className="lp-section" id="how">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <span className="lp-eyebrow">How it works</span>
              <h2>Three steps, no surprises</h2>
              <p>
                Peer-to-peer lending cuts out the middleman: borrowers ask, investors fund, and
                everyone can see the terms.
              </p>
            </div>

            <ol className="lp-steps lp-snap">
              {STEPS.map((s, i) => (
                <li className="lp-card" key={s.title}>
                  <span className="lp-card-icon">{s.icon}</span>
                  <span className="lp-step-no">Step {i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/*  LIVE OPPORTUNITIES (carousel) */}
        <section className="lp-section lp-section--tint" id="opportunities">
          <div className="lp-wrap">
            <div className="lp-section-head lp-section-head--row">
              <div>
                <span className="lp-eyebrow">Opportunities</span>
                <h2>Open loan requests</h2>
                <p>Real requests from the marketplace, newest first. Swipe or use the arrows.</p>
              </div>
              <Link className="lp-link" to="/marketplace">
                Browse all <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            {state === "loading" && (
              <div className="lp-skeleton-row" aria-busy="true">
                <div className="lp-skeleton" />
                <div className="lp-skeleton" />
                <div className="lp-skeleton" />
              </div>
            )}

            {state === "ok" && loans.length > 0 && (
              <HScroller label="Open loan requests">
                {loans.slice(0, 10).map((loan) => (
                  <LoanTile key={loan.id} loan={loan} />
                ))}
              </HScroller>
            )}

            {state === "ok" && loans.length === 0 && (
              <div className="lp-empty">
                <h3>No open requests right now</h3>
                <p>New loan requests appear here as soon as borrowers post them.</p>
                <button className="lp-btn lp-btn--primary" onClick={() => navigate("/marketplace?new=1")}>
                  Request a loan
                </button>
              </div>
            )}

            {state === "error" && (
              <div className="lp-empty">
                <h3>We couldn’t load the loans</h3>
                <p>Check your connection and refresh, or open the marketplace directly.</p>
                <Link className="lp-btn lp-btn--primary" to="/marketplace">
                  Go to the marketplace
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* WHY LENDCONNECT */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <span className="lp-eyebrow">Why LendConnect</span>
              <h2>Built around being straight with you</h2>
            </div>
            <div className="lp-benefits lp-snap">
              {BENEFITS.map((b) => (
                <div className="lp-card" key={b.title}>
                  <span className="lp-card-icon">{b.icon}</span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RISK & RETURN MATRIX  */}
        <section className="lp-section lp-section--dark-top lp-section--tint" id="risk">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <span className="lp-eyebrow">Transparency</span>
              <h2>The risk and return matrix</h2>
              <p>
                Higher interest usually means higher risk. Here is how each loan grade compares with a
                savings account and an index fund, before and after defaults, so you can decide with
                your eyes open. Tap a bar to see the detail.
              </p>
            </div>
            <RiskReturnMatrix loans={loans} />
          </div>
        </section>

        {/*  FAQ  */}
        <section className="lp-section" id="faq">
          <div className="lp-wrap lp-wrap--narrow">
            <div className="lp-section-head">
              <span className="lp-eyebrow">FAQ</span>
              <h2>Questions investors ask</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/*  CTA  */}
        <section className="lp-cta">
          <div className="lp-wrap">
            <h2>Ready to look at real loan requests?</h2>
            <p>Browse the marketplace first. You only need an account when you want to invest or borrow.</p>
            <div className="lp-actions lp-actions--center">
              <button className="lp-btn lp-btn--light" onClick={() => navigate("/marketplace")}>
                Browse the marketplace
              </button>
              <button className="lp-btn lp-btn--outline-light" onClick={() => navigate("/auth")}>
                Create an account
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
