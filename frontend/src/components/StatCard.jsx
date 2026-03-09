import React from "react";

export default function StatCard({ title, value }) {
  return (
    <div className="stat-item">
      <p className="stat-title">{title}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  );
}