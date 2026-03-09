import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProduct } from "../../Redux/Product/ProductSlice";
import { getAllProducts } from "../../data/products";
import { FaCartShopping } from "react-icons/fa6";
import { motion } from "framer-motion";
import ProductCartAction from "../Common/ProductCartAction";

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: products } = useSelector((state) => state.product);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(getProduct());
    }
  }, [dispatch, products]);

  const normalizedCategory = (category || "").toLowerCase();

  const filtered = useMemo(() => {
    const apiList = Array.isArray(products) ? products : [];
    const localList = getAllProducts();

    const byCategory = (list) => {
      if (!normalizedCategory) return list;
      return list.filter((p) => {
        const catName = (
          p?.category?.name ||
          p?.categoryName ||
          (typeof p?.category === "string" ? p.category : "") ||
          ""
        ).toLowerCase();
        const catSlug = (
          p?.category?.slug ||
          p?.categorySlug ||
          (typeof p?.category === "string" ? p.category : "") ||
          ""
        ).toLowerCase();
        return (
          catSlug === normalizedCategory || catName.includes(normalizedCategory)
        );
      });
    };

    // Prefer API results if they contain items for this category; otherwise fallback to local products
    let list = byCategory(apiList);
    if (list.length === 0) list = byCategory(localList);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        list = [...list].sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;
      default:
        break;
    }

    return list;
  }, [products, normalizedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm mb-4"
        aria-label="Breadcrumb"
      >
        <ol className="list-reset flex text-gray-500">
          <li>
            <button
              className="text-pink-600 hover:underline"
              onClick={() => navigate("/")}
            >
              Home
            </button>
          </li>
          <li className="mx-2">/</li>
          <li className="text-gray-700 font-medium">{category || "All"}</li>
        </ol>
      </motion.nav>

      {/* Header + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl md:text-2xl font-bold text-gray-800 uppercase"
        >
          {category ? `${category} Collection` : "All Products"}
        </motion.h2>
        <div className="flex itens-center gap-3 w-full md:w-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 sm:flex-initial"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full border-2 border-pink-300 focus:border-pink-600 rounded-md px-3 py-1 md:py-2 outline-none"
            />
          </motion.div>
          <motion.select
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-2 border-pink-300 rounded-md px-1 md:px-3 py-1 md:py-2 text-xs md:text-sm outline-none"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </motion.select>
        </div>
      </div>

      {/* Results Count */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm text-gray-600 mb-4"
      >
        {filtered.length} items
      </motion.p>

      {/* Product Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {filtered.map((product) => {
          const imageSrc = (() => {
            if (product.images) {
              if (typeof product.images === 'object' && !Array.isArray(product.images)) {
                // If images is an object (like from Firebase), get the first value
                const imageValues = Object.values(product.images);
                return imageValues[0] || "/images/img-1.jpg";
              } else if (Array.isArray(product.images)) {
                // If images is an array
                return product.images[0] || "/images/img-1.jpg";
              } else if (typeof product.images === 'string') {
                // If images is a single string
                return product.images;
              }
            } else if (product.image) {
              return product.image;
            }
            return "/images/img-1.jpg";
          })();
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              key={product.id}
              className="bg-white border-2 border-pink-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="bg-pink-50">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={imageSrc}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-40 md:h-48 object-cover"
                  />
                </Link>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-sm md:text-base font-semibold line-clamp-2">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <span className="text-pink-700 font-bold">
                    ₹{product.price}
                  </span>
                  <ProductCartAction
                    product={product}
                    openDrawerOnAdd={false}
                    addLabel="Add to Cart"
                    addIcon={<FaCartShopping className="me-1 md:me-2" />}
                    addButtonClassName="text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-full mt-2 md:mt-0"
                    controlsWrapperClassName="mt-2 md:mt-0 flex-wrap"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default CategoryPage;
