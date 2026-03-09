import Navbar from "../components/Navbar";
import "../styles/landing.css";


export default function Landing() {
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
              <button className="btn-primary">Get Started</button>
              <button className="btn-outline">Learn More</button>
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
        <section className="how-it-works">
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
          <button className="btn-primary">Create an Account</button>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p>© 2026 LendConnect. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
