import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FileUploader from "./components/FileUploader";
import SystemPage from "./components/SystemPage";
import Auth from "./components/Auth";
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

  const handleDataLoaded = (data) => {
    setExcelData(data);
  };

  return (
    <Routes>
      {/* Home Page — All logged-in users can upload Excel & generate QR */}
      <Route
        path="/"
        element={
          user ? (
            <>
              <FileUploader onDataLoaded={handleDataLoaded} />
              {excelData.length > 0 && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <h3>✅ Excel File Loaded Successfully!</h3>
                  <p>Total Rows: {excelData.length}</p>
                </div>
              )}
            </>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />

      {/* Authentication Page */}
      <Route path="/auth" element={<Auth />} />

      {/* System Detail Page — Dynamic Firestore document */}
      <Route path="/system/:id" element={<SystemPage />} />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <p style={{ textAlign: "center", marginTop: "50px" }}>
            Page not found
          </p>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
