import { useRef, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MdArrowOutward } from "react-icons/md";
import { getProduct } from "../../Redux/Product/ProductSlice";
import { FaCartPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import { motion } from "framer-motion";
import { toggleWishlist } from "../../Redux/Wishlist/WishlistSlice";
import { RiPriceTag3Fill } from "react-icons/ri";
import ProductCartAction from "../Common/ProductCartAction";

function NewArraival() {
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

  const data = useMemo(() => {
    return (products || []).slice(0, 6).map((p) => {
      // Calculate offer if there's a discount price
      let offer = null;
      if (p.originalPrice && p.price < p.originalPrice) {
        const discount = Math.round(
          ((p.originalPrice - p.price) / p.originalPrice) * 100
        );
        offer = `${discount}% OFF`;
      }

      // Handle images properly - check for object type and extract values
      let primaryImage = "/images/img-1.jpg";
      let hoverImage = "/images/img-1.jpg";
      
      if (p.images) {
        if (typeof p.images === 'object' && !Array.isArray(p.images)) {
          // If images is an object (like from Firebase), get the first value
          const imageValues = Object.values(p.images);
          primaryImage = imageValues[0] || primaryImage;
          hoverImage = imageValues[1] || imageValues[0] || primaryImage;
        } else if (Array.isArray(p.images)) {
          // If images is an array
          primaryImage = p.images[0] || primaryImage;
          hoverImage = p.images[1] || p.images[0] || primaryImage;
        } else if (typeof p.images === 'string') {
          // If images is a single string
          primaryImage = p.images;
          hoverImage = p.images;
        }
      } else if (p.image) {
        primaryImage = p.image;
        hoverImage = p.image;
      }

      return {
        id: p.id,
        img: primaryImage,
        hover: hoverImage,
        name: p.title,
        price: `₹${p.price}`,
        originalPrice: p.originalPrice ? `₹${p.originalPrice}` : null,
        offer,
        description:
          p.description.length > 80
            ? p.description.slice(0, 80) + "..."
            : p.description,
        full: { ...p, offer },
      };
    });
  }, [products]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
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
      },
    },
  };

  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl lg:text-4xl font-semibold uppercase text-black mb-4 text-center"
        >
          New Arrivals
        </motion.h2>
        {/* Decorative Line */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 mb-8 md:mb-12"
        >
          <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
          <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
          <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
        </motion.div>
        <div className="overflow-hidden">
          <motion.div
            ref={sliderRef}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          >
            {data.map((product, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="flex flex-col transition-all duration-300"
              >
                <div className="relative overflow-hidden group">
                  <Link to={`/product/${product.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <img
                        className="w-full h-56 md:h-72 lg:h-80 object-cover object-center transition-transform duration-300"
                        src={product.img || "/images/img-1.jpg"}
                        alt={product.name}
                        loading="lazy"
                      />
                    </motion.div>
                  </Link>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className=" transition-opacity duration-300"
                  />
                  {/* Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      dispatch(toggleWishlist(product.full));
                    }}
                    className={`absolute top-3 right-2 p-2 rounded-full shadow-md z-10 cursor-pointer transition-colors duration-200
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
                <div className="p-2 flex-grow flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h4 className="text-lg font-semibold mb-1 hover:text-pink-600 transition-colors duration-200">
                        {product.name}
                      </h4>
                    </Link>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
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
                    <ProductCartAction
                      product={product.full}
                      openDrawerOnAdd={true}
                      addLabel="Add to Cart"
                      addIcon={<FaCartPlus className="w-6 h-6 ms-1" />}
                      addButtonClassName="px-6 py-2 text-lg font-semibold rounded-full shadow-sm cursor-pointer border border-pink-500 bg-pink-100 text-pink-500 hover:bg-pink-200"
                      controlsWrapperClassName="flex-wrap"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
        </div>
      </motion.div>
      <hr className="my-8 text-pink-500" />
    </>
  );
}
export default NewArraival;
