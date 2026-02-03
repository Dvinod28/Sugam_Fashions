import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch } from "react-redux";
import { setCurrentUser as setCurrentUserRedux } from "../Redux/User/UserSlice";
import { getUserRole } from "../api/roles";

// Create auth context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRole(user.uid);
        console.log("AuthContext: User role retrieved:", role, "for user:", user.uid);
        const userWithRole = { ...user, role };
        setLocalUser(userWithRole);
        // Mirror in Redux for global access
        dispatch(setCurrentUserRedux(user ? {
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          role: role,
        } : null));

        // Upsert basic user doc for metrics
        try {
          const ref = doc(db, "users", user.uid);
          await setDoc(ref, {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            provider: (user.providerData?.[0]?.providerId) || "password",
            lastLoginAt: serverTimestamp(),
            createdAt: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp(),
            role: role,
          }, { merge: true });
        } catch (e) {
          // ignore upsert errors in UI
        }
      } else {
        setLocalUser(null);
        dispatch(setCurrentUserRedux(null));
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Context value
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};