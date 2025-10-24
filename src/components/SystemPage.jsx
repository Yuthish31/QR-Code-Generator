import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const SystemPage = () => {
  const { id } = useParams(); // docId from QR
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const docRef = doc(db, "allFiles", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSystem(data.data || {}); // actual system data
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

  if (loading) return <p style={styles.container}>Loading system details...</p>;
  if (system?.error) return <p style={styles.container}>{system.error}</p>;

  return (
    <div style={styles.container}>
      <h1>System Details</h1>

      {/* Highlighted fields */}
      <div style={styles.highlight}>
        <p><b>Motherboard S.N:</b> {system.MotherboardSN || "N/A"}</p>
        <p><b>Monitor S.N:</b> {system.MonitorSN || "N/A"}</p>
      </div>

      {/* Other system details */}
      <div style={styles.details}>
        {Object.entries(system).map(([key, value]) => {
          if (key === "MotherboardSN" || key === "MonitorSN") return null;
          return (
            <p key={key}>
              <b>{key}:</b> {value || "N/A"}
            </p>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: { textAlign: "center", marginTop: "50px", padding: "20px", fontFamily: "Arial, sans-serif" },
  highlight: {
    backgroundColor: "#f9f9f9",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
  },
  details: {
    textAlign: "left",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0px 2px 5px rgba(0,0,0,0.05)",
  },
};

export default SystemPage;
