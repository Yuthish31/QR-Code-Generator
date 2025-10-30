import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { app } from "./firebaseConfig";

const db = getFirestore(app);
const auth = getAuth(app);

const styles = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    background: "linear-gradient(133deg, #bec8ff 0%, #e8ecfa 100%)",
  },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
    marginBottom: "25px",
  },
  input: {
    padding: "8px 10px",
    margin: "5px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "8px 16px",
    margin: "5px",
    borderRadius: "8px",
    background: "#4e3cc9",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  heading: {
    color: "#32209f",
    fontWeight: 800,
    marginBottom: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#d6d7ff",
    padding: "10px",
  },
  td: {
    borderBottom: "1px solid #ddd",
    padding: "10px",
  },
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(userList);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: newUser.name,
        email: newUser.email,
        role: "user",
        createdAt: new Date().toISOString(),
      });
      alert("User created successfully!");
      setNewUser({ name: "", email: "", password: "" });
      fetchUsers();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (userId, field, value) => {
    try {
      await updateDoc(doc(db, "users", userId), { [field]: value });
      alert("User updated!");
      fetchUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure to delete this user?")) {
      await deleteDoc(doc(db, "users", userId));
      alert("User deleted.");
      fetchUsers();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Admin Dashboard</h2>

        <h3>Create User</h3>
        <input
          style={styles.input}
          type="text"
          placeholder="Full Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />
        <button style={styles.button} onClick={handleCreateUser} disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.heading}>All Users</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={styles.td}>
                  <input
                    style={styles.input}
                    value={u.name}
                    onChange={(e) =>
                      handleUpdateUser(u.id, "name", e.target.value)
                    }
                  />
                </td>
                <td style={styles.td}>
                  <input
                    style={styles.input}
                    value={u.email}
                    onChange={(e) =>
                      handleUpdateUser(u.id, "email", e.target.value)
                    }
                  />
                </td>
                <td style={styles.td}>{u.role || "user"}</td>
                <td style={styles.td}>
                  <button
                    style={styles.button}
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
