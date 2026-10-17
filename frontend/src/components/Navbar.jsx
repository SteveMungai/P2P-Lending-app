import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

// Smooth-scroll to a section on the same page
const goTo = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

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
    <header className="lp-nav">
      <nav className="lp-nav-inner" aria-label="Main">
        <Link to="/" className="lp-brand" aria-label="LendConnect home">
          <span className="lp-brand-mark" aria-hidden="true">L</span>
          LendConnect
        </Link>

        <div className="lp-nav-links">
          <a href="#how" onClick={goTo("how")} className="lp-hide-sm">How it works</a>
          <a href="#opportunities" onClick={goTo("opportunities")} className="lp-hide-sm">Opportunities</a>
          <a href="#risk" onClick={goTo("risk")} className="lp-hide-sm">Risk &amp; returns</a>
          <Link to="/marketplace">Marketplace</Link>
          {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
        </div>

        <div className="lp-nav-right">
          {isLoggedIn && user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">{user.full_name?.charAt(0).toUpperCase()}</div>
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
            <>
              <button className="lp-nav-login" onClick={() => navigate("/auth")}>Log in</button>
              <button className="lp-btn lp-btn--primary lp-btn--sm" onClick={() => navigate("/auth")}>
                Get started
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
