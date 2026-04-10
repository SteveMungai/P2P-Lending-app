import React from "react";

export default function ProgressBar({ percent }) {
  
  const safePercent = Math.min(Math.max(percent || 0, 0), 100);

  return (
    <div className="progress-container">
      <div
        className="progress-fill"
        style={{ width: `${safePercent}%` }}
      ></div>
    </div>
  );
}