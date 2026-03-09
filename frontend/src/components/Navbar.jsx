import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import TopBar from "../components/TopBar";


export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="nav-right">
        <span className="logo">LendConnect</span>
        <nav className="nav-links">
        <a href="/Landing">HOME</a>
        < a href="/marketplace">Marketplace</a>
          <a href="/dashboard">Dashboard</a>
          </nav>
      </div>
      

      <div className="nav-right">
        <button 
          className="marketplace-btn"
          onClick={() => navigate("/marketplace")}
        >
          Marketplace
        </button>

        <button className="login-btn">Login</button>
      </div>
    </nav>
  );
}
