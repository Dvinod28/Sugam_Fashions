import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCategories } from "../../api/catalog";
import { motion } from "framer-motion";

function ShopbyCollection() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const c = await getCategories();
        setCats(c);
      } catch (e) {
        setCats([]);
      }
    })();
  }, []);
  const images = [
    "images/shop-by-catogory.png",
    "images/shop-by-catogory-1.png",
    "images/shop-by-catogory-2.png",
    "images/shop-by-catogory-3.png",
  ];
  const data = (cats || []).map((c, idx) => ({
    img: images[idx % images.length],
    heading: c.name,
    slug: c.slug || (c.name || "").toLowerCase().replace(/\s+/g, "-"),
  }));
  return (
    <>
      <div className="max-w-7xl mx-auto p-6 py-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4 uppercase"
        >
          Shop by Collection
        </motion.h2>
        {/* Decorative Line */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
          <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
          <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10"
        >
          {data.map((item, i) => (
            <Link key={i} to={`/category/${item.slug}`}>
              <div className="relative group cursor-pointer">
                <img
                  src={item.img}
                  className="w-full h-56 md:h-72 lg:h-80 object-cover"
                  alt={item.heading}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-pink-600/10 backdrop-blur-sm bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                  <h2 className="text-white text-base md:text-xl font-bold text-center leading-snug px-2">
                    {item.heading}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </>
  );
}
export default ShopbyCollection;
