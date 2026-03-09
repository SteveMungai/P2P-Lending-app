import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import LoanDetails from "./pages/LoanDetails";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/LoanDetails" element={<LoanDetails />} />
        <Route path="/loan/:id" element={<LoanDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
