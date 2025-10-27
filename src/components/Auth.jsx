import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { app } from "./firebaseConfig";

const styles = {
  container: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(133deg, #bec8ff 0%, #e8ecfa 100%)" },
  card: { background: "#fff", borderRadius: "18px", boxShadow: "0 6px 26px rgba(82, 82, 255, 0.09)", padding: "38px 35px 26px", width: "370px", textAlign: "center", border: "2px solid #ece6ff" },
  input: { width: "93%", padding: "10px 12px", borderRadius: "7px", border: "1.5px solid #d3dafe", margin: "12px 0", fontSize: "1rem", outline: "none", background: "#f6f6fd" },
  button: { width: "100%", background: "linear-gradient(90deg, #4326b6 65%, #a4b0ff 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, padding: "10px 0", fontSize: "1.07rem", marginTop: "12px", letterSpacing: "0.5px", cursor: "pointer", boxShadow: "0 2px 10px #bdb5ff18" },
  toggle: { color: "#32209f", marginTop: "15px", fontWeight: 500, cursor: "pointer", textDecoration: "underline", fontSize: "0.97rem" },
};

const Auth = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (forgotMode) {
      // forgot password
      if (!email.trim()) {
        alert("Please enter your email");
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Reset email sent. Check your inbox.");
        setForgotMode(false);
        setEmail("");
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    if (isLogin) {
      // login
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await user.reload();
        if (!user.emailVerified) {
          alert("Please verify your email first via the link sent to your inbox.");
          return;
        }
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          alert("User data missing from server; please register again.");
          return;
        }
        const userData = userDoc.data();
        localStorage.setItem("username", userData.name || "User");
        localStorage.setItem("uid", user.uid);
        alert(`Welcome back, ${userData.name || "User"}!`);
        navigate("/dashboard");
      } catch (err) {
        alert(err.message);
      }
    } else {
      // register
      if (!name.trim()) {
        alert("Please enter your full name.");
        return;
      }
      if (!email.trim() || !password) {
        alert("Please enter email and password.");
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
        alert("Registration successful! Please verify your email before logging in.");
        setIsLogin(true);
      } catch (err) {
        alert(err.message);
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

        <div
          onClick={() => setForgotMode(!forgotMode)}
          style={styles.toggle}
        >
          {forgotMode ? "Back to Login" : "Forgot Password?"}
        </div>

        {!forgotMode && (
          <div
            onClick={() => setIsLogin(!isLogin)}
            style={styles.toggle}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
