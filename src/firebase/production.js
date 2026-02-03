import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

const productionCollection = collection(db, "production");

export const createProductionEntry = async (orderId, productId, department, metadata = {}) => {
  try {
    const docRef = await addDoc(productionCollection, {
      orderId,
      productId,
      department,
      status: "pending", // pending, in-progress, completed, cancelled
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...metadata,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating production entry: ", error);
    return null;
  }
};

export const getProductionEntriesByDepartment = async (department) => {
  try {
    const q = query(productionCollection, where("department", "==", department));
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    return entries;
  } catch (error) {
    console.error("Error getting production entries: ", error);
    return [];
  }
};

export const updateProductionStatus = async (entryId, status) => {
  try {
    const docRef = doc(db, "production", entryId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating production status: ", error);
    return false;
  }
};