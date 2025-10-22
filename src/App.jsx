import React, { useState } from "react";
import FileUploader from "./components/FileUploader";

function App() {
  const [excelData, setExcelData] = useState([]);

  const handleDataLoaded = (data) => {
    setExcelData(data);
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>QR System Project</h1>
      <FileUploader onDataLoaded={handleDataLoaded} />

      {excelData.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>✅ Excel File Loaded Successfully!</h3>
          <p>Total Rows: {excelData.length}</p>
        </div>
      )}
    </div>
  );
}

export default App;
