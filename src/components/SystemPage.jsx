import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const SystemPage = () => {
  const { id } = useParams(); // document ID from QR
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  // Define fixed display order
  const displayOrder = [
    "System",
    "MotherboardSN",
    "MonitorSN",
    "Processor",
    "RAM",
    "Storage",
    "GPU",
    "OS",
    "Location",
    "User",
    "UploadedBy",
    "UploadedAt",
  ];

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const docRef = doc(db, "allFiles", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();

          // Handle nested "data" structure if present
          const flatData = docData.data
            ? { ...docData.data, UploadedBy: docData.uploadedBy || "N/A", UploadedAt: docData.uploadedAt || "N/A" }
            : { ...docData };

          setSystem(flatData);
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

      <div style={styles.details}>
        {displayOrder.map((key) => (
          <p key={key}>
            <b>{key}:</b> {system[key] || "N/A"}
          </p>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
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
