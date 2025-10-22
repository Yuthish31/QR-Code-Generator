import React, { useState } from "react";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function FileUploader({ onDataLoaded }) {
  const [fileName, setFileName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      // Filter out empty rows
      jsonData = jsonData.filter((row) =>
        Object.values(row).some((val) => val && val.toString().trim() !== "")
      );

      // Optional: skip header text rows
      if (jsonData.length > 0 && Object.keys(jsonData[0]).length < 2) {
        jsonData = jsonData.slice(5);
      }

      setPreviewData(jsonData.slice(0, 5)); // preview first 5 rows
      setAllData(jsonData); // store all rows for QR codes
      onDataLoaded && onDataLoaded(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  // Download individual QR code
  const downloadQRCode = (id) => {
    const canvas = document.getElementById(`qr-${id}`);
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${allData[id].System || id + 1}.png`;
    downloadLink.click();
  };

  // Download all QR codes as ZIP
  const downloadAllQRCodes = async () => {
    const zip = new JSZip();
    allData.forEach((row, index) => {
      const canvas = document.getElementById(`qr-${index}`);
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const imgData = dataUrl.split(",")[1]; // base64
      zip.file(`QR-${row.System || index + 1}.png`, imgData, { base64: true });
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "All_QRCodes.zip");
  };

  return (
    <div style={styles.container}>
      <h2>📂 Upload Excel File</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {fileName && (
        <p>
          Uploaded: <b>{fileName}</b>
        </p>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div style={styles.tableContainer}>
          <h3>Preview (First 5 Rows)</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(previewData[0]).map((key) => (
                  <th key={key} style={styles.th}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((value, j) => (
                    <td key={j} style={styles.td}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Codes */}
      {allData.length > 0 && (
        <>
          <h3>Generated QR Codes</h3>
          <button onClick={downloadAllQRCodes} style={{ marginBottom: "10px" }}>
            Download All QR Codes (ZIP)
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {allData.map((row, index) => {
              const qrValue = `https://yourwebsite.com/system/${row.System}`;
              return (
                <div
                  key={index}
                  style={{
                    textAlign: "center",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "8px",
                    width: "150px",
                  }}
                >
                  <QRCodeCanvas id={`qr-${index}`} value={qrValue} size={120} />
                  <p style={{ marginTop: "8px" }}>
                    {row.System || `System ${index + 1}`}
                  </p>
                  <button onClick={() => downloadQRCode(index)}>Download QR</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    margin: "20px",
    textAlign: "center",
  },
  tableContainer: {
    marginTop: "20px",
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
    width: "90%",
    margin: "auto",
  },
  th: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "#f0f0f0",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
  },
};

export default FileUploader;
