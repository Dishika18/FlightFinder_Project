import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing"
import Home from "./pages/Home"
import AdminDashboard from "./pages/AdminDashboard"
import BookFlight from "./pages/BookFlight"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/book/:flightId" element={<BookFlight />} />
          {/* Catch all route - redirect to landing */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
