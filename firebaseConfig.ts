import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration from pv-sales-dashboard
const firebaseConfig = {
  apiKey: "AIzaSyDlzKCIIPlDPxCwUGOqyNxKacr98zUxzAM",
  authDomain: "pv-sales-dashboard.firebaseapp.com",
  projectId: "pv-sales-dashboard",
  storageBucket: "pv-sales-dashboard.firebasestorage.app",
  messagingSenderId: "22297904030",
  appId: "1:22297904030:web:9f396f974512a9d05ccc8f",
  measurementId: "G-33YCPBMPB6"
};

// Check if the user has replaced the placeholders (logic inverted: true if configured)
export const isFirebaseConfigured = 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Only initialize if configured to prevent crashes
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;