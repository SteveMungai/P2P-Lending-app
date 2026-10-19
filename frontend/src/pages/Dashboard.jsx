import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { apiFetch, clearSession, getStoredUser } from "../utils/api";
import "../styles/dashboard.css";

/*  helpers  */
const kes = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const compact = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${Math.round(n)}`;
const shortDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const GRADE = { Low: "A", Medium: "B", High: "C" };
const RISKS = ["Low", "Medium", "High"];

const STANDING = {
  "A+": "Excellent. You close almost every loan you open.",
  A: "Very good. Most of your loans are fully closed.",
  B: "Fair. About half of your loans are closed.",
  C: "Building. Few of your loans are closed so far.",
  "N/A": "No borrowing history yet. Request a loan to start building one.",
};

function Chip({ kind, children }) {
  return <span className={`dx-chip dx-chip--${kind}`}>{children}</span>;
}

const statusChip = (status) => (
  <Chip kind={status || "open"}>{(status || "open").replace(/^./, (c) => c.toUpperCase())}</Chip>
);

/*  "investing over time" chart (real investments, cumulative)  */
function GrowthChart({ points }) {
  const W = 600;
  const H = 190;
  const max = points[points.length - 1].total;
  const x = (i) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v) => H - (v / max) * (H - 14) - 4;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${H} L${x(0)},${H} Z`;

  const ticks = [
    { value: max, top: (y(max) / H) * 100 },
    { value: max / 2, top: (y(max / 2) / H) * 100 },
    { value: 0, top: (y(0) / H) * 100 },
  ];

  return (
    <figure className="dx-chart">
      <div className="dx-chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Total invested grew to ${kes(max)}`}>
          <defs>
            <linearGradient id="dx-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t.top} x1="0" x2={W} y1={y(t.value)} y2={y(t.value)} className="dx-chart-grid" />
          ))}
          {points.length > 1 && <path d={area} fill="url(#dx-area)" />}
          {points.length > 1 && <path d={line} className="dx-chart-line" />}
          {points.map((p, i) => (
            <circle key={p.id} cx={x(i)} cy={y(p.total)} r="5" className="dx-chart-dot">
              <title>{`${shortDate(p.date)}: +${kes(p.amount)} (total ${kes(p.total)})`}</title>
            </circle>
          ))}
        </svg>
        <div className="dx-chart-y" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t.top} style={{ top: `${t.top}%` }}>
              {t.value === 0 ? "0" : `KES ${compact(t.value)}`}
            </span>
          ))}
        </div>
      </div>
      <figcaption>
        <span>{shortDate(points[0].date)}</span>
        <span>Each point is one investment</span>
        <span>{shortDate(points[points.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}

/*  page  */
export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [data, setData] = useState({ loans: [], repayments: [], investments: [], me: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch("/api/loans/mine"),
      apiFetch("/api/repayments/"),
      apiFetch("/api/investments/"),
      apiFetch("/api/users/me"),
    ])
      .then((results) => {
        if (cancelled) return;
        const [loansRes, repaymentsRes, investmentsRes, meRes] = results;

        // expired / invalid login -> back to the login page
        if (results.some((r) => r.status === 401)) {
          clearSession();
          navigate("/auth", { replace: true });
          return;
        }
        if (!results.every((r) => r.ok)) {
          setError("Some of your data could not be loaded. Please try again.");
        }

        const list = (r) => (Array.isArray(r.data) ? r.data : []);
        setData({
          loans: list(loansRes),
          repayments: list(repaymentsRes),
          investments: list(investmentsRes),
          me: meRes.ok ? meRes.data : null,
        });
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        if (!cancelled) setError("Unable to reach the server.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => load(), [load]);

  const { loans, repayments, investments, me } = data;

  /*  numbers (everything below comes from the user's own records)  */
  const stats = useMemo(() => {
    const invested = investments.reduce((s, i) => s + i.amount, 0);
    const borrowed = loans.reduce((s, l) => s + l.amount, 0);
    const repaid = repayments.reduce((s, r) => s + r.amount, 0);

    const mix = RISKS.map((risk) => {
      const amount = investments.filter((i) => i.risk === risk).reduce((s, i) => s + i.amount, 0);
      return { risk, amount, pct: invested ? (amount / invested) * 100 : 0 };
    });

    let running = 0;
    const growth = [...investments]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((i) => {
        running += i.amount;
        return { id: i.id, date: i.created_at, amount: i.amount, total: running };
      });

    const closed = loans.filter((l) => l.status === "closed").length;
    const ratio = loans.length ? closed / loans.length : 0;
    let rating = "N/A";
    if (loans.length) rating = ratio > 0.8 ? "A+" : ratio > 0.6 ? "A" : ratio > 0.4 ? "B" : "C";

    const activity = [
      ...investments.map((i) => ({
        key: `i${i.id}`,
        date: i.created_at,
        label: `Invested in “${i.purpose || `Loan #${i.loan_id}`}”`,
        type: "Investment",
        amount: i.amount,
      })),
      ...repayments.map((r) => ({
        key: `r${r.id}`,
        date: r.date,
        label: `Repayment on Loan #${r.loan_id}`,
        type: "Repayment",
        amount: r.amount,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      invested,
      borrowed,
      repaid,
      repaidPct: borrowed ? Math.min((repaid / borrowed) * 100, 100) : 0,
      mix,
      growth,
      rating,
      closed,
      activity,
      loanCount: new Set(investments.map((i) => i.loan_id)).size,
    };
  }, [loans, repayments, investments]);

  const dominant = [...stats.mix].sort((a, b) => b.pct - a.pct)[0];
  const firstName = (user?.full_name || "there").split(" ")[0];

  /* loading */
  if (loading) {
    return (
      <div className="dx">
        <TopBar />
        <main className="dx-wrap" aria-busy="true">
          <div className="dx-skel dx-skel--title" />
          <div className="dx-bento">
            <div className="dx-skel dx-s5" />
            <div className="dx-skel dx-s7" />
            <div className="dx-skel dx-s4" />
            <div className="dx-skel dx-s4" />
            <div className="dx-skel dx-s4" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dx">
      <TopBar />

      <main className="dx-wrap">
        <header className="dx-head">
          <div>
            <h1>
              {greeting()}, {firstName}
            </h1>
            <p>Here’s a clear picture of what you’ve lent, what you’ve borrowed and what’s coming up.</p>
          </div>
          <button className="dx-icon-btn" onClick={load} aria-label="Refresh your data" title="Refresh">
            <FiRefreshCw />
          </button>
        </header>

        {error && (
          <div className="dx-alert" role="alert">
            {error} <button onClick={load}>Try again</button>
          </div>
        )}

        <div className="dx-bento">
          {/*Balance*/}
          <section className="dx-tile dx-tile--balance dx-s5" aria-label="Your funds">
            <span className="dx-eyebrow">Available funds</span>
            <p className="dx-money">{me ? kes(me.available_funds) : "—"}</p>
            <p className="dx-sub">Ready to invest in new loans.</p>

            <dl className="dx-mini">
              <div>
                <dt>Portfolio value</dt>
                <dd>{me ? kes(me.portfolio_value) : kes(stats.invested)}</dd>
              </div>
              <div>
                <dt>Loans funded</dt>
                <dd>{stats.loanCount}</dd>
              </div>
            </dl>

            <div className="dx-actions">
              <Link to="/marketplace" className="dx-btn dx-btn--light">
                <FiSearch aria-hidden="true" /> Browse loans
              </Link>
              <Link to="/marketplace?new=1" className="dx-btn dx-btn--outline">
                <FiPlus aria-hidden="true" /> Request a loan
              </Link>
            </div>
          </section>

          {/*  Investing over time  */}
          <section className="dx-tile dx-s7" aria-labelledby="dx-growth">
            <header className="dx-tile-head">
              <div>
                <h2 id="dx-growth">Investing over time</h2>
                <p>The total you’ve put to work since your first investment.</p>
              </div>
              <strong className="dx-figure">{kes(stats.invested)}</strong>
            </header>

            {stats.growth.length ? (
              <GrowthChart points={stats.growth} />
            ) : (
              <div className="dx-empty">
                <h3>Your investing story starts here</h3>
                <p>Once you fund your first loan, this chart will show how your portfolio grows.</p>
                <Link to="/marketplace" className="dx-btn dx-btn--primary">
                  Find a loan to fund <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          {/*  Risk mix  */}
          <section className="dx-tile dx-s4 dx-tablet-half" aria-labelledby="dx-mix">
            <h2 id="dx-mix">Portfolio risk mix</h2>
            <p className="dx-tile-sub">How your invested money is spread across risk grades.</p>

            {stats.invested > 0 ? (
              <>
                <div className="dx-stack" role="img" aria-label="Share of your money in each risk grade">
                  {stats.mix.map((m) =>
                    m.pct > 0 ? (
                      <span
                        key={m.risk}
                        className={`dx-stack-seg dx-stack-seg--${m.risk.toLowerCase()}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    ) : null
                  )}
                </div>
                <ul className="dx-legend">
                  {stats.mix.map((m) => (
                    <li key={m.risk}>
                      <span>
                        <i className={`dx-dot dx-dot--${m.risk.toLowerCase()}`} /> Grade {GRADE[m.risk]} · {m.risk} risk
                      </span>
                      <span>
                        {m.pct.toFixed(0)}% <small>{kes(m.amount)}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="dx-note">
                  {dominant.risk === "High"
                    ? "Most of your money is in high-risk loans. Consider balancing it with Grade A or B."
                    : dominant.risk === "Low"
                    ? "Most of your money is in low-risk loans. That is steadier, with lower returns."
                    : "Most of your money is in medium-risk loans, a balanced middle ground."}
                </p>
              </>
            ) : (
              <p className="dx-empty-text">
                Invest in a loan and we’ll show how your money is split between low, medium and high risk.
              </p>
            )}
          </section>

          {/*  Standing*/}
          <section className="dx-tile dx-s4 dx-tablet-half" aria-labelledby="dx-standing">
            <h2 id="dx-standing">Borrower standing</h2>
            <p className="dx-tile-sub">Based on how many of your loans you’ve closed.</p>
            <div className="dx-rating">
              <span className={`dx-rating-badge${stats.rating === "N/A" ? " is-na" : ""}`}>{stats.rating}</span>
              <p>{STANDING[stats.rating]}</p>
            </div>
            <dl className="dx-mini dx-mini--light">
              <div>
                <dt>Loans requested</dt>
                <dd>{loans.length}</dd>
              </div>
              <div>
                <dt>Fully closed</dt>
                <dd>{stats.closed}</dd>
              </div>
            </dl>
          </section>

          {/*  Borrowing  */}
          <section className="dx-tile dx-s4 dx-tablet-full" aria-labelledby="dx-borrow">
            <h2 id="dx-borrow">Borrowing</h2>
            <p className="dx-tile-sub">What you’ve asked for and what you’ve paid back.</p>
            <p className="dx-money dx-money--ink">{kes(stats.borrowed)}</p>
            <p className="dx-sub">
              requested across {loans.length} loan{loans.length === 1 ? "" : "s"}
            </p>

            <div
              className="dx-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(stats.repaidPct)}
              aria-label="Repaid so far"
            >
              <span style={{ width: `${stats.repaidPct}%` }} />
            </div>
            <p className="dx-bar-caption">
              <strong>{kes(stats.repaid)}</strong> repaid ({stats.repaidPct.toFixed(0)}%)
            </p>
          </section>

          {/*  My loans  */}
          <section className="dx-tile dx-s6" aria-labelledby="dx-loans">
            <header className="dx-tile-head">
              <div>
                <h2 id="dx-loans">Your loan requests</h2>
                <p>Track how much of each request is funded.</p>
              </div>
              <Link to="/marketplace?new=1" className="dx-link">
                New request <FiArrowRight aria-hidden="true" />
              </Link>
            </header>

            {loans.length ? (
              <ul className="dx-list">
                {loans.slice(0, 5).map((loan) => (
                  <li key={loan.id}>
                    <Link to={`/loans/${loan.id}`} className="dx-row">
                      <div className="dx-row-main">
                        <strong>{loan.purpose}</strong>
                        <span>
                          {kes(loan.amount)} · {loan.rate}% · {loan.term} mo
                        </span>
                        <div className="dx-bar dx-bar--thin" aria-hidden="true">
                          <span style={{ width: `${loan.progress}%` }} />
                        </div>
                      </div>
                      <div className="dx-row-side">
                        {statusChip(loan.status)}
                        <small>{loan.progress}% funded</small>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dx-empty dx-empty--compact">
                <h3>No loan requests yet</h3>
                <p>Need funding? Tell investors how much you need and what it’s for.</p>
              </div>
            )}
          </section>

          {/* My investments */}
          <section className="dx-tile dx-s6" aria-labelledby="dx-invs">
            <header className="dx-tile-head">
              <div>
                <h2 id="dx-invs">Your investments</h2>
                <p>The loans you’ve helped fund.</p>
              </div>
              <Link to="/marketplace" className="dx-link">
                Find more <FiArrowRight aria-hidden="true" />
              </Link>
            </header>

            {investments.length ? (
              <ul className="dx-list">
                {investments.slice(0, 5).map((inv) => (
                  <li key={inv.id}>
                    <Link to={`/loans/${inv.loan_id}`} className="dx-row">
                      <div className="dx-row-main">
                        <strong>{inv.purpose || `Loan #${inv.loan_id}`}</strong>
                        <span>
                          {inv.rate}% interest · {shortDate(inv.created_at)}
                        </span>
                      </div>
                      <div className="dx-row-side">
                        <strong>{kes(inv.amount)}</strong>
                        <span className="dx-row-chips">
                          {inv.risk && <Chip kind={inv.risk.toLowerCase()}>Grade {GRADE[inv.risk]}</Chip>}
                          {statusChip(inv.loan_status)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dx-empty dx-empty--compact">
                <h3>No investments yet</h3>
                <p>Browse open requests, check the risk grade and fund as much as you’re comfortable with.</p>
              </div>
            )}
          </section>

          {/* Activity */}
          <section className="dx-tile dx-s12" aria-labelledby="dx-activity">
            <header className="dx-tile-head">
              <div>
                <h2 id="dx-activity">Recent activity</h2>
                <p>Every investment and repayment, newest first.</p>
              </div>
            </header>

            {stats.activity.length ? (
              <div className="dx-table-wrap">
                <table className="dx-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">What happened</th>
                      <th scope="col">Type</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.activity.slice(0, 10).map((a) => (
                      <tr key={a.key}>
                        <td>{shortDate(a.date)}</td>
                        <td>{a.label}</td>
                        <td>
                          <Chip kind={a.type === "Investment" ? "funded" : "open"}>{a.type}</Chip>
                        </td>
                        <td className="dx-num">{kes(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="dx-empty-text">
                Nothing here yet. Your investments and repayments will appear as soon as you make them.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
