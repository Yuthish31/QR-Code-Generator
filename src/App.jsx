import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";

function App() {
  return (
    <Router>
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>QR System Project</h1>
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
