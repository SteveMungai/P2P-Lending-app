import React from "react";

export default function ProgressBar({ percent }) {
  return (
    <div className="progress-container">
      <div
        className="progress-fill"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}