import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";

function App() {
  const [excelData, setExcelData] = useState([]);
  return (
    <Router>
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        <h1 style={{
          textAlign: "center",
          marginTop: "20px",
          color: "#32209f",
          fontWeight: 900,
        }}>
          QR System for Display Details
        </h1>
        <AppRoutes excelData={excelData} setExcelData={setExcelData} />
      </div>
    </Router>
  );
}
export default App;
