import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, getFirestore } from "firebase/firestore";

// Define label and order array (exclude Motherboard S.N and Monitor S.N)
const fieldOrder = [
  { key: "Mouse", label: "Mouse" },
  { key: "Keyboard", label: "Keyboard" },
  { key: "S.No", label: "Serial No" },
  { key: "SSD Make& Size", label: "SSD Make & Size" },
  { key: "Monitor Make& Size", label: "Monitor Make & Size" },
  { key: "Monitor S.N", exclude: true }, 
  { key: "New Asset ID", label: "Asset ID" },
  { key: "Processor Make& speed", label: "Processor" },
  { key: "Mother Board Make", label: "Motherboard" },
  { key: "Remarks", label: "Remarks" },
  { key: "Mother board S.NO", exclude: true }, 
  { key: "Cabinet", label: "Cabinet" },
  { key: "Ram Make &size", label: "RAM" },
];

const displayFields = fieldOrder.filter(f => !f.exclude);

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0e7ff 0%, #f9fafb 100%)",
    padding: "40px 0",
  },
  card: {
    margin: "auto",
    maxWidth: "480px",
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
    marginBottom: "18px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #ececec",
    fontSize: "1rem",
  },
  label: {
    fontWeight: 600,
    color: "#555",
  },
  value: {
    color: "#1a2447",
    fontWeight: 400,
    maxWidth: "60%",
    wordBreak: "break-all",
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

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const docRef = doc(db, "allFiles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          // Flatten if nested under .data
          const data = docData.data ? { ...docData.data } : { ...docData };
          setSystem(data);
        } else {
          setSystem({ error: "System not found" });
        }
      } catch {
        setSystem({ error: "Failed to fetch system details" });
      } finally {
        setLoading(false);
      }
    };
    fetchSystem();
  }, [id, db]);

  if (loading)
    return <div style={styles.loader}>Loading system details...</div>;
  if (system?.error)
    return <div style={styles.error}>{system.error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.header}>System Details</h1>
        {displayFields.map(({ key, label }) => (
          <div style={styles.row} key={key}>
            <span style={styles.label}>{label || key}:</span>
            <span style={styles.value}>{system[key] || "N/A"}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemPage;
