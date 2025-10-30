import React, { useState, useEffect } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
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
  toggle: {
    color: "#32209f",
    marginTop: "15px",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.97rem",
  },
};

const Auth = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // ✅ Detect verification link
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get("mode");
    const oobCode = queryParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      handleEmailVerification(oobCode);
    }
  }, [location]);

  // ✅ Handle verification link
  const handleEmailVerification = async (oobCode) => {
    try {
      await applyActionCode(auth, oobCode);
      Swal.fire({
        icon: "success",
        title: "Email Verified!",
        text: "Your email has been successfully verified. You can now log in normally.",
        confirmButtonText: "OK",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.message,
      });
    }
  };

  // ✅ Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (forgotMode) {
      if (!email.trim()) {
        Swal.fire("Missing Info", "Please enter your email", "warning");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        Swal.fire("Email Sent", "Password reset email sent. Check your inbox.", "success");
        setForgotMode(false);
        setEmail("");
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
      return;
    }

    if (isLogin) {
      // LOGIN
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await user.reload();

        // ✅ Re-check emailVerified
        if (!user.emailVerified) {
          Swal.fire({
            icon: "warning",
            title: "Email Not Verified",
            text: "Please verify your email before logging in.",
            footer: '<b>Check your inbox or spam folder for the verification link.</b>',
          });
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          Swal.fire("User Data Missing", "Please register again.", "error");
          return;
        }

        const userData = userDoc.data();
        localStorage.setItem("username", userData.name || "User");
        localStorage.setItem("uid", user.uid);

        Swal.fire({
          icon: "success",
          title: `Welcome back, ${userData.name || "User"}!`,
          showConfirmButton: false,
          timer: 1500,
        });

        navigate("/dashboard");
      } catch (err) {
        Swal.fire("Login Failed", err.message, "error");
      }
    } else {
      // REGISTER
      if (!name.trim()) {
        Swal.fire("Missing Info", "Please enter your full name.", "warning");
        return;
      }
      if (!email.trim() || !password) {
        Swal.fire("Missing Info", "Please enter email and password.", "warning");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name.trim(),
          email: user.email,
          createdAt: new Date().toISOString(),
        });

        await sendEmailVerification(user);

        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Please verify your email before logging in.",
        });

        setIsLogin(true);
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: "#32209f", fontWeight: 900, marginBottom: "18px" }}>
          {forgotMode ? "Forgot Password" : isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && !forgotMode && (
            <input
              style={styles.input}
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!forgotMode && (
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!forgotMode}
            />
          )}

          <button style={styles.button} type="submit">
            {forgotMode ? "Send Reset Email" : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div onClick={() => navigate("/forgot")} style={styles.toggle}>
          Forgot Password?
        </div>

        {!forgotMode && (
          <div onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
