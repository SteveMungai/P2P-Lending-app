import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import "../styles/navbar.css";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate(); // 

  const handleAuthClick = () => {
    if (!isLoggedIn) {
      navigate("/login"); 
    } else {
      setIsLoggedIn(false);
      alert("Signed out successfully");
    }

    setShowDropdown(false); 
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="logo">LendConnect</span>
        

        <nav className="nav-links">
          <a href="/Landing">HOME</a>
          <a href="/marketplace">MARKET PLACE</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </div>

      <div className="topbar-right">
        <input
          type="text"
          placeholder="Search loans"
          className="search-input"
        />

        <div
          className="user-menu"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <FaUserCircle className="user-icon" />

          {showDropdown && (
            <div className="dropdown">
              <p onClick={handleAuthClick}>
                {isLoggedIn ? "Sign Out" : "Login"}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
