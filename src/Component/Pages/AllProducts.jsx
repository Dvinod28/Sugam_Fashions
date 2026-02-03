import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getProduct } from "../../Redux/Product/ProductSlice";
import { add as addToCart } from "../../Redux/Cart/CartSlice";
import { FaBagShopping, FaCartShopping } from "react-icons/fa6";
import { IoIosCart, IoMdAdd } from "react-icons/io";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { motion } from "framer-motion";
import { toggleWishlist as toggleWishlistAction } from "../../Redux/Wishlist/WishlistSlice";

function AllProducts() {
  const dispatch = useDispatch();
  const { data: products } = useSelector((state) => state.product);
  const wishlist = useSelector((state) => state.wishlist || []);
  const [favorites, setFavorites] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(getProduct());
    }
  }, [dispatch, products]);

  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? products : [];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    // removed misplaced toggleWishlist from inside memo
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
  }, [products, searchQuery, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.06, when: "beforeChildren" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const handleToggleWishlist = (product) => {
    if (!product) return;
    const payload = {
      id: product.id,
      title: product.title || product.name,
      price: product.price,
      images:
        product.images && typeof product.images === "object"
          ? Object.values(product.images)
          : Array.isArray(product.images)
          ? product.images
          : [product?.images || product?.image].filter(Boolean),
      description: product.description,
    };
    dispatch(toggleWishlistAction(payload));
  };

  const isInWishlist = (productId) => {
    return (wishlist || []).some((w) => String(w.id) === String(productId));
  };

  const handleAddToCart = (product) => {
    const images = Array.isArray(product.images)
      ? product.images
      : [product?.images || product?.image].filter(Boolean);

    const payload = {
      id: product.id,
      title: product.title,
      price: product.price,
      images,
      description: product.description,
    };
    dispatch(addToCart(payload));
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Products
          </h2>
          <hr className="border-t-2 border-pink-500 w-20 md:w-30 mx-auto mb-4" />
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our complete collection of products
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/3"
          >
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/4"
          >
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option disabled value="relevance">
                Sort by: Relevance
              </option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </motion.div>
        </div>

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8"
          >
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ translateY: -6 }}
                className="group relative bg-white rounded overflow-hidden"
              >
                <div className="overflow-hidden transition-shadow duration-300">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        className="overflow-hidden"
                      >
                        <img
                          className="w-full h-56 md:h-64 object-cover object-top transition-transform duration-300"
                          src={
                            (() => {
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
                            })() || "/images/img-1.jpg"
                          }
                          alt={product.title}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/600x800?text=No+Image";
                          }}
                        />
                      </motion.div>
                    </Link>
                  </div>
                </div>

                <div className="mt-2 p-2">
                  <h3 className="text-sm md:text-base font-medium text-gray-900">
                    {product.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-pink-600 text-lg font-bold mt-1">
                    ₹{product.price}
                  </p>
                </div>

                <div className="flex items-center mt-2 gap-2 p-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAddToCart(product)}
                    className="bg-pink-500 text-white rounded px-3 py-2 flex items-center gap-2 transition-colors duration-200"
                    title="Add to cart"
                  >
                    <span className="text-sm md:text-base">Add To Cart</span>
                    <IoIosCart className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    className="cursor-pointer p-2 flex items-center justify-center transition-colors duration-200"
                    onClick={() => handleToggleWishlist(product)}
                    title={
                      isInWishlist(product.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    {isInWishlist(product.id) ? (
                      <FaHeart className="w-7 h-7 text-pink-500" />
                    ) : (
                      <FaRegHeart className="w-7 h-7 text-gray-700 hover:text-pink-500" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AllProducts;
