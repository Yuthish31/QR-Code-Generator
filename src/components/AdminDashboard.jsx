import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Swal from "sweetalert2";
import { app } from "../firebase";

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userFiles, setUserFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);

  // Fetch all users (admin only)
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

  // Admin upload file for a user
  const handleFileUpload = async () => {
    if (!fileToUpload || !selectedUserId) {
      Swal.fire("Missing Info", "Select a file and user first", "warning");
      return;
    }

    try {
      const fileRef = ref(storage, `adminUploads/${selectedUserId}/${fileToUpload.name}`);
      await uploadBytes(fileRef, fileToUpload);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, `users/${selectedUserId}/files`), {
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

      // Delete from storage too
      const fileRef = ref(storage, `adminUploads/${userId}/${fileName}`);
      await deleteObject(fileRef);

      Swal.fire("Deleted!", "File removed successfully", "success");
      fetchFilesForUser(userId);
    } catch (error) {
      console.error("Error deleting file:", error);
      Swal.fire("Error", "Could not delete file", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-100 p-8">
      <h1 className="text-center text-3xl font-bold text-purple-800 mb-6">
        Admin Dashboard — File Management
      </h1>

      <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
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
                  <td className="p-2 text-center">
                    <button
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
                      onClick={() => fetchFilesForUser(user.id)}
                    >
                      View Files
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File management section */}
      {selectedUserId && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">
            Manage Files for: {selectedUserId}
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
            <p>No files found for this user.</p>
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
                    <td className="p-2">{new Date(file.uploadedAt).toLocaleString()}</td>
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
                        onClick={() => handleDeleteFile(selectedUserId, file.id, file.fileName)}
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
