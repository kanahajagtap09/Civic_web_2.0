// src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ Make sure these values come directly from Firebase Console settings
const firebaseConfig = {
  apiKey: "AIzaSyAcYQEgQFSkDK2zJwhr_tEVTywYc-sXXMQ",
  authDomain: "fir-auth-3694c.firebaseapp.com",
  projectId: "fir-auth-3694c",
  // ✅ Corrected storageBucket (Firebase always uses appspot.com)
  storageBucket: "fir-auth-3694c.appspot.com",
  messagingSenderId: "1004112228354",
  appId: "1:1004112228354:web:6683533badd21ed9ff371b",
  measurementId: "G-FN6TMPBF1E"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Optional: Analytics (won’t break anything if it runs in browser only)
const analytics = getAnalytics(app);

// ✅ Export initialized Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);