
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const COLLECTION_NAME = "appData";

export interface DBData {
  content: string;
  updatedAt: string;
}

/**
 * Saves the CSV string to Firebase Firestore.
 * @param csvContent The CSV string
 * @param datasetId The ID of the document (e.g., 'ticketing', 'gameday')
 */
export const saveCsvToFirebase = async (csvContent: string, datasetId: string = 'ticketing'): Promise<void> => {
  if (!db) {
    throw new Error("Firebase is not configured. Please check firebaseConfig.ts");
  }
  try {
    await setDoc(doc(db, COLLECTION_NAME, datasetId), {
      content: csvContent,
      updatedAt: new Date().toISOString()
    });
    console.log(`CSV saved to Firebase (${datasetId}) successfully`);
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
 * @param datasetId The ID of the document (e.g., 'ticketing', 'gameday')
 */
export const getCsvFromFirebase = async (datasetId: string = 'ticketing'): Promise<DBData | null> => {
  if (!db) {
    console.warn("Firebase is not configured. Skipping cloud fetch.");
    return null;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, datasetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
          content: data.content as string,
          updatedAt: data.updatedAt as string
      };
    } else {
      console.log(`No such document (${datasetId}) in Firebase!`);
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
