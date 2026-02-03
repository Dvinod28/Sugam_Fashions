import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db, auth } from "../../firebase/config";
import { collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const initialState = [];

export const loadCart = createAsyncThunk("cart/load", async () => {
  const user = auth.currentUser;
  if (!user) return [];
  const ref = collection(db, "carts");
  const q = query(ref, where("uid", "==", user.uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
});

export const addToCartRemote = createAsyncThunk("cart/addRemote", async (item) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = collection(db, "carts");
  // try to find existing
  const q = query(ref, where("uid", "==", user.uid), where("productId", "==", item.id));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(ref, {
      uid: user.uid,
      productId: item.id,
      title: item.title,
      price: item.price,
      images: item.images,
      quantity: 1,
    });
  } else {
    const docRef = doc(db, "carts", snap.docs[0].id);
    await updateDoc(docRef, { quantity: (snap.docs[0].data().quantity || 1) + 1 });
  }
  return true;
});

export const removeFromCartRemote = createAsyncThunk("cart/removeRemote", async (productId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const ref = collection(db, "carts");
  const q = query(ref, where("uid", "==", user.uid), where("productId", "==", productId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docRef = doc(db, "carts", snap.docs[0].id);
    const qty = snap.docs[0].data().quantity || 1;
    if (qty > 1) await updateDoc(docRef, { quantity: qty - 1 });
    else await deleteDoc(docRef);
  }
  return true;
});

export const CartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    add(state, action) {
       const itemIndex = state.findIndex(
        (item) => item.id === action.payload.id
      );
      const qtyToAdd = Number(action.payload.quantity) || 1;
      if (itemIndex >= 0) {
        state[itemIndex].quantity += qtyToAdd; // increase qty by provided amount
      } else {
        state.push({ ...action.payload, quantity: qtyToAdd });
      }
      
      // Only open cart drawer if specified
      if (action.payload && action.payload.openDrawer && window.openCartDrawer) {
        window.openCartDrawer();
      }
    },
    clear() {
      return [];
    },
     removeItem: (state, action) => {
      // remove entire product no matter the quantity
      return state.filter((item) => item.id !== action.payload.id);
    },
    remove(state, action) {
     const itemIndex = state.findIndex(
        (item) => item.id === action.payload.id
      );
      if (itemIndex >= 0) {
        if (state[itemIndex].quantity > 1) {
          state[itemIndex].quantity -= 1; // decrease qty
        } else {
          state.splice(itemIndex, 1); // remove completely
        }
      }
    },
    
  },
});

// Action creators are generated for each case reducer function
export const { add, remove , removeItem, clear } = CartSlice.actions;

export default CartSlice.reducer;
