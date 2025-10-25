import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, getFirestore } from "firebase/firestore";

// 🔹 Define the exact display order with user-friendly labels
const fieldOrder = [
  { key: "S.No", label: "Serial No" },
  { key: "Monitor S.N", label: "Monitor S.N" },
  { key: "Mother board S.NO", label: "Motherboard S.N" },
  { key: "Monitor Make& Size", label: "Monitor Make & Size" },
  { key: "Processor Make& speed", label: "Processor" },
  { key: "Ram Make &size", label: "RAM" },
  { key: "SSD Make& Size", label: "SSD Make & Size" },
  { key: "Mother Board Make", label: "Motherboard Make" },
  { key: "Mouse", label: "Mouse" },
  { key: "Keyboard", label: "Keyboard" },
  { key: "Cabinet", label: "Cabinet" },
  { key: "Remarks", label: "Remarks" },
];

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f9fafb 100%)",
    padding: "40px 0",
  },
  card: {
    margin: "auto",
    maxWidth: "500px",
    background: "#fff",
    borderRadius: "15px",
    boxShadow: "0 6px 32px rgba(74, 58, 255, 0.09)",
    padding: "32px 28px 36px",
    textAlign: "left",
  },
  header: {
    fontWeight: 800,
    fontSize: "2.1rem",
    color: "#4326b6",
    letterSpacing: "1px",
    textAlign: "center",
    marginBottom: "22px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #ececec",
    fontSize: "1rem",
  },
  label: {
    fontWeight: 600,
    color: "#333",
  },
  value: {
    color: "#1a2447",
    fontWeight: 400,
    maxWidth: "60%",
    wordBreak: "break-all",
    textAlign: "right",
  },
  loader: {
    textAlign: "center",
    marginTop: "80px",
    fontSize: "1.2rem",
    color: "#5546b3",
  },
  error: {
    textAlign: "center",
    marginTop: "80px",
    color: "#d32f2f",
    fontWeight: 600,
  },
};

const SystemPage = () => {
  const { id } = useParams();
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  // 🔹 Helper to get value with flexible key matching
  const getValue = (data, key) => {
    if (data[key]) return data[key];
    // Try variations (handles extra spaces or ampersand spacing)
    const altKey = Object.keys(data).find(
      (k) => k.replace(/\s|&/g, "").toLowerCase() === key.replace(/\s|&/g, "").toLowerCase()
    );
    return altKey ? data[altKey] : "N/A";
  };

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const docRef = doc(db, "allFiles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const data = docData.data ? { ...docData.data } : { ...docData };
          setSystem(data);
        } else {
          setSystem({ error: "System not found" });
        }
      } catch (err) {
        console.error("Error fetching system:", err);
        setSystem({ error: "Failed to fetch system details" });
      } finally {
        setLoading(false);
      }
    };
    fetchSystem();
  }, [id, db]);

  if (loading) return <div style={styles.loader}>Loading system details...</div>;
  if (system?.error) return <div style={styles.error}>{system.error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.header}>System Details</h1>
        {fieldOrder.map(({ key, label }) => (
          <div style={styles.row} key={key}>
            <span style={styles.label}>{label}:</span>
            <span style={styles.value}>{getValue(system, key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemPage;
