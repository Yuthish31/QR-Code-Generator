import React, { useEffect, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import Swal from "sweetalert2";
import { app } from "./firebaseConfig";

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userFiles, setUserFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email !== "admin@sys.com") return;

        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire("Error", "Failed to load user data", "error");
      }
    };

    fetchUsers();
  }, []);

  // Create new user and send verification email
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      Swal.fire("Missing Info", "Please fill all fields", "warning");
      return;
    }

    try {
      const admin = auth.currentUser;

      // Temporarily sign out admin and create new user
      await auth.signOut();
      const userCred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await sendEmailVerification(userCred.user);

      // Save user data in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: newUser.name,
        email: newUser.email,
        uid: userCred.user.uid,
        createdAt: new Date().toISOString(),
      });

      Swal.fire(
        "User Created",
        `Verification email sent to ${newUser.email}`,
        "success"
      );

      // Re-login as admin
      await auth.signInWithEmailAndPassword("admin@sys.com", "Admin@2025");

      setNewUser({ name: "", email: "", password: "" });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    }
  };

  // Fetch files for a selected user
  const fetchFilesForUser = async (userId) => {
    try {
      setSelectedUserId(userId);
      const q = query(collection(db, `users/${userId}/files`));
      const snapshot = await getDocs(q);
      const files = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserFiles(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      Swal.fire("Error", "Could not load files", "error");
    }
  };

  // Upload file for a user
  const handleFileUpload = async () => {
    if (!fileToUpload || !selectedUserId) {
      Swal.fire("Missing Info", "Select a file and user first", "warning");
      return;
    }

    try {
      const fileRef = ref(storage, `uploads/${selectedUserId}/${fileToUpload.name}`);
      await uploadBytes(fileRef, fileToUpload);
      const url = await getDownloadURL(fileRef);

      await setDoc(doc(collection(db, `users/${selectedUserId}/files`)), {
        fileName: fileToUpload.name,
        fileURL: url,
        uploadedAt: new Date().toISOString(),
      });

      Swal.fire("Uploaded!", "File uploaded successfully", "success");
      fetchFilesForUser(selectedUserId);
      setFileToUpload(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire("Error", "File upload failed", "error");
    }
  };

  // Delete user file
  const handleDeleteFile = async (userId, fileId, fileName) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/files/${fileId}`));
      const fileRef = ref(storage, `uploads/${userId}/${fileName}`);
      await deleteObject(fileRef);

      Swal.fire("Deleted!", "File removed successfully", "success");
      fetchFilesForUser(userId);
    } catch (error) {
      console.error("Error deleting file:", error);
      Swal.fire("Error", "Could not delete file", "error");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the user!",
      icon: "warning",
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "users", userId));
          Swal.fire("Deleted!", "User removed successfully", "success");
          setUsers(users.filter((u) => u.id !== userId));
        } catch (error) {
          Swal.fire("Error", "Failed to delete user", "error");
        }
      }
    });
  };

  // Edit user details
  const handleEditUser = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit User",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Name" value="${user.name}">
        <input id="swal-email" class="swal2-input" placeholder="Email" value="${user.email}">
        <input id="swal-pass" type="password" class="swal2-input" placeholder="New Password (optional)">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        name: document.getElementById("swal-name").value,
        email: document.getElementById("swal-email").value,
        password: document.getElementById("swal-pass").value,
      }),
    });

    if (formValues) {
      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          name: formValues.name,
          email: formValues.email,
        });

        if (formValues.password) {
          await updatePassword(auth.currentUser, formValues.password);
        }

        Swal.fire("Updated!", "User details updated successfully", "success");
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, ...formValues } : u))
        );
      } catch (error) {
        Swal.fire("Error", "Failed to update user", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-100 p-8">
      <h1 className="text-center text-3xl font-bold text-purple-800 mb-6">
        Admin Dashboard — Manage Users & Files
      </h1>

      {/* Create User Section */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create User</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="border border-purple-300 rounded px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border border-purple-300 rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            className="border border-purple-300 rounded px-3 py-2"
          />
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            onClick={handleCreateUser}
          >
            Create User
          </button>
        </div>
      </div>

    {/* Users Table */}
    <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        {users.length === 0 ? (
            <p>No users found.</p>
        ) : (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-purple-200 text-purple-900">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-purple-50">
                            <td className="p-2">{user.name || "Unnamed"}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2 text-center space-x-2">
                                <button
                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                    onClick={() => handleEditUser(user)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    onClick={() => fetchFilesForUser(user.id)}
                                >
                                    View Docs
                                </button>
                                <button
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    onClick={() => handleDeleteUser(user.id)}
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

    {/* File Management Section */}
      {selectedUserId && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">
            Documents for: {selectedUserId}
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <input
              type="file"
              onChange={(e) => setFileToUpload(e.target.files[0])}
              className="border border-purple-300 rounded px-2 py-1"
            />
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
              onClick={handleFileUpload}
            >
              Upload File
            </button>
          </div>

          {userFiles.length === 0 ? (
            <p>No documents found for this user.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-purple-200 text-purple-900">
                  <th className="p-2">File Name</th>
                  <th className="p-2">Uploaded At</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userFiles.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-purple-50">
                    <td className="p-2">{file.fileName}</td>
                    <td className="p-2">
                      {new Date(file.uploadedAt).toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <a
                        href={file.fileURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline mr-4"
                      >
                        View
                      </a>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() =>
                          handleDeleteFile(selectedUserId, file.id, file.fileName)
                        }
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
      )}
    </div>
  );
};

export default AdminDashboard;
