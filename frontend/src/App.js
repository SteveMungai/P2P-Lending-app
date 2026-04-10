import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import LoanDetails from "./pages/LoanDetails";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/auth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/loans/:id" element={<LoanDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}

export default App;