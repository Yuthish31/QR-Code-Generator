import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const SystemPage = () => {
  const { id } = useParams(); // e.g., PC01
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const docRef = doc(db, "machines", id); // 'machines' collection
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSystem(docSnap.data());
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
  }, [id]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading system details...</p>
      </div>
    );
  }

  if (system?.error) {
    return (
      <div style={styles.container}>
        <p>{system.error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>System: {id}</h1>

      {/* Highlighted fields */}
      <div style={styles.highlight}>
        <p><b>Motherboard S.N:</b> {system.MotherboardSN || "N/A"}</p>
        <p><b>Monitor S.N:</b> {system.MonitorSN || "N/A"}</p>
      </div>

      {/* Other system details dynamically */}
      <div style={styles.details}>
        {Object.entries(system).map(([key, value]) => {
          if (key === "MotherboardSN" || key === "MonitorSN") return null; // already shown
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
  container: {
    textAlign: "center",
    marginTop: "50px",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
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
