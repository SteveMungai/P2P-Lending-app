import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

export default function TopBar({ setLoans }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const API = "http://127.0.0.1:5000";
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!token;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESLint fix — added user?.id to dependency array
  useEffect(() => {
    if (!token || !setLoans || !user) return;

    fetch(`${API}/api/loans/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLoans(data);
      })
      .catch(err => console.error(err));
  }, [token, setLoans, user?.id]); //  user?.id instead of full user object

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowDropdown(false);
    navigate("/auth");
  };

  const handleSearch = () => {
    if (!setLoans) return;
    fetch(`${API}/api/loans/search?q=${search}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLoans(data);
      })
      .catch(err => console.error(err));
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="logo">LendConnect</span>

        <nav className="nav-links">
          <a href="/">Home</a>
          <a href="/marketplace">Marketplace</a>
          <a href="/dashboard">Dashboard</a>
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