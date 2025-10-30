import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { app } from "./firebaseConfig";
import Swal from "sweetalert2";

const styles = {
  container: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(133deg, #bec8ff 0%, #e8ecfa 100%)",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    boxShadow: "0 6px 26px rgba(82, 82, 255, 0.09)",
    padding: "38px 35px 26px",
    width: "370px",
    textAlign: "center",
    border: "2px solid #ece6ff",
  },
  input: {
    width: "93%",
    padding: "10px 12px",
    borderRadius: "7px",
    border: "1.5px solid #d3dafe",
    margin: "12px 0",
    fontSize: "1rem",
    outline: "none",
    background: "#f6f6fd",
  },
  button: {
    width: "100%",
    background: "linear-gradient(90deg, #4326b6 65%, #a4b0ff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    padding: "10px 0",
    fontSize: "1.07rem",
    marginTop: "12px",
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 2px 10px #bdb5ff18",
  },
  link: {
    color: "#32209f",
    marginTop: "15px",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.97rem",
  },
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const auth = getAuth(app);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      Swal.fire("Missing Info", "Please enter your email address", "warning");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({
        icon: "success",
        title: "Email Sent!",
        text: "Password reset email has been sent. Please check your inbox or spam folder.",
      }).then(() => {
        navigate("/auth"); // redirect back to login page
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: "#32209f", fontWeight: 900, marginBottom: "18px" }}>
          Forgot Password
        </h2>

        <form onSubmit={handleResetPassword}>
          <input
            style={styles.input}
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button style={styles.button} type="submit">
            Send Reset Email
          </button>
        </form>

        <div style={styles.link} onClick={() => navigate("/auth")}>
          Back to Login
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
