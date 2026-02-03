import { createSlice } from "@reduxjs/toolkit";
import { db } from "../../firebase/config";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";

const initialState = {
  data: [],
  loading: false,
  error: null,
};

export const OrderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload || null; },
    setOrders(state, action) { state.data = action.payload || []; },
    addOne(state, action) { state.data = [action.payload, ...state.data]; },
    updateOne(state, action) {
      const idx = state.data.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) state.data[idx] = { ...state.data[idx], ...action.payload };
    },
  },
});

export const { setLoading, setError, setOrders, addOne, updateOne } = OrderSlice.actions;
export default OrderSlice.reducer;

// Helper to safely convert Firestore Timestamp -> ISO string (serializable)
function normalizeDate(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (value.seconds && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000).toISOString();
    }
    return new Date(value).toISOString();
  } catch (e) {
    return null;
  }
}

function convertCreatedAt(obj) {
  if (!obj) return obj;
  const createdAt = normalizeDate(obj.createdAt) || new Date().toISOString();
  const deliveryDate = normalizeDate(obj.deliveryDate);
  return {
    ...obj,
    createdAt,
    ...(deliveryDate ? { deliveryDate } : {}),
  };
}

export function updateOrderStatus(id, status) {
  return async function updateOrderStatusThunk(dispatch) {
    if (!id) return;
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const ref = doc(db, "orders", id);
      await (await import("firebase/firestore")).updateDoc(ref, { status });
      const fresh = await getDoc(ref);
      const raw = fresh.data() || {};
      const serializable = convertCreatedAt(raw);
      dispatch(updateOne({ id, ...serializable }));
    } catch (e) {
      dispatch(setError(e?.message || "Failed to update order status"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function placeOrder({ user, items, totals, customer }) {
  return async function placeOrderThunk(dispatch) {
    if (!user?.uid) throw new Error("Login required");
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const ordersRef = collection(db, "orders");
      const deliveryDateValue = customer?.deliveryDate
        ? new Date(customer.deliveryDate)
        : null;
      const payload = {
        uid: user.uid,
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          price: Number(i.price),
          quantity: Number(i.quantity || 1),
          images: i.images || [],
        })),
        subtotal: Number(totals?.subtotal || 0),
        status: "pending",
        customer: {
          name: customer?.name || user.displayName || "",
          email: customer?.email || user.email || "",
          phone: customer?.phone || "",
          address: customer?.address || "",
          deliveryDate: deliveryDateValue
            ? deliveryDateValue.toISOString()
            : "",
        },
        deliveryDate: deliveryDateValue,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(ordersRef, payload);

      const fresh = await getDoc(docRef);
      const rawData = fresh.data() || {};
      const serializable = convertCreatedAt(rawData);

      dispatch(addOne({ id: docRef.id, ...serializable }));
      return { id: docRef.id, ...serializable };
    } catch (e) {
      dispatch(setError(e?.message || "Failed to place order"));
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function fetchMyOrders(uid) {
  return async function fetchMyOrdersThunk(dispatch) {
    if (!uid) return;
    try {
      dispatch(setLoading(true));
      const ref = collection(db, "orders");
      // Simple query without ordering to avoid composite index requirement
      const q = query(ref, where("uid", "==", uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        return convertCreatedAt(raw);
      });
      // Sort manually to avoid composite index requirement
      const sortedList = list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order
      });
      dispatch(setOrders(sortedList));
      dispatch(setError(null));
    } catch (e) {
      dispatch(setError(e?.message || "Failed to fetch orders"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function fetchOrders() {
  return async function fetchOrdersThunk(dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const ordersRef = collection(db, "orders");
      const snapshot = await getDocs(ordersRef);
        const data = snapshot.docs.map((doc) => {
        const raw = { id: doc.id, ...doc.data() };
        return convertCreatedAt(raw);
      });
      dispatch(setOrders(data));
    } catch (err) {
      console.log(err);
      dispatch(setError(err?.message || "Failed to fetch orders"));
    } finally {
      dispatch(setLoading(false));
    } 
  };
}
