import React, { useEffect, useState, useRef } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import Swal from "sweetalert2";
import { app } from "./firebaseConfig"; // keep your path

// Firebase
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Sidebar pages
const SIDEBAR_PAGES = [
  { key: "users", label: "Users Data" },
  { key: "files", label: "Manage File Data" },
  { key: "add", label: "Add Users" },
];

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("users");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userFiles, setUserFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });

  // --- Edit modal state ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [editData, setEditData] = useState({}); // this stores whole file doc for editing
  const modalRef = useRef(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Fetch users (admin)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email !== "admin@sys.com") {
          setUsers([]);
          setLoadingUsers(false);
          return;
        }
        setLoadingUsers(true);
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
      } catch (err) {
        console.error("fetchUsers", err);
        Swal.fire("Error", "Failed to load users", "error");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // -------------------------
  // USER CRUD
  // -------------------------
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      Swal.fire("Missing Info", "Please fill all fields", "warning");
      return;
    }

    try {
      // temporarily sign out admin and create user, then sign back in
      const adminUser = auth.currentUser;
      await auth.signOut();

      const userCred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // send verification
      await sendEmailVerification(userCred.user);

      // save Firestore record
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: newUser.name,
        email: newUser.email,
        uid: userCred.user.uid,
        createdAt: new Date().toISOString(),
      });

      Swal.fire("User Created", `Verification email sent to ${newUser.email}`, "success");

      // re-login admin (assumes admin credentials exist)
      await signInWithEmailAndPassword(auth, "admin@sys.com", "Admin@2025");

      // reset form + refresh users list
      setNewUser({ name: "", email: "", password: "" });
      setActivePage("users");
      await refreshUsers();
    } catch (err) {
      console.error("handleCreateUser", err);
      Swal.fire("Error", err.message, "error");
      // try to restore admin session (best-effort)
      try {
        await signInWithEmailAndPassword(auth, "admin@sys.com", "Admin@2025");
      } catch (_) {}
    }
  };

  const refreshUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.error("refreshUsers", err);
    }
  };

  const handleEditUser = async (user) => {
    const { value: form } = await Swal.fire({
      title: "Edit User",
      html:
        `<input id="swal-name" class="swal2-input" placeholder="Name" value="${user.name || ""}">` +
        `<input id="swal-email" class="swal2-input" placeholder="Email" value="${user.email || ""}">`,
      focusConfirm: false,
      preConfirm: () => ({
        name: document.getElementById("swal-name").value,
        email: document.getElementById("swal-email").value,
      }),
    });

    if (!form) return;
    try {
      await updateDoc(doc(db, "users", user.id), {
        name: form.name,
        email: form.email,
      });
      Swal.fire("Updated", "User data updated", "success");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...form } : u)));
    } catch (err) {
      console.error("handleEditUser", err);
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: "This removes user record from Firestore (not Firebase Auth).",
      icon: "warning",
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      Swal.fire("Deleted", "User removed", "success");
    } catch (err) {
      console.error("handleDeleteUser", err);
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  // -------------------------
  // FILES: fetch / upload / delete / bulk-delete / edit metadata
  // -------------------------
  const fetchFilesForUser = async (userId) => {
    try {
      setSelectedUserId(userId);
      setActivePage("files");
      setSelectedFiles([]);
      setSelectAll(false);
      setLoadingFiles(true);

      const q = query(collection(db, "users", userId, "files"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setUserFiles(rows);
    } catch (err) {
      console.error("fetchFilesForUser", err);
      Swal.fire("Error", "Could not load files", "error");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !selectedUserId) {
      Swal.fire("Missing Info", "Select a user and a file first", "warning");
      return;
    }
    try {
      // storage path: uploads/{userId}/{filename}
      const storagePath = `uploads/${selectedUserId}/${fileToUpload.name}`;
      const sRef = ref(storage, storagePath);
      await uploadBytes(sRef, fileToUpload);
      const url = await getDownloadURL(sRef);

      // add Firestore doc (auto id)
      await addDoc(collection(db, "users", selectedUserId, "files"), {
        fileName: fileToUpload.name,
        fileURL: url,
        uploadedAt: new Date().toISOString(),
        // optional: empty data object for metadata
        data: {},
      });

      Swal.fire("Uploaded", "File uploaded successfully", "success");
      setFileToUpload(null);
      await fetchFilesForUser(selectedUserId);
    } catch (err) {
      console.error("handleFileUpload", err);
      Swal.fire("Error", "File upload failed", "error");
    }
  };

  const handleDeleteFile = async (fileId) => {
    const file = userFiles.find((f) => f.docId === fileId);
    if (!file) return;
    const res = await Swal.fire({
      title: "Delete file?",
      text: `Delete "${file.fileName || file.docId}"?`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;

    try {
      // Delete Firestore doc
      await deleteDoc(doc(db, "users", selectedUserId, "files", fileId));

      // Try to delete storage object if fileName exists
      if (file.fileName) {
        const storagePath = `uploads/${selectedUserId}/${file.fileName}`;
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (sErr) {
          // storage deletion can fail if file name/path mismatch — ignore but log
          console.warn("Storage delete failed", sErr);
        }
      }

      setUserFiles((prev) => prev.filter((f) => f.docId !== fileId));
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
      Swal.fire("Deleted", "File removed", "success");
    } catch (err) {
      console.error("handleDeleteFile", err);
      Swal.fire("Error", "Could not delete file", "error");
    }
  };

  const handleSelectToggle = (docId) => {
    if (selectedFiles.includes(docId)) {
      setSelectedFiles((prev) => prev.filter((id) => id !== docId));
    } else {
      setSelectedFiles((prev) => [...prev, docId]);
    }
  };

  const handleSelectAllFiles = () => {
    if (selectAll) {
      setSelectedFiles([]);
      setSelectAll(false);
    } else {
      setSelectedFiles(userFiles.map((f) => f.docId));
      setSelectAll(true);
    }
  };

  const handleDeleteMultipleFiles = async () => {
    if (selectedFiles.length === 0) {
      Swal.fire("Select Files", "No files selected", "warning");
      return;
    }
    const res = await Swal.fire({
      title: `Delete ${selectedFiles.length} files?`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;

    try {
      for (let docId of selectedFiles) {
        const f = userFiles.find((x) => x.docId === docId);
        if (!f) continue;
        await deleteDoc(doc(db, "users", selectedUserId, "files", docId));
        if (f.fileName) {
          try {
            await deleteObject(ref(storage, `uploads/${selectedUserId}/${f.fileName}`));
          } catch (e) {
            console.warn("storage delete failed", e);
          }
        }
      }
      Swal.fire("Deleted", `${selectedFiles.length} files removed`, "success");
      await fetchFilesForUser(selectedUserId);
      setSelectedFiles([]);
      setSelectAll(false);
    } catch (err) {
      console.error("handleDeleteMultipleFiles", err);
      Swal.fire("Error", "Bulk delete failed", "error");
    }
  };

  // ---------- EDIT METADATA (works for arbitrary structure) ----------
  const openEditModal = (file) => {
    // file is the Firestore doc object (contains docId and any keys)
    setEditDocId(file.docId);
    // create a shallow copy of the doc for editing. We will allow editing all top-level fields.
    // Many file docs have 'data' object for structured rows; keep it.
    // We'll make sure editData is a plain object.
    const copy = { ...file };
    // remove docId from editable keys
    delete copy.docId;
    setEditData(copy);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditDocId(null);
    setEditData({});
  };

  const saveEditModal = async () => {
    if (!editDocId) return;
    try {
      // update whole document with editData (overwrites only passed fields)
      await updateDoc(doc(db, "users", selectedUserId, "files", editDocId), editData);
      Swal.fire("Saved", "File metadata updated", "success");
      // refresh files list
      await fetchFilesForUser(selectedUserId);
      closeEditModal();
    } catch (err) {
      console.error("saveEditModal", err);
      Swal.fire("Error", "Failed to save changes", "error");
    }
  };

  // helper: edit a key inside editData (string keys)
  const handleEditDataChange = (key, value) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  // helper: add a new empty key
  const handleAddNewField = () => {
    // pick a unique field name
    let base = "newField";
    let i = 1;
    while (Object.prototype.hasOwnProperty.call(editData, `${base}${i}`)) i++;
    handleEditDataChange(`${base}${i}`, "");
  };

  // helper: delete a key
  const handleRemoveField = (key) => {
    const copy = { ...editData };
    delete copy[key];
    setEditData(copy);
  };

  // Click outside modal to close
  useEffect(() => {
    if (!editModalOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // Do not auto-close to avoid accidental loss; require explicit close
        // closeEditModal();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editModalOpen]);

  // -------------------------
  // UI (Blue + White)
  // -------------------------
  const Sidebar = (
    <div style={{
      width: 220,
      background: "#0d47a1",
      color: "#fff",
      padding: 20,
      height: "100vh",
      boxShadow: "2px 0 10px rgba(0,0,0,0.08)"
    }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18 }}>Admin Panel</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SIDEBAR_PAGES.map(p => (
          <div
            key={p.key}
            onClick={() => { setActivePage(p.key); setSelectedUserId(""); setUserFiles([]); }}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              cursor: "pointer",
              background: activePage === p.key ? "#1565c0" : "transparent",
              fontWeight: activePage === p.key ? 700 : 500
            }}
          >
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );

  const Header = (
    <div style={{
      background: "#fff",
      padding: "12px 20px",
      borderBottom: "1px solid #e6eefb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ color: "#0d47a1", fontWeight: 800, fontSize: 20 }}>QR System — Admin</div>
      <div>
        <button onClick={() => Swal.fire("Logout", "Not implemented in demo", "info")}
                style={{
                  background: "#0d47a1",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer"
                }}>Logout</button>
      </div>
    </div>
  );

  // Main area content
  const MainContent = () => (
    <div style={{ flex: 1, background: "#f6f8fc", minHeight: "100vh" }}>
      {Header}
      <div style={{ padding: 28 }}>
        {/* USERS */}
        {activePage === "users" && (
          <>
            <h3 style={{ color: "#0d47a1", marginBottom: 12 }}>All Users</h3>
            {loadingUsers ? (
              <div>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ color: "#666" }}>No users found.</div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 10, padding: 12, boxShadow: "0 3px 10px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#eaf4ff" }}>
                      <th style={{ padding: 10, textAlign: "left" }}>Name</th>
                      <th style={{ padding: 10, textAlign: "left" }}>Email</th>
                      <th style={{ padding: 10, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #eef6ff" }}>
                        <td style={{ padding: 10 }}>{u.name || "Unnamed"}</td>
                        <td style={{ padding: 10 }}>{u.email}</td>
                        <td style={{ padding: 10, textAlign: "center" }}>
                          <button onClick={() => handleEditUser(u)} style={{ marginRight: 8, background: "#1565c0", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => fetchFilesForUser(u.id)} style={{ marginRight: 8, background: "#0288d1", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Files</button>
                          <button onClick={() => handleDeleteUser(u.id)} style={{ background: "#c62828", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ADD USER */}
        {activePage === "add" && (
          <div style={{ maxWidth: 520, marginTop: 10 }}>
            <div style={{ background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,0.04)" }}>
              <h3 style={{ color: "#0d47a1" }}>Create User</h3>
              <div style={{ marginTop: 12 }}>
                <input placeholder="Full name" value={newUser.name} onChange={e => setNewUser(s => ({ ...s, name: e.target.value }))} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #dce8fa" }} />
                <input placeholder="Email" value={newUser.email} onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #dce8fa" }} />
                <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))} style={{ width: "100%", padding: 10, marginBottom: 14, borderRadius: 8, border: "1px solid #dce8fa" }} />
                <div style={{ textAlign: "right" }}>
                  <button onClick={handleCreateUser} style={{ background: "#0d47a1", color: "#fff", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Create User</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILES for selected user */}
        {activePage === "files" && (
          <div>
            <h3 style={{ color: "#0d47a1", marginBottom: 12 }}>
              {selectedUserId ? `Documents for: ${selectedUserId}` : "Select a user to view files"}
            </h3>

            {selectedUserId && (
              <div style={{ background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 3px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <input type="file" onChange={e => setFileToUpload(e.target.files?.[0] ?? null)} />
                  <button onClick={handleFileUpload} style={{ background: "#0d47a1", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}>Upload File</button>

                  <button onClick={handleDeleteMultipleFiles} disabled={selectedFiles.length === 0} style={{ background: selectedFiles.length ? "#c62828" : "#ef9a9a", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: selectedFiles.length ? "pointer" : "not-allowed" }}>
                    Delete Selected ({selectedFiles.length})
                  </button>

                  <label style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAllFiles} />
                    Select All
                  </label>
                </div>

                {loadingFiles ? <div>Loading files...</div> : userFiles.length === 0 ? <div style={{ color: "#666" }}>No files for this user.</div> : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#eaf4ff" }}>
                        <th style={{ padding: 10, textAlign: "center" }}>#</th>
                        <th style={{ padding: 10, textAlign: "left" }}>File Name</th>
                        <th style={{ padding: 10, textAlign: "left" }}>Uploaded At</th>
                        <th style={{ padding: 10, textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userFiles.map((f, idx) => (
                        <tr key={f.docId} style={{ borderBottom: "1px solid #f0f7ff" }}>
                          <td style={{ padding: 10, textAlign: "center" }}>
                            <input type="checkbox" checked={selectedFiles.includes(f.docId)} onChange={() => handleSelectToggle(f.docId)} />
                          </td>
                          <td style={{ padding: 10 }}>{f.fileName || "(no name)"}</td>
                          <td style={{ padding: 10 }}>{f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "Unknown"}</td>
                          <td style={{ padding: 10, textAlign: "center" }}>
                            <button onClick={() => openEditModal(f)} style={{ marginRight: 8, background: "#229bde", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Edit</button>
                            <a href={f.fileURL || "#"} target="_blank" rel="noreferrer" style={{ marginRight: 8, color: "#1565c0" }}>View</a>
                            <button onClick={() => handleDeleteFile(f.docId)} style={{ background: "#c62828", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div style={{
          position: "fixed", left: 0, top: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div ref={modalRef} style={{ width: "92%", maxWidth: 820, background: "#fff", borderRadius: 10, padding: 18, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: "#0d47a1" }}>Edit File Metadata</h3>
              <div>
                <button onClick={closeEditModal} style={{ background: "#eee", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Close</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              {/* Left: general meta (fileName, fileURL, uploadedAt) */}
              <div style={{ flex: 0.45 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, color: "#0d47a1" }}>File Name</label>
                  <input value={editData.fileName || ""} onChange={e => handleEditDataChange("fileName", e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dbeffd", marginTop: 6 }} />
                  <small style={{ color: "#666" }}>Renaming updates Firestore only — storage filename is unchanged.</small>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, color: "#0d47a1" }}>File URL</label>
                  <input value={editData.fileURL || ""} onChange={e => handleEditDataChange("fileURL", e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dbeffd", marginTop: 6 }} />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, color: "#0d47a1" }}>Uploaded At</label>
                  <input value={editData.uploadedAt || ""} onChange={e => handleEditDataChange("uploadedAt", e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dbeffd", marginTop: 6 }} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={handleAddNewField} style={{ background: "#0d47a1", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}>Add Field</button>
                </div>
              </div>

              {/* Right: dynamic data object or other keys */}
              <div style={{ flex: 0.55 }}>
                <div style={{ marginBottom: 8, color: "#0d47a1", fontWeight: 700 }}>All Keys (editable)</div>

                {/* If editData has a nested 'data' object, prefer editing that object fields (common structure) */}
                { (editData.data && typeof editData.data === "object") ? (
                  <>
                    {Object.keys(editData.data).map(k => (
                      <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input style={{ flex: 0.45, padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} value={k} readOnly />
                          <input style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} value={editData.data[k] ?? ""} onChange={e => {
                            const updated = { ...(editData.data || {}) , [k]: e.target.value };
                            handleEditDataChange("data", updated);
                          }} />
                          <button onClick={() => {
                            const updated = { ...(editData.data || {}) };
                            delete updated[k];
                            handleEditDataChange("data", updated);
                          }} style={{ background: "#ff6b6b", color: "#fff", border: "none", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    {/* allow adding a new key inside data */}
                    <div style={{ marginTop: 6 }}>
                      <small style={{ color: "#666" }}>Add a new field inside <b>data</b> object:</small>
                      <AddNewDataField editData={editData} onChange={(newObj) => handleEditDataChange("data", newObj)} />
                    </div>
                  </>
                ) : (
                  // If there is no 'data' object, allow editing all top-level keys (except docId)
                  <>
                    {Object.keys(editData).filter(k => k !== "docId").map(k => (
                      <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input value={k} readOnly style={{ flex: 0.45, padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
                          <input value={editData[k] ?? ""} onChange={e => handleEditDataChange(k, e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
                          <button onClick={() => handleRemoveField(k)} style={{ background: "#ff6b6b", color: "#fff", border: "none", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 6 }}>
                      <small style={{ color: "#666" }}>Add a new top-level key:</small>
                      <AddNewTopLevelField editData={editData} onChange={(newObj) => setEditData(newObj)} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeEditModal} style={{ background: "#eee", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEditModal} style={{ background: "#0d47a1", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {Sidebar}
      <MainContent />
    </div>
  );
};

// Small helper components for adding new fields
const AddNewDataField = ({ editData, onChange }) => {
  const [keyInput, setKeyInput] = useState("");
  const [valInput, setValInput] = useState("");
  const add = () => {
    if (!keyInput) return;
    const base = { ...(editData.data || {}) };
    base[keyInput] = valInput;
    onChange(base);
    setKeyInput("");
    setValInput("");
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input placeholder="key" value={keyInput} onChange={e => setKeyInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
      <input placeholder="value" value={valInput} onChange={e => setValInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
      <button onClick={add} style={{ background: "#1565c0", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Add</button>
    </div>
  );
};

const AddNewTopLevelField = ({ editData, onChange }) => {
  const [keyInput, setKeyInput] = useState("");
  const [valInput, setValInput] = useState("");
  const add = () => {
    if (!keyInput) return;
    const copy = { ...(editData || {}) };
    copy[keyInput] = valInput;
    onChange(copy);
    setKeyInput(""); setValInput("");
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input placeholder="key" value={keyInput} onChange={e => setKeyInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
      <input placeholder="value" value={valInput} onChange={e => setValInput(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #dbeffd" }} />
      <button onClick={add} style={{ background: "#1565c0", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Add</button>
    </div>
  );
};

export default AdminDashboard;
