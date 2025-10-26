import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  },
  editModal: {
    position: "fixed",
    left: 0, top: 0, right: 0, bottom: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "auto"
  },
  editCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 32,
    boxShadow: "0 8px 32px #393cc399",
    maxWidth: 400,
    width: "95vw",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  editRow: {
    marginBottom: 14,
    display: "flex",
    flexDirection: "column"
  },
  editLabel: {
    fontWeight: 600, fontSize: "1rem", color: "#4726b6", marginBottom: 4
  },
  editInput: {
    padding: 9, borderRadius: 5, border: "1px solid #92a0d1", fontSize: "1.07rem"
  },
  editActions: { marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" },
  editSave: {
    background: "linear-gradient(90deg,#229bde 63%,#9adbff 99%)",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontWeight: 700,
    padding: "9px 26px",
    fontSize: "1.05rem",
    cursor: "pointer"
  },
  editCancel: {
    background: "#eee",
    color: "#232452",
    border: "none",
    borderRadius: "7px",
    fontWeight: 700,
    padding: "9px 24px",
    fontSize: "1.05rem",
    cursor: "pointer"
  }
};

const ManageFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [saving, setSaving] = useState(false);

  const user = getAuth().currentUser;
  const db = getFirestore();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, "users", user.uid, "files"),
      orderBy("order", "asc")
    );
    getDocs(q).then(querySnapshot => {
      let rows = [];
      querySnapshot.forEach((doc) => {
        rows.push({ ...doc.data(), docId: doc.id });
      });
      setFiles(rows);
      setSelected([]);
      setSelectAll(false);
      setLoading(false);
    });
  }, [user, db, saving]);

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelected(checked ? files.map(f => f.docId) : []);
  };

  const handleSelect = (docId) => {
    if (selected.includes(docId)) {
      setSelected(selected.filter(id => id !== docId));
    } else {
      setSelected([...selected, docId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.length} file(s)?`)) return;
    await Promise.all(selected.map(docId =>
      deleteDoc(doc(db, "users", user.uid, "files", docId))
    ));
    setFiles(files.filter((f) => !selected.includes(f.docId)));
    setSelected([]);
    setSelectAll(false);
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    await deleteDoc(doc(db, "users", user.uid, "files", docId));
    setFiles(files.filter((f) => f.docId !== docId));
    setSelected(selected.filter(id => id !== docId));
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditRow({ ...(files[idx].data || {}) });
  };

  const closeEdit = () => {
    setEditIdx(null);
    setEditRow({});
  };

  const saveEdit = async () => {
    if (editIdx == null) return;
    setSaving(true);
    const docId = files[editIdx].docId;
    await updateDoc(doc(db, "users", user.uid, "files", docId), {
      data: editRow
    });
    closeEdit();
    setSaving(false);
  };

  // Click outside modal to close
  useEffect(() => {
    if (!editIdx) return;
    const handleClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeEdit();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editIdx]);

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
              <th style={styles.th}>System No.</th>
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
                {/* Original System No value */}
                <td style={styles.td}>{row.data?.["S.No"] || idx + 1}</td>
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
                    onClick={() => handleEdit(idx)}
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

      {/* Edit Modal */}
      {editIdx != null && (
        <div style={styles.editModal}>
          <div style={styles.editCard} ref={modalRef}>
            <h3>Edit Data</h3>
            {Object.keys(editRow).map((k) => (
              <div key={k} style={styles.editRow}>
                <label style={styles.editLabel}>{k}:</label>
                <input
                  style={styles.editInput}
                  value={editRow[k]}
                  onChange={e =>
                    setEditRow({ ...editRow, [k]: e.target.value })
                  }
                />
              </div>
            ))}
            <div style={styles.editActions}>
              <button style={styles.editCancel} onClick={closeEdit}>Cancel</button>
              <button style={styles.editSave} onClick={saveEdit} disabled={saving}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFiles;
