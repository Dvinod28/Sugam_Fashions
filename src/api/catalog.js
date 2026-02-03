import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

export async function getCategories() {
  const ref = collection(db, "categories");
  const q = query(ref, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSliders() {
  const ref = collection(db, "sliders");
  const q = query(ref, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createSlider(sliderData) {
  try {
    const ref = collection(db, "sliders");
    const newDocRef = doc(ref);
    const newSlider = {
      ...sliderData,
      id: newDocRef.id,
      createdAt: new Date().toISOString(),
      order: sliderData.order || 0,
      active: sliderData.active !== false, // default to true
    };
    await setDoc(newDocRef, newSlider);
    return newSlider;
  } catch (error) {
    console.error("Error creating slider:", error);
    throw error;
  }
}

export async function updateSlider(sliderId, sliderData) {
  try {
    const sliderRef = doc(db, "sliders", sliderId);
    await updateDoc(sliderRef, sliderData);
    return { id: sliderId, ...sliderData };
  } catch (error) {
    console.error("Error updating slider:", error);
    throw error;
  }
}

export async function deleteSlider(sliderId) {
  try {
    await deleteDoc(doc(db, "sliders", sliderId));
    return sliderId;
  } catch (error) {
    console.error("Error deleting slider:", error);
    throw error;
  }
}

export async function reorderSliders(sliders) {
  try {
    const batch = [];
    sliders.forEach((slider, index) => {
      const sliderRef = doc(db, "sliders", slider.id);
      batch.push(updateDoc(sliderRef, { order: index }));
    });
    await Promise.all(batch);
    return sliders;
  } catch (error) {
    console.error("Error reordering sliders:", error);
    throw error;
  }
}


