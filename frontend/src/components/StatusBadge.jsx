import React from "react";

export default function StatusBadge({ status }) {
  // fallback to avoid crashes
  const safeStatus = status ? status.toLowerCase() : "unknown";

  return (
    <span className={`status-badge ${safeStatus}`}>
      {status || "Unknown"}
    </span>
  );
}