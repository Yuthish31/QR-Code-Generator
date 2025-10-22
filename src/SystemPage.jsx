import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const SystemPage = () => {
  const { id } = useParams(); // PC01, PC02...
  const [system, setSystem] = useState(null);

  useEffect(() => {
    const fetchSystem = async () => {
      const docRef = doc(db, "systems", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSystem(docSnap.data());
      } else {
        setSystem({ error: "System not found" });
      }
    };
    fetchSystem();
  }, [id]);

  if (!system) return <div>Loading...</div>;
  if (system.error) return <div>{system.error}</div>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>System: {id}</h1>
      <p><b>Motherboard S.N:</b> {system.MotherboardSN || "N/A"}</p>
      <p><b>Monitor S.N:</b> {system.MonitorSN || "N/A"}</p>
      {Object.entries(system).map(([key, value]) => {
        if (key === "MotherboardSN" || key === "MonitorSN") return null; // already displayed
        return (
          <p key={key}>
            <b>{key}:</b> {value}
          </p>
        );
      })}
    </div>
  );
};

export default SystemPage;
