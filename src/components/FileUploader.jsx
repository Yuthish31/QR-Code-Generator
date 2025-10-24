import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

function FileUploader({ onDataLoaded }) {
  const [fileName, setFileName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle Excel file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user) {
      alert("You must be logged in to upload files.");
      return;
    }

    const username = localStorage.getItem("username") || "Unknown User";
    const userUid = localStorage.getItem("uid") || user.uid;

    setFileName(file.name);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      // Filter out empty rows
      jsonData = jsonData.filter((row) =>
        Object.values(row).some((val) => val && val.toString().trim() !== "")
      );

      setPreviewData(jsonData.slice(0, 5));
      const savedData = [];

      try {
        // Save each row under uploads/{userUid}/files/
        for (const row of jsonData) {
          const docRef = await addDoc(collection(db, "uploads", userUid, "files"), {
            fileName: file.name,
            uploadedBy: userUid,
            uploadedByName: username,
            data: row,
            uploadedAt: new Date(),
          });

          savedData.push({ ...row, docId: docRef.id });
        }

        setAllData(savedData);
        onDataLoaded && onDataLoaded(savedData, user);

        alert(`✅ ${file.name} uploaded successfully by ${username}`);
      } catch (error) {
        console.error("Error saving to Firestore:", error);
        alert("❌ Failed to save data. Check console for details.");
      }

      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Download individual QR code
  const downloadQRCode = (index) => {
    const canvas = document.getElementById(`qr-${index}`);
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${allData[index].docId}.png`;
    downloadLink.click();
  };

  // Download all QR codes as ZIP
  const downloadAllQRCodes = async () => {
    const zip = new JSZip();
    allData.forEach((row, index) => {
      const canvas = document.getElementById(`qr-${index}`);
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const imgData = dataUrl.split(",")[1];
      zip.file(`QR-${row.docId}.png`, imgData, { base64: true });
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "All_QRCodes.zip");
  };

  if (!user) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Please log in to upload Excel files and generate QR codes.
      </p>
    );
  }

  return (
    <div style={styles.container}>
      <h2>📂 Upload Excel File</h2>
      <p>Logged in as: <b>{localStorage.getItem("username") || user.email}</b></p>

      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {fileName && <p>Uploaded File: <b>{fileName}</b></p>}
      {uploading && <p style={{ color: "blue" }}>Uploading and saving data...</p>}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div style={styles.tableContainer}>
          <h3>Preview (First 5 Rows)</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(previewData[0]).map((key) => (
                  <th key={key} style={styles.th}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((value, j) => (
                    <td key={j} style={styles.td}>{value}</td>
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

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {allData.map((row, index) => {
              const qrValue = `${window.location.origin}/system/${row.docId}`;
              return (
                <div
                  key={index}
                  style={{
                    textAlign: "center",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "8px",
                    width: "180px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                  }}
                >
                  <QRCodeCanvas id={`qr-${index}`} value={qrValue} size={120} />
                  <p style={{ marginTop: "8px", fontWeight: "bold" }}>{row.System || `System ${index + 1}`}</p>
                  <p><b>Motherboard:</b> {row.MotherboardSN || "N/A"}</p>
                  <p><b>Monitor:</b> {row.MonitorSN || "N/A"}</p>
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
  container: { margin: "20px", textAlign: "center" },
  tableContainer: { marginTop: "20px", overflowX: "auto" },
  table: { borderCollapse: "collapse", width: "90%", margin: "auto" },
  th: { border: "1px solid #ddd", padding: "8px", backgroundColor: "#f0f0f0" },
  td: { border: "1px solid #ddd", padding: "8px" },
};

export default FileUploader;
