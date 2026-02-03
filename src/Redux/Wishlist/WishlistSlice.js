import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const WishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist(state, action) {
      const product = action.payload;
      const exists = state.find((item) => item.id === product.id);

      if (exists) {
        // remove if already exists
        return state.filter((item) => item.id !== product.id);
      } else {
        // add if not exists
        state.push(product);
      }
    },
    clearWishlist: () => [], // optional
  },
});

export const { toggleWishlist, clearWishlist } = WishlistSlice.actions;
export default WishlistSlice.reducer;
