import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    maxWidth: 760,
    margin: "38px auto",
    padding: "28px 20px",
    background: "#fff",
    borderRadius: "13px",
    boxShadow: "0 4px 23px #6b6cf419",
  },
  title: {
    textAlign: "center",
    color: "#4326b6",
    fontWeight: 900,
    marginBottom: 20,
    fontSize: "1.8rem"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#f7faff",
    fontSize: "0.99rem",
    marginBottom: 20,
  },
  th: {
    background: "#e7e8f9",
    fontWeight: 700,
    color: "#282870",
    border: "1px solid #bbb7ed",
    padding: "10px 8px"
  },
  td: {
    border: "1px solid #e3e2f5",
    textAlign: "center",
    padding: "9px 7px"
  },
  actionBtn: {
    background: "linear-gradient(90deg,#e55952 63%,#f49ab0 99%)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 700,
    padding: "6px 17px",
    margin: "0 3px",
    cursor: "pointer"
  },
  editBtn: {
    background: "linear-gradient(90deg,#229bde 63%,#9adbff 99%)",
  }
};

const ManageFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getAuth().currentUser;
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user) return;
      setLoading(true);
      const q = query(collection(db, "allFiles"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      let rows = [];
      querySnapshot.forEach((doc) => {
        rows.push({ ...doc.data(), docId: doc.id });
      });
      setFiles(rows);
      setLoading(false);
    };
    fetchFiles();
  }, [user, db]);

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    await deleteDoc(doc(db, "allFiles", docId));
    setFiles(files.filter((f) => f.docId !== docId));
  };

  const handleEdit = (docId) => {
    navigate(`/system/${docId}`);
    // Optionally, add a real editing page or popup for details modification
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Your Uploaded Files</div>
      {loading ? (
        <div style={{ textAlign: "center", color: "#32209f" }}>Loading...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: "center", color: "#a62951" }}>
          No files uploaded yet.
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Asset ID</th>
              <th style={styles.th}>File Name</th>
              <th style={styles.th}>Uploaded At</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((row) => (
              <tr key={row.docId}>
                <td style={styles.td}>{row.data?.["New Asset ID"] || "N/A"}</td>
                <td style={styles.td}>{row.fileName || "N/A"}</td>
                <td style={styles.td}>
                  {row.uploadedAt
                    ? new Date(row.uploadedAt.seconds
                      ? row.uploadedAt.seconds * 1000
                      : row.uploadedAt).toLocaleString()
                    : "N/A"}
                </td>
                <td style={styles.td}>
                  <button
                    style={{ ...styles.actionBtn, ...styles.editBtn }}
                    onClick={() => handleEdit(row.docId)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.actionBtn}
                    onClick={() => handleDelete(row.docId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageFiles;
