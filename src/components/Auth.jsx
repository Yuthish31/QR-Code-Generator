import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { app } from "./firebaseConfig"; // adjust path if needed

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // 👈 new field for name
  const [isLogin, setIsLogin] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // ------------------ LOGIN ------------------
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 🔍 Fetch username from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          alert("User data missing in Firestore. Please register again.");
          return;
        }

        const userData = userDoc.data();
        localStorage.setItem("username", userData.username || "Unknown User"); // 🧠 store for uploads
        localStorage.setItem("uid", user.uid);

        alert(`Welcome back, ${userData.username || "User"}!`);
        navigate("/");
      } else {
        // ---------------- REGISTER ----------------
        if (!username.trim()) {
          alert("Please enter a username.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 🧾 Save user details in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          username: username.trim(),
          email: user.email,
          approved: true, // auto-approved
          createdAt: new Date().toISOString(),
        });

        alert("Registration successful! You can now log in.");
        setIsLogin(true); // switch to login view automatically
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
            <br />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <br />
        <button type="submit" style={styles.button}>
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <p onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
        {isLogin
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </p>
    </div>
  );
};

// 🎨 Simple styling
const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    display: "inline-block",
    textAlign: "left",
    marginTop: "20px",
  },
  input: {
    width: "250px",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  toggle: {
    marginTop: "15px",
    color: "#007bff",
    cursor: "pointer",
  },
};

export default Auth;
