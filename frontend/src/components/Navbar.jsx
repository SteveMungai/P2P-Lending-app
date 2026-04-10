import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!token;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setDropdownOpen(false);
    navigate("/auth");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo">LendConnect</span>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/marketplace">Marketplace</Link>
          {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
        </div>
      </div>

      <div className="nav-right">

        {isLoggedIn && user ? (
          <div className="user-menu" ref={dropdownRef}>

            {/* Avatar /name button */}
            <button
              className="user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.full_name}</span>
              <span className="chevron">{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user.full_name}</p>
                  <p className="dropdown-email">{user.email}</p>
                </div>
                <hr />
                <button className="dropdown-signout" onClick={handleSignOut}>
                  <span className="signout-icon">⏻</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>

        ) : (
          <button className="login-btn" onClick={() => navigate("/auth")}>
            Login
          </button>
        )}

      </div>
    </nav>
  );
}