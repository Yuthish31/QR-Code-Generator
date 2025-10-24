// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBInzBlOiZvACXVAOpIjs6eG1ruSi0Mkls",
  authDomain: "qr-code-generator-a5512.firebaseapp.com",
  projectId: "qr-code-generator-a5512",
  storageBucket: "qr-code-generator-a5512.appspot.com",
  messagingSenderId: "1031616590522",
  appId: "1:1031616590522:web:d184526f8e8ef08c9d4883",
  measurementId: "G-ZHP35RBMY6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export both app and db so other files can use them
export const db = getFirestore(app);
export { app };
