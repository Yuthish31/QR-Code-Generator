import React, { useState } from "react";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { app } from "./firebaseConfig";

const styles = {
  container: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(133deg, #bec8ff 0%, #e8ecfa 100%)" },
  card: { background: "#fff", borderRadius: "18px", boxShadow: "0 6px 26px rgba(82, 82, 255, 0.09)", padding: "38px 35px 26px", width: "370px", textAlign: "center", border: "2px solid #ece6ff" },
  input: { width: "93%", padding: "10px 12px", borderRadius: "7px", border: "1.5px solid #d3dafe", margin: "12px 0", fontSize: "1rem", outline: "none", background: "#f6f6fd" },
  button: { width: "100%", background: "linear-gradient(90deg, #4326b6 65%, #a4b0ff 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, padding: "10px 0", fontSize: "1.07rem", marginTop: "12px", cursor: "pointer" },
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const auth = getAuth(app);
  const location = useLocation();

  const oobCode = new URLSearchParams(location.search).get("oobCode");

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      alert("Please enter both password fields");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      alert("Password reset successful! You can now log in with your new password.");
      navigate("/auth");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: "#32209f", fontWeight: 900, marginBottom: "18px" }}>Reset Password</h2>
        <form onSubmit={handleReset}>
          <input
            type="password"
            style={styles.input}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            style={styles.input}
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button style={styles.button} type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
