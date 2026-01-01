import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

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

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    // Check if app is already initialized to prevent HMR errors
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Firestore safely
    try {
        dbInstance = getFirestore(app);
    } catch (fsError) {
        console.warn("Firestore service initialization failed:", fsError);
        // We do not throw here to allow the rest of the app to load with local data
    }
  } catch (error) {
    console.error("Firebase App initialization error:", error);
  }
}

export const db = dbInstance;