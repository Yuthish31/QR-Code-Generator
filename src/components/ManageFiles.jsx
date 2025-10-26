import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    maxWidth: 780,
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
    marginBottom: 22,
    fontSize: "1.8rem"
  },
  summary: {
    color: "#32209f",
    fontWeight: 700,
    fontSize: "1.05rem",
    marginBottom: 15,
    marginLeft: 10,
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
    padding: "10px 8px",
    textAlign: "center",
  },
  td: {
    border: "1px solid #e3e2f5",
    textAlign: "center",
    padding: "9px 7px"
  },
  selectAll: {
    cursor: "pointer",
    width: "18px",
    height: "18px"
  },
  checkbox: {
    cursor: "pointer",
    width: "16px",
    height: "16px"
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
  },
  bulkDeleteBtn: {
    background: "linear-gradient(90deg,#e55952 63%,#f49ab0 99%)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: 700,
    padding: "9px 22px",
    marginTop: "7px",
    marginBottom: "16px",
    cursor: "pointer",
    fontSize: "1.03rem",
    letterSpacing: ".5px",
    minWidth: "165px",
  }
};

const ManageFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

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
      setSelected([]);
      setSelectAll(false);
      setLoading(false);
    };
    fetchFiles();
  }, [user, db]);

  // Handle selecting/unselecting all
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelected(checked ? files.map(f => f.docId) : []);
  };

  // Handle selecting individual rows
  const handleSelect = (docId) => {
    if (selected.includes(docId)) {
      setSelected(selected.filter(id => id !== docId));
    } else {
      setSelected([...selected, docId]);
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.length} file(s)?`)) return;
    await Promise.all(selected.map(docId => deleteDoc(doc(db, "allFiles", docId))));
    setFiles(files.filter((f) => !selected.includes(f.docId)));
    setSelected([]);
    setSelectAll(false);
  };

  // Single delete
  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    await deleteDoc(doc(db, "allFiles", docId));
    setFiles(files.filter((f) => f.docId !== docId));
    setSelected(selected.filter(id => id !== docId));
  };

  const handleEdit = (docId) => {
    navigate(`/system/${docId}`);
    // Optionally, add a real editing page or popup for details modification
  };

  // Table with S.No (serial number) and checkboxes
  return (
    <div style={styles.container}>
      <div style={styles.title}>Your Uploaded Files</div>
      <div style={styles.summary}>Total records: {files.length}</div>
      {selected.length > 0 && (
        <button style={styles.bulkDeleteBtn} onClick={handleBulkDelete}>
          Delete Selected ({selected.length})
        </button>
      )}
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
              <th style={styles.th}>
                <input
                  type="checkbox"
                  style={styles.selectAll}
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={styles.th}>S.No</th>
              <th style={styles.th}>Asset ID</th>
              <th style={styles.th}>File Name</th>
              <th style={styles.th}>Uploaded At</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((row, idx) => (
              <tr key={row.docId}>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={selected.includes(row.docId)}
                    onChange={() => handleSelect(row.docId)}
                  />
                </td>
                <td style={styles.td}>{idx + 1}</td>
                <td style={styles.td}>{row.data?.["New Asset ID"] || "N/A"}</td>
                <td style={styles.td}>{row.fileName || "N/A"}</td>
                <td style={styles.td}>
                  {row.uploadedAt
                    ? new Date(
                        row.uploadedAt.seconds
                          ? row.uploadedAt.seconds * 1000
                          : row.uploadedAt
                      ).toLocaleString()
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
