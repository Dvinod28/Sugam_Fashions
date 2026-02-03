import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { ROLES } from "../data/roles";

// Admins collection: document id = uid of admin user
export async function isAdminUser(user) {
  if (!user?.uid) return false;
  // Env-based fallback
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase();
  if (adminEmail && String(user.email || "").toLowerCase() === adminEmail) return true;
  
  const userRole = await getUserRole(user.uid);
  return userRole === ROLES.ADMIN;
}

export async function getUserRole(uid) {
  if (!uid) return null;
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().role || null;
    }
    return null;
  } catch (e) {
    console.error("Error getting user role: ", e);
    return null;
  }
}


