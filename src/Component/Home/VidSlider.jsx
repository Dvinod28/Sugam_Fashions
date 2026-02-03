import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProduct } from "../../Redux/Product/ProductSlice";

function VidSlider() {
  const dispatch = useDispatch();
  const productsState = useSelector((state) => state.product.data) || [];
  const videoPool = [
    "/videos/vid-1.mp4",
    "/videos/vid-2.mp4",
    "/videos/vid-3.mp4",
    "/videos/vid-4.mp4",
    "/videos/vid-5.mp4",
    "/videos/vid-6.mp4",
    "/videos/vid-7.mp4",
  ];
  useEffect(() => {
    if (!productsState || productsState.length === 0) {
      dispatch(getProduct());
    }
  }, [dispatch, productsState]);

  const products = useMemo(() => {
    return (productsState || [])
      .slice(0, 10)
      .map((p, idx) => {
        // Handle different image formats properly
        let thumbnail = "/images/img-1.jpg"; // default fallback
        
        if (p.images) {
          if (typeof p.images === 'object' && !Array.isArray(p.images)) {
            // If images is an object (like from Firebase), get the first value
            const imageValues = Object.values(p.images);
            thumbnail = imageValues[0] || "/images/img-1.jpg";
          } else if (Array.isArray(p.images)) {
            // If images is an array
            thumbnail = p.images[0] || "/images/img-1.jpg";
          } else if (typeof p.images === 'string') {
            // If images is a single string
            thumbnail = p.images;
          }
        } else if (p.image) {
          thumbnail = p.image;
        }
        
        return {
          id: p.id,
          name: p.title,
          price: `₹ ${p.price}`,
          video: videoPool[idx % videoPool.length],
          thumbnail: thumbnail,
        };
      });
  }, [productsState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState({});
  const sliderRef = useRef(null);

  const scrollToIndex = (index) => {
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.children[0].offsetWidth;
      const gap = 16; // gap-4 = 16px
      const scrollPosition = index * (cardWidth + gap);
      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    const nextIndex =
      currentIndex + 1 >= products.length ? 0 : currentIndex + 1;
    scrollToIndex(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex =
      currentIndex - 1 < 0 ? products.length - 1 : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };
  return (
    <>
      <div className="max-w-7xl mx-auto pt-8">
        <div className="relative w-full">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-[0px] md:left-[-0px] lg:left-[-25px] top-1/2 -translate-y-1/2 z-10 bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-[-0px] md:right-[-0px] lg:right-[-25px] top-1/2 -translate-y-1/2 z-10 bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 hover:cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6" />
          </button>

          {/* Slider Container */}
          <div className="overflow-hidden overflow-x-hidden">
            <div
              ref={sliderRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4 sm:py-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex-none w-64 sm:w-72 md:w-80 lg:w-62 hover:scale-102 transition-all duration-200 px-4 md:px-6 lg:px-0"
                >
                  <div className="bg-white overflow-hidden hover:shadow-sm hover:shadow-pink-200 transition-shadow duration-300 rounded-md">
                    <div className="relative group">
                      <video
                        className="w-full h-78 sm:h-78 md:h-80 lg:h-96 object-cover"
                        poster={product.thumbnail}
                        muted
                        loop
                        autoPlay
                        playsInline
                      >
                        <source src={product.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <button
                            onClick={() => toggleFavorite(product.id)}
                            className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors duration-200"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favorites[product.id]
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Brand Logo Overlay */}
                      <div className="absolute top-4 left-4 bg-white/90 px-2 py-1 rounded-md flex items-center gap-2">
                        <Star className="w-3 h-3 text-pink-600" />
                        <h2 className="text-md font-semibold text-pink-600 uppercase">
                          Sugam
                        </h2>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3 bg-pink-50/80">
                      <div className="flex items-start gap-3">
                        <div className="flex-none">
                          <Link to={`/product/${product.id}`}>
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              loading="lazy"
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = "/images/img-1.jpg";
                              }}
                            />
                          </Link>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${product.id}`}>
                            <h3 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-pink-600">
                              {product.price}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default VidSlider;
