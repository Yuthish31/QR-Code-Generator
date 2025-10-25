import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import FileUploader from "./components/FileUploader";
import SystemPage from "./components/SystemPage";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ManageUploads from "./components/ManageFiles";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function AppRoutes({ excelData, setExcelData }) {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleDataLoaded = (data) => setExcelData(data);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          user ? <Dashboard /> : <Navigate to="/auth" />
        }
      />
      <Route
        path="/upload"
        element={
          user ? (
            <FileUploader onDataLoaded={handleDataLoaded} />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/manage"
        element={
          user ? (
            <ManageUploads />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route path="/system/:id" element={<SystemPage />} />
      <Route
        path="*"
        element={
          <p style={{
            textAlign: "center",
            marginTop: "50px",
            fontWeight: 700,
            color: "#d32f2f",
          }}>
            Page not found
          </p>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
