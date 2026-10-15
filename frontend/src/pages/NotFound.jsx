import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import "../styles/notfound.css";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="notfound">
        <h1>404</h1>
        <p>We couldn’t find that page.</p>
        <Link to="/marketplace" className="notfound-link">
          Browse the marketplace
        </Link>
      </main>
      <Footer />
    </>
  );
}
