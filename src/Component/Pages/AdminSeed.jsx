import { useState } from "react";
import { db } from "../../firebase/config";
import { collection, writeBatch, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { auth } from "../../firebase/config";
import { signInAnonymously } from "firebase/auth";
import { products } from "../../data/products";
import { categories } from "../../data/categories";
import { sliderData } from "../../data/slider";

export default function AdminSeed() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const seedAll = async () => {
    try {
      setLoading(true);
      setStatus("Seeding Firestore...");

      // Ensure we are authenticated if rules require auth (anonymous sign-in)
      try {
        await signInAnonymously(auth);
      } catch (_) {
        // ignore if already signed in or anonymous disabled
      }

      // Quick diagnostic write to verify rules/auth/config
      try {
        await addDoc(collection(db, "diagnostics"), {
          createdAt: serverTimestamp(),
          note: "seed-check",
        });
      } catch (err) {
        const msg = err?.message || String(err);
        setStatus("Diagnostic write failed: " + msg);
        setLoading(false);
        return;
      }

      // Seed categories
      const catBatch = writeBatch(db);
      const catsRef = collection(db, "categories");
      categories.forEach((c, idx) => {
        const ref = doc(catsRef);
        catBatch.set(ref, { name: c.name, slug: c.slug, order: idx + 1 });
      });
      await catBatch.commit();

      // Seed products
      const prodBatch = writeBatch(db);
      const prodRef = collection(db, "products");
      products.forEach((p) => {
        const ref = doc(prodRef);
        prodBatch.set(ref, {
          title: p.title,
          price: Number(p.price),
          description: p.description || "",
          images: Array.isArray(p.images) ? p.images : [p?.image].filter(Boolean),
          category: p?.category?.slug || p?.category || "",
          createdAt: serverTimestamp(),
          rating: p.rating || 4.5,
          reviews: p.reviews || [],
          shipping: p.shipping || {},
          tags: p.tags || [],
          sku: p.sku || String(p.id),
          inStock: p.inStock ?? true,
        });
      });
      await prodBatch.commit();

      // Seed sliders
      const sliderBatch = writeBatch(db);
      const sliderRef = collection(db, "sliders");
      sliderData.forEach((s, idx) => {
        const ref = doc(sliderRef);
        sliderBatch.set(ref, {
          src: s.src,
          link: s.link || "#",
          alt: s.alt || "",
          title: s.title || "",
          order: idx + 1,
          active: true, // Default to active
          createdAt: serverTimestamp(),
        });
      });
      await sliderBatch.commit();

      setStatus("Done! Data uploaded to Firestore. You can remove this page now.");
    } catch (e) {
      try {
        const details = e?.message || e?.code || JSON.stringify(e);
        setStatus("Error: " + details);
      } catch (_) {
        setStatus("Error: " + String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Seed</h1>
      <p className="mb-4 text-gray-600">This uploads local mock categories, products, and slider into Firestore once.</p>
      <button
        disabled={loading}
        onClick={seedAll}
        className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50 hover:cursor-pointer"
      >
        {loading ? "Seeding..." : "Seed Firestore"}
      </button>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}


