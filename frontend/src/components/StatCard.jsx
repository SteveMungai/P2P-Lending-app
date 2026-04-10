import React from "react";

export default function StatCard({ title, value, isMoney }) {
  const formattedValue =
    value !== undefined && value !== null
      ? isMoney
        ? `KES ${Number(value).toLocaleString()}`
        : value
      : "--";

  return (
    <div className="stat-item">
      <p className="stat-title">{title || "N/A"}</p>
      <h3 className="stat-value">{formattedValue}</h3>
    </div>
  );
}