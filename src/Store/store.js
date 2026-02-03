import { configureStore } from '@reduxjs/toolkit'
import CartSlice from '../Redux//Cart/CartSlice'
import ProductSlice from '../Redux/Product/ProductSlice'
import WishlistSlice from '../Redux/Wishlist/WishlistSlice'
import DashboardSlice from '../Redux/Dashboard/DashboardSlice'
import UserSlice from '../Redux/User/UserSlice'

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    if (serializedCart === null) {
      return [];
    }
    return JSON.parse(serializedCart);
  } catch (e) {
    console.error("Error loading cart from localStorage:", e);
    return [];
  }
};

// Create store with preloaded state
export const store = configureStore({
  reducer: {
    cart: CartSlice,
    product: ProductSlice,
    wishlist: WishlistSlice,
    dashboard: DashboardSlice,
    user: UserSlice,
    order: (await import('../Redux/Order/OrderSlice')).default,
  },
  preloadedState: {
    cart: loadCartFromStorage()
  }
});

// Subscribe to store changes to save cart to localStorage
store.subscribe(() => {
  try {
    const cart = store.getState().cart;
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (e) {
    console.error("Error saving cart to localStorage:", e);
  }
});