import React from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    padding: "32px 24px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px #6b6cf422",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontWeight: 900,
    letterSpacing: ".5px",
    color: "#2e2374",
    marginBottom: 30,
    fontSize: "2.1rem",
    textAlign: "center",
  },
  button: {
    width: "85%",
    padding: "16px",
    margin: "16px 0",
    background: "linear-gradient(90deg, #5f67ea 70%, #a4b0ff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "1.13rem",
    cursor: "pointer",
    letterSpacing: ".5px",
    boxShadow: "0 2px 8px #aeaefe14",
    transition: "background .13s"
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <div style={styles.title}>Welcome Dashboard</div>
      <button style={styles.button} onClick={() => navigate("/upload")}>
        Upload Excel File
      </button>
      <button style={styles.button} onClick={() => navigate("/manage")}>
        Manage Uploaded Files
      </button>
    </div>
  );
};

export default Dashboard;
