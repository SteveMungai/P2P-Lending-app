import { Navigate } from "react-router-dom";

// Only lets logged-in users through; everyone else is sent to the login page.
export default function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/auth" replace />;
}
