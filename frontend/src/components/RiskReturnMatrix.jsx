import { useMemo, useState } from "react";
import { FiAlertTriangle, FiBarChart2, FiGrid } from "react-icons/fi";
import {
  GRADES,
  HORIZONS,
  ILLUSTRATIVE,
  OPTIONS,
  growth,
  net,
} from "../data/riskReturn";

const Y_MAX = 25; // top of the chart, in %
const GRID_LINES = [0, 5, 10, 15, 20, 25];

const pct = (v) => `${v.toFixed(1)}%`;
const signed = (v) => (v === 0 ? "0%" : `${v > 0 ? "+" : "−"}${Math.abs(v)}%`);
const kes = (v) => `KES ${Math.round(v).toLocaleString()}`;

// the marketplace calls them Low / Medium / High; the matrix calls them A / B / C
const RISK_TO_GRADE = { Low: "A", Medium: "B", High: "C" };

function Segmented({ label, value, onChange, options }) {
  return (
    <div className="lp-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "is-active" : ""}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * "Risk & Return Matrix" – a bento grid that compares loan grades with a
 * savings account and an index fund, and doesn't hide the downside.
 *
 * Props
 *  - loans  (optional) the live open loans, used to show what is on the marketplace right now
 */
export default function RiskReturnMatrix({ loans = [] }) {
  const [view, setView] = useState("chart"); // chart | table
  const [mode, setMode] = useState("net"); // net | gross
  const [selectedId, setSelectedId] = useState("B");
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(3);

  const selected = OPTIONS.find((o) => o.id === selectedId) || OPTIONS[1];
  const [, gradeB, gradeC] = GRADES;

  // live numbers from the real marketplace (not part of the sample data)
  const live = useMemo(() => {
    const out = {};
    GRADES.forEach((g) => {
      const mine = loans.filter((l) => RISK_TO_GRADE[l.risk] === g.id);
      out[g.id] = {
        count: mine.length,
        avgRate: mine.length
          ? mine.reduce((s, l) => s + (Number(l.rate) || 0), 0) / mine.length
          : null,
      };
    });
    return out;
  }, [loans]);

  const cVsB = net(gradeC) < net(gradeB) ? "less" : "more";

  return (
    <div className="lp-bento" id="risk-return">
      {/* ── 1. Chart / table ─────────────────────────────────────── */}
      <section className="lp-tile lp-span-8 lp-tile--chart" aria-labelledby="rr-title">
        <header className="lp-tile-head">
          <div>
            <h3 id="rr-title">Annual return by risk grade</h3>
            <p>How each grade compares with a savings account and an index fund.</p>
          </div>
          {ILLUSTRATIVE && <span className="lp-chip lp-chip--warn">Illustrative data</span>}
        </header>

        <div className="lp-controls">
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "chart", label: "Chart", icon: <FiBarChart2 aria-hidden="true" /> },
              { value: "table", label: "Table", icon: <FiGrid aria-hidden="true" /> },
            ]}
          />
          {view === "chart" ? (
            <Segmented
              label="Show returns"
              value={mode}
              onChange={setMode}
              options={[
                { value: "net", label: "After defaults" },
                { value: "gross", label: "Before defaults" },
              ]}
            />
          ) : (
            <Segmented
              label="Time horizon"
              value={years}
              onChange={setYears}
              options={HORIZONS.map((y) => ({ value: y, label: `${y} yr${y > 1 ? "s" : ""}` }))}
            />
          )}
        </div>

        {view === "chart" ? (
          <>
            <div className="lp-chart" role="group" aria-label="Annual return by option">
              <div className="lp-chart-grid" aria-hidden="true">
                {GRID_LINES.map((g) => (
                  <div key={g} className="lp-chart-line" style={{ bottom: `${(g / Y_MAX) * 100}%` }}>
                    <span>{g}%</span>
                  </div>
                ))}
              </div>

              <div className="lp-chart-bars">
                {OPTIONS.map((o) => {
                  const keep = net(o);
                  const total = mode === "net" ? keep : o.gross;
                  const keepH = (keep / Y_MAX) * 100;
                  const lossH = mode === "gross" ? (o.loss / Y_MAX) * 100 : 0;
                  const isSel = o.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={o.id}
                      className={`lp-bar lp-bar--${o.kind}${isSel ? " is-selected" : ""}`}
                      aria-pressed={isSel}
                      aria-label={`${o.name}: ${pct(total)} ${
                        mode === "net" ? "after defaults" : "before defaults"
                      }`}
                      onClick={() => setSelectedId(o.id)}
                    >
                      <span
                        className="lp-bar-value"
                        style={{ bottom: `calc(${(total / Y_MAX) * 100}% + 6px)` }}
                      >
                        {pct(total)}
                      </span>
                      <span className="lp-bar-stack">
                        {lossH > 0 && <span className="lp-bar-loss" style={{ height: `${lossH}%` }} />}
                        <span className="lp-bar-keep" style={{ height: `${keepH}%` }} />
                      </span>
                      <span className="lp-bar-label">{o.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="lp-legend">
              <li>
                <i className="lp-dot lp-dot--keep" /> What the investor keeps
              </li>
              {mode === "gross" && (
                <li>
                  <i className="lp-dot lp-dot--loss" /> Lost to defaults
                </li>
              )}
              <li>
                <i className="lp-dot lp-dot--bench" /> Alternatives
              </li>
            </ul>
          </>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th scope="col">Option</th>
                  <th scope="col">Advertised</th>
                  <th scope="col">Lost to defaults</th>
                  <th scope="col">Net return</th>
                  <th scope="col">Worst year</th>
                  <th scope="col">After {years} yr{years > 1 ? "s" : ""}*</th>
                </tr>
              </thead>
              <tbody>
                {OPTIONS.map((o) => (
                  <tr
                    key={o.id}
                    className={o.id === selectedId ? "is-selected" : ""}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <th scope="row">
                      {o.name}
                      {o.kind === "grade" && <small>{o.risk} risk</small>}
                    </th>
                    <td>{pct(o.gross)}</td>
                    <td>{o.loss ? `−${pct(o.loss)}` : "—"}</td>
                    <td className="lp-strong">{pct(net(o))}</td>
                    <td className={o.worstYear < 0 ? "lp-neg" : ""}>{signed(o.worstYear)}</td>
                    <td>{kes(growth(amount, net(o), years))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="lp-fine">
              *Starting with {kes(amount)} and compounding once a year at the net return. Change the
              amount in the calculator.
            </p>
          </div>
        )}
      </section>

      {/* ── 2. Detail for the selected option ────────────────────── */}
      <section className="lp-tile lp-span-4 lp-tile--detail" aria-live="polite">
        <header className="lp-tile-head">
          <div>
            <span className="lp-eyebrow">{selected.kind === "grade" ? "Loan grade" : "Alternative"}</span>
            <h3>{selected.name}</h3>
          </div>
          {selected.kind === "grade" && (
            <span className={`lp-chip lp-risk lp-risk--${selected.risk.toLowerCase()}`}>
              {selected.risk} risk
            </span>
          )}
        </header>

        <dl className="lp-stats">
          <div>
            <dt>Net return</dt>
            <dd>{pct(net(selected))}</dd>
          </div>
          <div>
            <dt>Lost to defaults</dt>
            <dd>{selected.loss ? pct(selected.loss) : "None"}</dd>
          </div>
          <div>
            <dt>Worst year</dt>
            <dd className={selected.worstYear < 0 ? "lp-neg" : ""}>{signed(selected.worstYear)}</dd>
          </div>
          <div>
            <dt>{selected.kind === "grade" ? "Typical term" : "Access"}</dt>
            <dd>{selected.kind === "grade" ? selected.term : selected.id === "savings" ? "Anytime" : "Daily"}</dd>
          </div>
        </dl>

        <p className="lp-body">{selected.kind === "grade" ? selected.summary : selected.note}</p>
        {selected.kind === "grade" && (
          <p className="lp-watch">
            <FiAlertTriangle aria-hidden="true" /> {selected.watchFor}
          </p>
        )}

        {selected.kind === "grade" && (
          <p className="lp-live">
            <span className="lp-live-dot" aria-hidden="true" />
            {live[selected.id].count > 0
              ? `Live now: ${live[selected.id].count} open ${selected.risk.toLowerCase()}-risk loan${
                  live[selected.id].count > 1 ? "s" : ""
                }, average interest ${pct(live[selected.id].avgRate)}.`
              : `No open ${selected.risk.toLowerCase()}-risk loans on the marketplace right now.`}
          </p>
        )}
      </section>

      {/* ── 3. Insight ───────────────────────────────────────────── */}
      <section className="lp-tile lp-span-4 lp-tile--insight">
        <span className="lp-eyebrow">The catch with high rates</span>
        <p className="lp-big">
          Grade C advertises <strong>{pct(gradeC.gross)}</strong>, but investors keep about{" "}
          <strong>{pct(net(gradeC))}</strong>.
        </p>
        <p className="lp-body">
          That is {cVsB} than Grade B ({pct(net(gradeB))}) with a much bigger worst year (
          {signed(gradeC.worstYear)} vs {signed(gradeB.worstYear)}). A higher rate is the price of
          higher risk, not a bonus.
        </p>

        <div className="lp-compare" aria-hidden="true">
          <div>
            <span>Advertised</span>
            <i style={{ width: `${(gradeC.gross / Y_MAX) * 100}%` }} />
            <b>{pct(gradeC.gross)}</b>
          </div>
          <div className="is-kept">
            <span>Kept</span>
            <i style={{ width: `${(net(gradeC) / Y_MAX) * 100}%` }} />
            <b>{pct(net(gradeC))}</b>
          </div>
        </div>
      </section>

      {/* ── 4. Calculator ────────────────────────────────────────── */}
      <section className="lp-tile lp-span-4 lp-tile--calc" aria-labelledby="calc-title">
        <header className="lp-tile-head">
          <div>
            <h3 id="calc-title">If you invested…</h3>
            <p>See what the numbers mean in shillings.</p>
          </div>
        </header>

        <label className="lp-range" htmlFor="rr-amount">
          <span>Amount</span>
          <strong>{kes(amount)}</strong>
        </label>
        <input
          id="rr-amount"
          type="range"
          min="10000"
          max="1000000"
          step="10000"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <Segmented
          label="Time horizon"
          value={years}
          onChange={setYears}
          options={HORIZONS.map((y) => ({ value: y, label: `${y} yr${y > 1 ? "s" : ""}` }))}
        />

        <ul className="lp-calc-list">
          {OPTIONS.map((o) => {
            const end = growth(amount, net(o), years);
            return (
              <li key={o.id} className={o.id === selectedId ? "is-selected" : ""}>
                <span>{o.short}</span>
                <span>
                  {kes(end)} <small>(+{kes(end - amount)})</small>
                </span>
              </li>
            );
          })}
        </ul>

        <p className="lp-calc-worst">
          <FiAlertTriangle aria-hidden="true" />
          <span>
            {selected.worstYear < 0 ? (
              <>
                In its worst year, {selected.name} lost{" "}
                <strong>{kes(Math.abs((amount * selected.worstYear) / 100))}</strong> of {kes(amount)}.
              </>
            ) : (
              <>
                {selected.name} didn’t lose money in its worst year, but its returns are the lowest here.
              </>
            )}
          </span>
        </p>
      </section>

      {/* ── 5. How grades work ───────────────────────────────────── */}
      <section className="lp-tile lp-span-4 lp-tile--grades">
        <h3>How a loan gets its grade</h3>
        <p className="lp-body">
          Every loan on the marketplace shows a grade, so you see the risk <em>before</em> you
          invest. Today the grade follows the interest the borrower agrees to pay:
        </p>
        <ul className="lp-grade-list">
          {GRADES.map((g) => (
            <li key={g.id}>
              <span className={`lp-chip lp-risk lp-risk--${g.risk.toLowerCase()}`}>{g.name}</span>
              <span>{g.band}</span>
            </li>
          ))}
        </ul>
        <p className="lp-fine">
          Also read each loan’s purpose, term and the borrower’s rating before you decide.
        </p>
      </section>

      {/* ── 6. Risk warning ──────────────────────────────────────── */}
      <section className="lp-tile lp-span-12 lp-tile--warning" role="note">
        <div className="lp-warning-icon" aria-hidden="true">
          <FiAlertTriangle />
        </div>
        <div>
          <h3>Lending is not risk-free</h3>
          <ul>
            <li>You can lose some or all of the money you lend. Borrowers can pay late, or not at all.</li>
            <li>Spread your money across many loans instead of putting it all in one.</li>
            <li>
              {ILLUSTRATIVE
                ? "The figures on this page are illustrative examples, not forecasts or promises."
                : "Figures show past results, which are not a guide to future returns."}{" "}
              Past performance never guarantees future results.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
