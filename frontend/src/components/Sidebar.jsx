export default function Sidebar({ clearFilters }) {
  return (
    <div className="sidebar">
      <div className="investor-summary">
        <h4>INVESTOR SUMMARY</h4>
        <p>Portfolio Value</p>
        <span className="amount">$50000</span>

        <p>Available Funds</p>
        <span className="amount">$31000</span>
      </div>

      <div className="filters">
        <h2>FILTERS</h2>

        <h4>AMOUNT</h4>
        <p>Min: $50000 &nbsp;&nbsp; Max: $50000</p>

        <h4>RISK LEVEL</h4>
        <label><input type="radio" name="risk" /> HIGH</label>
        <label><input type="radio" name="risk" /> MEDIUM</label>
        <label><input type="radio" name="risk" /> LOW</label>

        <button className="apply-btn">APPLY FILTERS</button>
      </div>
    </div>
  );
}
