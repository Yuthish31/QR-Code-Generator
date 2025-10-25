import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { app } from "./firebaseConfig"; // adjust path if needed

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // works for both login fetch & register
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
        localStorage.setItem("username", userData.name || "Unknown User");
        localStorage.setItem("uid", user.uid);

        alert(`Welcome back, ${userData.name || "User"}!`);
        navigate("/");
      } else {
        // ------------------ REGISTER ------------------
        if (!name.trim()) {
          alert("Please enter your full name.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save name to Firebase Auth profile
        await updateProfile(user, { displayName: name });

        // Save user in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name.trim(),
          email: user.email,
          approved: true,
          createdAt: new Date().toISOString(),
        });

        alert("Registration successful! You can now log in.");
        setIsLogin(true); // switch to login
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert(err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <br /><br />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>

      <p
        onClick={() => setIsLogin(!isLogin)}
        style={{ cursor: "pointer", marginTop: "10px" }}
      >
        {isLogin
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </p>
    </div>
  );
};

export default Auth;
