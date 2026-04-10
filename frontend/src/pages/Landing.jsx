import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Navbar from "../components/Navbar";
import "../styles/landing.css";


export default function Landing() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const API = "http://127.0.0.1:5000"; 

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Get User Data
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((user) => {
          // Get User Loans using User ID
          return fetch(`${API}/loans/user/${user.id}`);
        })
        .then((res) => res.json())
        .then((data) => {
          setLoans(data);
          console.log("Loans loaded:", data);
        })
        .catch((err) => {
          console.error("Session expired or fetch failed", err);
          
        });
    }
  }, []); 

  return (
    <>
      <Navbar />

      <main className="landing-container">
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <h1>Borrow and Invest Smarter with LendConnect</h1>
            <p>
              A secure and transparent peer-to-peer lending platform connecting
              borrowers and lenders directly.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate("/auth")}>
                Get Started
              </button>
              <button 
                className="btn-outline" 
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </button> 
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="features">
          <h2>Why Choose LendConnect?</h2>
          <div className="feature-cards">
            <div className="card">
              <h3>Secure Platform</h3>
              <p>Bank-level security and encryption to protect your data.</p>
            </div>
            <div className="card">
              <h3>Higher Returns</h3>
              <p>Earn competitive returns compared to traditional savings.</p>
            </div>
            <div className="card">
              <h3>Fast & Flexible</h3>
              <p>Quick access to loans without lengthy bank processes.</p>
            </div>
            <div className="card">
              <h3>Diverse Loans</h3>
              <p>Choose from personal, business, and education loans.</p>
            </div>
          </div>
        </section>

      

        {/* HOW IT WORKS */}
        <section id="about" className="how-it-works">
          <h2>How Peer-to-Peer Lending Works</h2>
          <div className="steps">
            <div className="step">
              <span>1</span>
              <p>Create an account</p>
            </div>
            <div className="step">
              <span>2</span>
              <p>Borrow or fund loans</p>
            </div>
            <div className="step">
              <span>3</span>
              <p>Track repayments securely</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <h2>Ready to start borrowing or investing?</h2>
          <button className="btn-primary" onClick={() => navigate("/auth")}>
            Create an Account
          </button>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p>© 2026 LendConnect. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}