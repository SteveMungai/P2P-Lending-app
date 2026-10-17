/**
 * Data behind the "Risk & Return Matrix" on the landing page.
 * The page shows an "Illustrative data" label while `ILLUSTRATIVE` is true -
 * set it to false only once the numbers are real.
 *

 */
export const ILLUSTRATIVE = true;

// Grades follow the interest-rate bands the platform really uses 
//   Low risk <= 10 %   ·   Medium risk 10-18 %   ·   High risk > 18 %
export const GRADES = [
  {
    id: "A",
    name: "Grade A",
    risk: "Low",
    band: "Up to 10% interest",
    gross: 9.0,
    loss: 1.5,
    worstYear: -1.0,
    term: "6–12 months",
    summary:
      "Lower interest, fewer surprises. Borrowers here ask for smaller amounts at lower rates, and late payments are the exception.",
    watchFor: "Returns are modest. Over a long time inflation can eat most of them.",
  },
  {
    id: "B",
    name: "Grade B",
    risk: "Medium",
    band: "10–18% interest",
    gross: 14.5,
    loss: 4.5,
    worstYear: -6.0,
    term: "6–24 months",
    summary:
      "The middle ground. Higher interest compensates for a noticeably higher chance that a borrower pays late or not at all.",
    watchFor: "A handful of defaults in a small portfolio can wipe out a year of interest.",
  },
  {
    id: "C",
    name: "Grade C",
    risk: "High",
    band: "Over 18% interest",
    gross: 21.0,
    loss: 12.0,
    worstYear: -14.0,
    term: "12–36 months",
    summary:
      "The highest advertised rates, because these borrowers are the most likely to struggle. A large share of the interest is lost to defaults.",
    watchFor: "Big headline rates, much smaller take-home. Never put money here that you can't afford to lose.",
  },
];

export const BENCHMARKS = [
  {
    id: "savings",
    name: "Savings account",
    short: "Savings",
    gross: 3.5,
    loss: 0,
    worstYear: 0,
    note: "Steady and easy to access, but usually the lowest return.",
  },
  {
    id: "index",
    name: "Index fund",
    short: "Index fund",
    gross: 9.0,
    loss: 0,
    worstYear: -22,
    note: "Long-run average. Can fall sharply in a bad year and needs patience.",
  },
];

export const net = (o) => Math.round((o.gross - o.loss) * 10) / 10;

// every bar on the chart, in display order
export const OPTIONS = [
  ...GRADES.map((g) => ({ ...g, kind: "grade", short: g.name })),
  ...BENCHMARKS.map((b) => ({ ...b, kind: "benchmark" })),
];

export const HORIZONS = [1, 3, 5];

// value of `amount` after `years`, compounding once a year at `ratePct`
export const growth = (amount, ratePct, years) =>
  amount * Math.pow(1 + ratePct / 100, years);
