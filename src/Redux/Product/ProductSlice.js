import { createSlice } from "@reduxjs/toolkit";
import { db, storage } from "../../firebase/config";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { serializeTimestamps } from "../utils/firestoreHelpers";

const initialState = {
  data: [],
  loading: false,
  error: null,
};

export const ProductSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    fetchProduct(state, action) {
      state.data = action.payload;
    },
    addOne(state, action) {
      state.data = [action.payload, ...state.data];
    },
    updateOne(state, action) {
      const idx = state.data.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.data[idx] = action.payload;
    },
    removeOne(state, action) {
      state.data = state.data.filter((p) => p.id !== action.payload);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload || null;
    },
  },
});

// Action creators are generated for each case reducer function
export const { fetchProduct, addOne, updateOne, removeOne, setLoading, setError } = ProductSlice.actions;

export default ProductSlice.reducer;

export function getProduct() {
  return async function getProductThunk(dispatch) {
    try {
      dispatch(setLoading(true));
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return { id: docSnap.id, ...serializeTimestamps(data) };
      });
      dispatch(fetchProduct(items));
      dispatch(setError(null));
    } catch (err) {
      console.log(err);
      dispatch(setError(err?.message || "Failed to fetch products"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

// Helpers - Cloudinary image processing (images are now uploaded before reaching this point)
async function processImagesForStorage(images) {
  // Since images are now uploaded to Cloudinary before reaching this point,
  // we just need to validate and return the URLs
  const results = [];
  
  for (const item of images) {
    if (!item) continue;
    
    // If it's already a URL (from Cloudinary or elsewhere), keep it
    if (typeof item === "string" && item.startsWith("http")) {
      results.push(item);
      continue;
    }
    
    // Skip File objects as they should have been uploaded already
    if (item instanceof File) {
      console.warn("File object found in images - should have been uploaded to Cloudinary already");
      continue;
    }
  }
  
  return results;
}

export function addProduct(newProduct) {
  return async function addProductThunk(dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // Process images (they should already be Cloudinary URLs at this point)
      const processedImages = await processImagesForStorage(newProduct.images || []);
      
      // Create doc with processed images
      const refCol = collection(db, "products");
      const docRef = await addDoc(refCol, {
        title: newProduct.title,
        description: newProduct.description || "",
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
        categoryId: newProduct.categoryId || null,
        categoryName: newProduct.categoryName || null,
        images: processedImages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const fresh = await getDoc(docRef);
      const data = fresh.data() || {};
      dispatch(addOne({ id: docRef.id, ...serializeTimestamps(data) }));
    } catch (err) {
      console.log(err);
      dispatch(setError(err?.message || "Failed to add product"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function updateProduct(product) {
  return async function updateProductThunk(dispatch) {
    const id = product.id;
    if (!id) return;
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const docRef = doc(db, "products", id);
      
      // Check if product exists first
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Product not found");
      }
      
      // Process images (they should already be Cloudinary URLs at this point)
      const processedImages = await processImagesForStorage(product.images || []);
      
      await updateDoc(docRef, {
        title: product.title,
        description: product.description || "",
        price: Number(product.price),
        stock: Number(product.stock || 0),
        categoryId: product.categoryId || null,
        categoryName: product.categoryName || null,
        images: processedImages,
        updatedAt: serverTimestamp(),
      });
      
      const fresh = await getDoc(docRef);
      dispatch(updateOne({ id, ...serializeTimestamps(fresh.data()) }));
      dispatch(setError(null));
    } catch (err) {
      console.error("Error updating product:", err);
      const errorMessage = err?.message || "Failed to update product";
      dispatch(setError(errorMessage));
      throw err; // Re-throw to be caught by component
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function deleteProduct(product) {
  return async function deleteProductThunk(dispatch) {
    const id = typeof product === "string" ? product : product?.id;
    if (!id) return;
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      // Best-effort: delete images in folder
      const docRef = doc(db, "products", id);
      const snap = await getDoc(docRef);
      const data = snap.exists() ? snap.data() : null;
      const images = Array.isArray(data?.images) ? data.images : [];
      // Attempt to delete each image by URL if storage bucket matches
      for (const url of images) {
        try {
          if (typeof url === "string" && url.includes("https://")) {
            // Derive path if possible
            const parts = new URL(url);
            const pathMatch = decodeURIComponent(parts.pathname).match(/\/o\/(.*)$/);
            if (pathMatch && pathMatch[1]) {
              const storagePath = pathMatch[1];
              const imgRef = ref(storage, storagePath);
              await deleteObject(imgRef);
            }
          }
        } catch (_) {
          // ignore per-file errors
        }
      }
      await deleteDoc(docRef);
      dispatch(removeOne(id));
    } catch (err) {
      console.log(err);
      dispatch(setError(err?.message || "Failed to delete product"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function fetchProducts() {
  return async function fetchProductThunk(dispatch) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...serializeTimestamps(doc.data()),
      }));
      dispatch(fetchProduct(data));
    } catch (err) {
      console.log(err);
      dispatch(setError(err?.message || "Failed to fetch products"));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

// ===== Review moderation thunks =====
export function addReview(productId, review) {
  return async function addReviewThunk(dispatch) {
    try {
      const docRef = doc(db, "products", productId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Product not found");
      const data = snap.data() || {};
      const reviews = Array.isArray(data.reviews) ? data.reviews.slice() : [];
      reviews.unshift(review);
      await updateDoc(docRef, { reviews, updatedAt: serverTimestamp() });
      const fresh = await getDoc(docRef);
      dispatch(updateOne({ id: productId, ...fresh.data() }));
    } catch (err) {
      console.error("Failed to add review", err);
      dispatch(setError(err?.message || "Failed to add review"));
    }
  };
}

export function deleteReview(productId, reviewId) {
  return async function deleteReviewThunk(dispatch) {
    try {
      const docRef = doc(db, "products", productId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Product not found");
      const data = snap.data() || {};
      const reviews = Array.isArray(data.reviews) ? data.reviews.filter(r => r.id !== reviewId) : [];
      await updateDoc(docRef, { reviews, updatedAt: serverTimestamp() });
      const fresh = await getDoc(docRef);
      dispatch(updateOne({ id: productId, ...fresh.data() }));
    } catch (err) {
      console.error("Failed to delete review", err);
      dispatch(setError(err?.message || "Failed to delete review"));
    }
  };
}

export function setReviewApproval(productId, reviewId, approved) {
  return async function setReviewApprovalThunk(dispatch) {
    try {
      const docRef = doc(db, "products", productId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Product not found");
      const data = snap.data() || {};
      const reviews = Array.isArray(data.reviews) ? data.reviews.map(r => r.id === reviewId ? { ...r, approved } : r) : [];
      await updateDoc(docRef, { reviews, updatedAt: serverTimestamp() });
      const fresh = await getDoc(docRef);
      dispatch(updateOne({ id: productId, ...fresh.data() }));
    } catch (err) {
      console.error("Failed to update review approval", err);
      dispatch(setError(err?.message || "Failed to update review approval"));
    }
  };
}