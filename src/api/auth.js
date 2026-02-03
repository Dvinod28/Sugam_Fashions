import { auth, googleProvider, db } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export async function login({ email, password }) {
  // support login by email or by phone (if `email` param contains phone)
  let _email = email;
  if (email && !email.includes("@")) {
    // treat as phone number, lookup user in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phone", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      _email = snap.docs[0].data().email;
    }
  }
  // If lookup didn't find an email and the provided identifier isn't an email,
  // surface a clearer error instead of passing an invalid email to Firebase.
  if (!_email || (!_email.includes("@") && !(email && email.includes("@")))) {
    const err = new Error("No account found for the provided phone number or email.");
    err.code = "auth/user-not-found";
    throw err;
  }
  const credentials = await signInWithEmailAndPassword(auth, _email, password);
  return credentials.user;
}

export async function signup({ name, email, password, phone }) {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(credentials.user, { displayName: name });
  // Persist additional user data to Firestore (so we can show phone, name, etc.)
  try {
    const userRef = doc(db, "users", credentials.user.uid);
    await setDoc(userRef, {
      displayName: name || credentials.user.displayName || "",
      email: email,
      phone: phone || "",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to write user profile to Firestore", e);
  }
  return credentials.user;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export async function sendPasswordReset(identifier) {
  // identifier can be email or phone. If phone, lookup email.
  let _email = identifier;
  if (identifier && !identifier.includes("@")) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phone", "==", identifier));
    const snap = await getDocs(q);
    if (!snap.empty) {
      _email = snap.docs[0].data().email;
    }
  }
  if (!_email) throw new Error("No email found for this identifier");
  return sendPasswordResetEmail(auth, _email);
}


