import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const styles = {
  container: { margin: "20px", textAlign: "center" },
  tableContainer: { marginTop: "20px", overflowX: "auto" },
  table: { borderCollapse: "collapse", width: "90%", margin: "auto" },
  th: { border: "1px solid #ddd", padding: "8px", backgroundColor: "#f0f0f0" },
  td: { border: "1px solid #ddd", padding: "8px" },
};

function FileUploader({ onDataLoaded }) {
  const [fileName, setFileName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user) {
      alert("You must be logged in to upload files.");
      return;
    }

    const username = localStorage.getItem("username") || user.displayName || user.email;
    const userUid = localStorage.getItem("uid") || user.uid;

    setFileName(file.name);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      jsonData = jsonData.filter((row) =>
        Object.values(row).some((val) => val && val.toString().trim() !== "")
      );
      setPreviewData(jsonData.slice(0, 5));
      const savedData = [];

      try {
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const docRef = await addDoc(
            collection(db, "users", userUid, "files"),
            {
              fileName: file.name,
              uploadedBy: username,
              userId: userUid,
              order: i + 1,
              data: { ...row, "S.No": i + 1 },
              uploadedAt: new Date(),
            }
          );
          savedData.push({ ...row, docId: docRef.id, "S.No": i + 1 });
        }

        setAllData(savedData);
        onDataLoaded && onDataLoaded(savedData, user);
        alert(`File uploaded and all rows saved successfully by ${username}!`);
      } catch (error) {
        console.error("Error saving to Firestore:", error);
        alert("Failed to save data. Check console for details.");
      }
      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadQRCode = (id) => {
    const canvas = document.getElementById(`qr-${id}`);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${allData[id].docId}.png`;
    downloadLink.click();
  };

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
      {fileName && <p>Uploaded: <b>{fileName}</b></p>}
      {uploading && <p style={{ color: "blue" }}>Uploading and saving data...</p>}

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

      {allData.length > 0 && (
        <>
          <h3>Generated QR Codes</h3>
          <button onClick={downloadAllQRCodes} style={{ marginBottom: "10px" }}>
            Download All QR Codes (ZIP)
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
            {allData.map((row, index) => {
              const qrValue = `${window.location.origin}/system/${user.uid}/${row.docId}`;
              return (
                <div
                  key={index}
                  style={{
                    textAlign: "center",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "8px",
                    width: "160px",
                  }}
                >
                  <QRCodeCanvas id={`qr-${index}`} value={qrValue} size={120} />
                  <p style={{ marginTop: "8px", fontWeight: "bold" }}>{row.System || `System ${index + 1}`}</p>
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

export default FileUploader;
