import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Registration successful, wait for admin to grant rights");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <br /><br />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <br /><br />
        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer", marginTop: "10px" }}>
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
};

export default Auth;