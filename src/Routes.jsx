import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FileUploader from "./components/FileUploader";
import SystemPage from "./SystemPage";
import Auth from "./Auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const AppRoutes = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const auth = getAuth();

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(!!tokenResult.claims.admin);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <Routes>
      {/* Home / FileUploader (Admin only) */}
      <Route
        path="/"
        element={
          user ? (
            isAdmin ? (
              <FileUploader />
            ) : (
              <p style={{ textAlign: "center", marginTop: "50px" }}>
                You must be an admin to upload Excel files and generate QR codes.
              </p>
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />

      {/* Authentication */}
      <Route path="/auth" element={<Auth />} />

      {/* Dynamic System Page */}
      <Route path="/system/:id" element={<SystemPage />} />

      {/* Fallback route */}
      <Route
        path="*"
        element={<p style={{ textAlign: "center", marginTop: "50px" }}>Page not found</p>}
      />
    </Routes>
  );
};

export default AppRoutes;
