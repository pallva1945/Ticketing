import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const COLLECTION_NAME = "appData";
const DOC_ID = "masterFile";

/**
 * Saves the CSV string to Firebase Firestore.
 * This overwrites the existing master file, making this the new source of truth for all users.
 */
export const saveCsvToFirebase = async (csvContent: string): Promise<void> => {
  if (!db) {
    throw new Error("Firebase is not configured. Please check firebaseConfig.ts");
  }
  try {
    await setDoc(doc(db, COLLECTION_NAME, DOC_ID), {
      content: csvContent,
      updatedAt: new Date().toISOString()
    });
    console.log("CSV saved to Firebase successfully");
  } catch (error: any) {
    console.error("Error saving to Firebase:", error);
    if (error.code === 'permission-denied') {
      throw new Error("permission-denied");
    }
    throw error;
  }
};

/**
 * Fetches the CSV string from Firebase Firestore.
 * Returns null if no file exists yet.
 */
export const getCsvFromFirebase = async (): Promise<string | null> => {
  if (!db) {
    console.warn("Firebase is not configured. Skipping cloud fetch.");
    return null;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.content as string;
    } else {
      console.log("No such document in Firebase!");
      return null;
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      throw new Error("permission-denied");
    }
    console.error("Error getting document from Firebase:", error);
    return null;
  }
};