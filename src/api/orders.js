import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Fetch a single order document from Firestore by its ID.
 * Returns `null` when no document is found or if the ID is invalid.
 */
export async function getOrderById(orderId) {
  if (!orderId) return null;
  try {
    const docRef = doc(db, "orders", String(orderId));
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Failed to fetch order", orderId, error);
    throw error;
  }
}

