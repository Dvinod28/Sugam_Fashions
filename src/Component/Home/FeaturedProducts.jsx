import { useRef, useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { add } from "../../Redux/Cart/CartSlice";
import { MdArrowOutward } from "react-icons/md";
import { getProduct } from "../../Redux/Product/ProductSlice";
import { FaCartPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import { RiPriceTag3Fill } from "react-icons/ri";
import { motion } from "framer-motion";
import { toggleWishlist } from "../../Redux/Wishlist/WishlistSlice";

function FeaturedProducts() {
  const [favorites, setFavorites] = useState({});
  const sliderRef = useRef(null);
  const dispatch = useDispatch();
  const products = useSelector((state) => state.product.data) || [];
  const wishlist = useSelector((state) => state.wishlist.items) || [];

  const isInWishlist = (productId) =>
    wishlist.some((item) => item.id === productId);

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(getProduct());
    }
  }, [dispatch, products]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const getImage = (imageData) => {
    if (!imageData) return "/images/img-1.jpg"; // Local default image
    
    if (Array.isArray(imageData)) {
      // If images is an array (like ["/images/saree-1.png", "/images/model-3.png"])
      return imageData[0] || "/images/img-1.jpg";
    } else if (typeof imageData === 'object' && !Array.isArray(imageData)) {
      // If images is an object (like from Firebase), get the first value
      const imageValues = Object.values(imageData);
      return imageValues[0] || "/images/img-1.jpg";
    } else if (typeof imageData === 'string') {
      // If images is a single string
      return imageData;
    }
    return "/images/img-1.jpg"; // Local default image
  };

  const featuredProducts = useMemo(() => {
    console.log("=== DEBUG: Available products:", products);
    
    if (!products || products.length === 0) {
      console.log("=== DEBUG: No products available");
      return [];
    }
    
    // Get products that are marked as featured or have offers, or get random products
    const featured = products
      .filter((p) => p && p.price > 0)
      .sort((a, b) => {
        // Prioritize products with offers, then by price (lower first)
        if (a.offer && !b.offer) return -1;
        if (!a.offer && b.offer) return 1;
        return a.price - b.price;
      })
      .slice(0, 8)
      .map((p) => {
        const primaryImage = getImage(p.images) || getImage(p.image);
        const hoverImage = getImage(p.images) || getImage(p.image);

        console.log(`=== DEBUG: Product: ${p.title}`);
        console.log(`=== DEBUG: Images field:`, p.images);
        console.log(`=== DEBUG: Image field:`, p.image);
        console.log(`=== DEBUG: Final primary image:`, primaryImage);
        console.log(`=== DEBUG: Final hover image:`, hoverImage);

        return {
          id: p.id,
          img: primaryImage,
          hover: hoverImage,
          name: p.title,
          price: `₹${p.price}`,
          originalPrice: p.originalPrice ? `₹${p.originalPrice}` : null,
          description:
            p.description && p.description.length > 80
              ? p.description.slice(0, 80) + "..."
              : p.description || "No description available",
          full: p,
        };
      });
    console.log("=== DEBUG: Featured products final:", featured);
    return featured;
  }, [products]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="max-w-7xl mx-auto p-6 py-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4 uppercase">
            Featured Products
          </h2>
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
            <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
            <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
          </div>
        </motion.div>

        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-colors duration-200"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-colors duration-200"
          >
            ›
          </button>

          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="flex-none w-72 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative overflow-hidden group">
                  <Link to={`/product/${product.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <img
                        className="w-full h-56 md:h-72 object-cover object-center transition-transform duration-300"
                        src={product.img || "https://via.placeholder.com/300x400?text=No+Image"}
                        alt={product.name}
                        loading="lazy"
                        onLoad={() => console.log(`Image loaded successfully: ${product.img}`)}
                        onError={(e) => {
                          console.log(`Image failed to load: ${product.img}`);
                          e.target.src = "https://via.placeholder.com/300x400?text=No+Image";
                        }}
                      />
                    </motion.div>
                  </Link>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="duration-300"
                  />
                  {/* Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      dispatch(toggleWishlist(product.full));
                    }}
                    className={`absolute top-3 right-2 p-2 rounded-full shadow-md z-10 transition-colors duration-200
                      ${
                        isInWishlist(product.id)
                          ? "bg-pink-500"
                          : "bg-pink-100/70 hover:bg-pink-200"
                      }
                    `}
                  >
                    {isInWishlist(product.id) ? (
                      <FaHeart className="w-5 h-5 text-white" />
                    ) : (
                      <FaRegHeart className="w-5 h-5 text-pink-500" />
                    )}
                  </motion.button>
                  {/* Offer Tag */}
                  {product.full.offer && (
                    <motion.div
                      initial={{ x: -100 }}
                      animate={{ x: 0 }}
                      className="absolute top-2 left-2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-md"
                    >
                      <RiPriceTag3Fill className="w-4 h-4" />
                      <span>{product.full.offer}</span>
                    </motion.div>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h4 className="text-lg font-semibold mb-2 hover:text-pink-600 transition-colors duration-200">
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <p className="text-pink-600 text-lg md:text-xl font-bold">
                        {product.price}
                      </p>
                      {product.originalPrice && (
                        <p className="text-gray-500 text-sm line-through">
                          {product.originalPrice}
                        </p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        toggleFavorite(product.id);
                        const payload = {
                          id: product.full.id,
                          title: product.full.title,
                          price: product.full.price,
                          images: product.full.images,
                          description: product.full.description,
                        };
                        dispatch(add({ ...payload, openDrawer: true }));
                      }}
                      className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-center ${
                        favorites[product.id]
                          ? "bg-pink-500 text-white hover:bg-pink-600"
                          : "bg-pink-100 text-pink-500 hover:bg-pink-200 border border-pink-500"
                      }`}
                    >
                      Add to Cart <FaCartPlus className="w-4 h-4 ms-1" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-8"
        >
          <Link to="/products">
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "#fff",
                color: "#ec4899",
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-pink-500 mt-6 text-sm md:text-md lg:text-lg text-white px-5 py-2 rounded flex items-center hover:bg-pink-100 hover:text-pink-500 hover:border-1 hover:border-pink-500 hover:cursor-pointer mx-auto transition-all duration-300 mb-1"
            >
              <h2 className="font-bold uppercase">View All Products</h2>
              <MdArrowOutward className="w-5 h-5 ms-2" />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
      <hr className="my-8 text-pink-500" />
    </>
  );
}

export default FeaturedProducts;