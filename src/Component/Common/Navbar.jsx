import React, { useState, useEffect, useRef } from "react";
import { HiMenu, HiX, HiSearch, HiOutlineShoppingBag } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../../api/catalog";
import { BiUser } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { FaMicrophone, FaMicrophoneSlash, FaCamera } from "react-icons/fa";


function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSaleText, setCurrentSaleText] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  async function extractColorKeyword(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const w = 80;
          const h = 80;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 64) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (count === 0) {
            URL.revokeObjectURL(url);
            resolve("");
            return;
          }
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const keyword = mapRgbToColorName(r, g, b);
          URL.revokeObjectURL(url);
          resolve(keyword);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function mapRgbToColorName(r, g, b) {
    const named = [
      { name: "black", rgb: [0, 0, 0] },
      { name: "white", rgb: [255, 255, 255] },
      { name: "gray", rgb: [128, 128, 128] },
      { name: "red", rgb: [220, 20, 60] },
      { name: "pink", rgb: [255, 105, 180] },
      { name: "orange", rgb: [255, 140, 0] },
      { name: "yellow", rgb: [255, 215, 0] },
      { name: "green", rgb: [34, 139, 34] },
      { name: "blue", rgb: [65, 105, 225] },
      { name: "purple", rgb: [138, 43, 226] },
      { name: "brown", rgb: [139, 69, 19] },
      { name: "beige", rgb: [245, 245, 220] },
    ];
    let best = "";
    let bestDist = Infinity;
    for (const c of named) {
      const dr = r - c.rgb[0];
      const dg = g - c.rgb[1];
      const db = b - c.rgb[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        best = c.name;
        bestDist = dist;
      }
    }
    return best;
  }

  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      setIsCameraOpen(true);
      fileInputRef.current?.click();
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback to file input if camera access fails
      fileInputRef.current?.click();
    }
  };


  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      extractColorKeyword(file)
        .then((keyword) => {
          const q = keyword && typeof keyword === "string" ? keyword : "";
          if (q) {
            setIsSearchOpen(false);
            setSearchQuery("");
            navigate(`/search?q=${encodeURIComponent(q)}`);
          } else {
            navigate("/search?q=");
          }
        })
        .catch(() => {
          navigate("/search?q=");
        });
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Voice search functionality
  const startListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    // Check if browser supports speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Your browser doesn't support voice search. Please try Chrome or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      // Auto-submit search after voice recognition completes
      setTimeout(() => {
        if (transcript.trim()) {
          navigate(`/search?q=${encodeURIComponent(transcript.trim())}`);
          setIsSearchOpen(false);
        }
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const saleTexts = [
    "🔥 Flash Sale! Up to 40% OFF on Selected Items",
    "💎 Free Shipping on Orders Over ₹500",
    "⚡ Limited Time: Buy 2 Get 1 FREE",
    "🎉 New Arrivals - Shop the Latest Trends",
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !event.target.closest(".mobile-menu") &&
        !event.target.closest(".menu-button")
      ) {
        setIsMobileMenuOpen(false);
      }

      if (
        isSearchOpen &&
        !event.target.closest(".search-container") &&
        !event.target.closest(".search-button")
      ) {
        setIsSearchOpen(false);
        setIsListening(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, isSearchOpen]);

  // Sale text animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSaleText((prev) => (prev + 1) % saleTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [saleTexts.length]);

  const [navLinks, setNavLinks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        const catLinks = cats.map((c) => ({
          name: c.name,
          type: "category",
          slug: c.slug || (c.name || "").toLowerCase().replace(/\s+/g, "-"),
        }));
        setNavLinks([
          ...catLinks,
          { name: "About", type: "page", path: "/about" },
          { name: "Contact", type: "page", path: "/contact" },
        ]);
      } catch (e) {
        setNavLinks([
          { name: "About", type: "page", path: "/about" },
          { name: "Contact", type: "page", path: "/contact" },
        ]);
      }
    })();
  }, []);

  return (
    <nav
      className={`sticky top-0 left-0 text-white right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-pink-100/80 backdrop-blur-md shadow-lg border-b border-border"
          : "bg-pink-200/100 backdrop-blur-sm pb-5"
      }`}
    >
      {/* Animated Sale Banner */}
      <div className="bg-pink-500 w-full h-6 md:h-6 lg:h-8 text-center overflow-hidden relative transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSaleText}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center h-full text-white font-semibold text-[12px] md:text-base lg:text-sm"
          >
            {saleTexts[currentSaleText]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Left Section - Search and User */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to={(() => {
                if (!isAuthenticated) return "/login";
                const role = currentUser?.role;
                if (role === "admin") return "/admin";
                if (role === "thread_work") return "/production/thread-work";
                if (role === "rd_department") return "/production/rd-department";
                return "/user";
              })()}
              className="text-black hover:text-pink-500 p-2 transition-all duration-200 transform hover:scale-105"
            >
              <BiUser className="h-6 w-6" />
            </Link>
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 100);
              }}
              className="text-black hover:text-pink-500 p-2 transition-all duration-200 transform hover:scale-105 search-button"
            >
              <HiSearch className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Left Section - Toggle Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-black hover:text-pink-500 p-2 rounded-md transition-all duration-200 transform hover:scale-105"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <HiX className="h-6 w-6" />
              ) : (
                <HiMenu className="h-6 w-6" />
              )}
            </motion.button>
          </div>

          {/* Logo Section - Perfectly Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-1 md:mt-4">
            <Link to={"/"}>
              <motion.div
                className="flex items-center group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <img
                    src="/images/logo.png"
                    className="w-full h-15 p-2 sm:h-10 md:w-full md:h-21 object-contain"
                    alt="Logo"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Right Section - Cart (Desktop) and Cart (Mobile) */}
          <div className="flex items-center">
            {/* Cart Button - Always visible */}
            <Link to="/cart">
              <motion.p
                className="text-black hover:text-pink-500 p-2 transition-all duration-200 transform hover:scale-105 relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <HiOutlineShoppingBag className="h-6 w-6 transition-transform duration-200" />
                {/* {productCart.length > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {productCart.length}
                </motion.span>
              )} */}
              </motion.p>
            </Link>
          </div>
        </div>
        {/* Desktop Categories */}
        <div className="hidden md:block pb-1 pt-3">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 lg:space-x-4">
            {navLinks.map((link, index) => (
              <div
                key={index}
                onClick={() => {
                  if (link.type === "page") {
                    navigate(link.path);
                  } else {
                    const slug =
                      link.slug ||
                      (link.name || "").toLowerCase().replace(/\s+/g, "-");
                    navigate(`/category/${slug}`);
                  }
                }}
                className="text-black hover:text-pink-500 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:bg-pink-100/50 hover:border hover:border-pink-500 rounded-md hover:cursor-pointer"
              >
                {link.name}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              // Close menu when clicking on the background
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false);
              }
            }}
          >
            <div className="px-3 pt-4 pb-4 space-y-1 bg-gradient-to-br from-pink-100/95 to-pink-200/95 backdrop-blur-md rounded-xl mt-2 border border-pink-300 shadow-xl">
              {/* Mobile Categories */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      className="w-full text-black hover:text-pink-600 hover:bg-pink-200 block px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 text-center shadow-sm hover:shadow-md transform hover:scale-105"
                      onClick={() => {
                        if (link.type === "page") {
                          navigate(link.path);
                        } else {
                          const slug = (link.name || "")
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                          navigate(`/category/${slug}`);
                        }
                        // Ensure mobile menu closes when clicking on menu items
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {link.name}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Mobile Action Buttons */}
              <div className="border-t border-pink-300 pt-4 space-y-3">
                <motion.div
                  className="flex items-center space-x-3 px-3 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => {
                      setIsSearchOpen(true);
                      setIsMobileMenuOpen(false);
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                      }, 100);
                    }}
                    className="flex-1 justify-start text-black hover:text-pink-600 hover:bg-pink-200 flex items-center p-3 rounded-lg transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                  >
                    <HiSearch className="h-5 w-5 mr-3" />
                    Search Products
                  </button>
                </motion.div>
                <motion.div
                  className="flex items-center space-x-3 px-3 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link
                    to={(() => {
                      if (!isAuthenticated) return "/login";
                      const role = currentUser?.role;
                      if (role === "admin") return "/admin";
                      if (role === "thread_work") return "/production/thread-work";
                      if (role === "rd_department") return "/production/rd-department";
                      return "/user";
                    })()}
                    className="flex-1 justify-start text-black hover:text-pink-600 hover:bg-pink-200 flex items-center p-3 rounded-lg transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BiUser className="h-5 w-5 mr-3" />
                    {isAuthenticated ? "My Account" : "Login"}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Modal */}
        {isSearchOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden search-container"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex text-black items-center border-b border-gray-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full px-6 py-4 text-lg focus:outline-none"
                  />
                  <div className="flex items-center pr-4">
                    <button
                      type="button"
                      onClick={startListening}
                      className={`p-2 rounded-full mr-2 ${
                        isListening
                          ? "text-pink-500 bg-pink-100"
                          : "text-gray-500 hover:text-pink-500"
                      }`}
                    >
                      {isListening ? (
                        <FaMicrophone className="h-5 w-5" />
                      ) : (
                        <FaMicrophoneSlash className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      className="p-2 rounded-full mr-2 text-gray-500 hover:text-pink-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="submit"
                      className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600"
                    >
                      <HiSearch className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </form>
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">
                  {isListening
                    ? "Listening... Speak now"
                    : "Click the microphone icon to search with your voice"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    Lehengas
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    Sarees
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    New Arrivals
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    Trending
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
