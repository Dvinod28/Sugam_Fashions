import { createSlice } from "@reduxjs/toolkit";
import { db } from "../../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const initialState = {
  currentUser: null,
  customers: [],
  loading: false,
  error: null,
};

export const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action) {
      state.currentUser = action.payload;
    },
    setCustomers(state, action) {
      state.customers = action.payload || [];
    },
    setUsersLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setUsersError(state, action) {
      state.error = action.payload || null;
    },
  },
});

export const { setCurrentUser, setCustomers, setUsersLoading, setUsersError } = UserSlice.actions;
export default UserSlice.reducer;

// Helper to safely convert Firestore Timestamp -> ISO string (serializable)
function convertTimestamps(obj) {
  if (!obj) return obj;
  
  // Handle lastLoginAt specifically
  if (obj.lastLoginAt) {
    const lastLoginAt = obj.lastLoginAt;
    try {
      if (typeof lastLoginAt.toDate === "function") {
        return { ...obj, lastLoginAt: lastLoginAt.toDate().toISOString() };
      }
      if (lastLoginAt.seconds && typeof lastLoginAt.seconds === "number") {
        return { ...obj, lastLoginAt: new Date(lastLoginAt.seconds * 1000).toISOString() };
      }
      return { ...obj, lastLoginAt: new Date(lastLoginAt).toISOString() };
    } catch (e) {
      return { ...obj, lastLoginAt: new Date().toISOString() };
    }
  }
  
  return obj;
}

export function fetchCustomers() {
  return async function fetchCustomersThunk(dispatch) {
    dispatch(setUsersLoading(true));
    dispatch(setUsersError(null));
    try {
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      const list = snap.docs.map((d) => {
        const data = { id: d.id, ...d.data() };
        return convertTimestamps(data);
      });
      dispatch(setCustomers(list));
    } catch (e) {
      dispatch(setUsersError(e?.message || "Failed to load customers"));
    } finally {
      dispatch(setUsersLoading(false));
    }
  };
}

export async function getUserById(userId) {
  if (!userId) return null;
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}


