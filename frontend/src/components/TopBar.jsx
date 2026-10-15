import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clearSession, getStoredUser, getToken } from "../utils/api";
import "../styles/navbar.css";

/**
 * Props
 *  - onSearch(query)  optional. The Marketplace passes it so the search runs
 *                     in place. On every other page the search sends you to
 *                     /marketplace?q=...
 *
 */
export default function TopBar({ onSearch }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const token = getToken();
  const user = getStoredUser();
  const isLoggedIn = !!token;

  // keep the box in sync when the URL changes (e.g. "clear search")
  useEffect(() => {
    setSearch(params.get("q") || "");
  }, [params]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearSession();
    setShowDropdown(false);
    navigate("/auth");
  };

  const handleSearch = () => {
    const q = search.trim();
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="logo">LendConnect</span>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </div>

      <div className="topbar-right">
        <input
          type="text"
          placeholder="Search loans"
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>

        {isLoggedIn && user ? (
          <div className="user-menu" ref={dropdownRef}>
            <button
              className="user-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-avatar">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.full_name}</span>
              <span className="chevron">{showDropdown ? "▲" : "▼"}</span>
            </button>

            {showDropdown && (
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
    </header>
  );
}
