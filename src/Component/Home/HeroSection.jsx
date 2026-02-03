import { HiChevronDoubleDown } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../../api/catalog";
import { motion, AnimatePresence } from "framer-motion";

function HeroSection() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const sectionRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const [images] = useState([
    "images/img-6.JPG",
    "images/img-1.jpg",
    "images/img-9.jpg",
    "images/img-5.jpg",
    "images/img-8.jpg",
  ]);
  const [data, setData] = useState([]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        const mapped = cats.slice(0, 5).map((c, idx) => ({
          img: images[idx % images.length],
          heading: c.name,
          slug: c.slug || (c.name || "").toLowerCase().replace(/\s+/g, "-"),
        }));
        setData(mapped);
      } catch (e) {
        setData([]);
      }
    })();
  }, [images]);

  const handleDragStart = (e) => {
    setIsDragging(true);
    setStartX(e.type === "mousedown" ? e.pageX : e.touches[0].pageX);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const x = e.type === "mousemove" ? e.pageX : e.touches[0].pageX;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByItem = (direction = 1) => {
    const container = sliderRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <motion.div
        ref={sectionRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="max-w-7xl mx-auto pt-6"
      >
        {/* Mobile slider */}
        <div className="md:hidden px-3 relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous"
            onClick={() => scrollByItem(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-pink-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow hover:bg-pink-700"
          >
            ‹
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next"
            onClick={() => scrollByItem(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-pink-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow hover:bg-pink-700"
          >
            ›
          </motion.button>
          <div
            ref={sliderRef}
            className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {data.map((items, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="min-w-[30%] snap-start transition-all duration-300 cursor-pointer flex flex-col items-center"
                onClick={() =>
                  !isDragging && navigate(`/category/${items.slug}`)
                }
              >
                <motion.div
                  className="bg-pink-100 border border-pink-300 rounded-full overflow-hidden mx-auto w-22 h-22"
                  whileHover={{ borderColor: "#ec4899" }}
                >
                  <img
                    src={items.img}
                    className="w-full h-full object-cover"
                    alt={items.heading}
                    loading="lazy"
                  />
                </motion.div>
                <p className="text-[10px] text-center font-bold mt-1 leading-tight whitespace-nowrap">
                  {items.heading}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop/tablet grid */}
        <div className="hidden md:grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-4 p-8">
          {data.map((items, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
              onClick={() => navigate(`/category/${items.slug}`)}
            >
              <motion.div
                className="bg-pink-100 border border-pink-300 rounded-full overflow-hidden mx-auto w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36"
                whileHover={{ borderColor: "#ec4899" }}
              >
                <img
                  src={items.img}
                  className="w-full h-full object-cover"
                  alt={items.heading}
                  loading="lazy"
                />
              </motion.div>
              <p className="text-[10px] md:text-sm lg:text-sm text-center font-bold mt-2">
                {items.heading}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <div className="hidden md:flex justify-center md:mt-10 lg:mt-10 animate-bounce">
        <button
          className="border-2 text-xl md:text-2xl lg:text-2xl text-pink-600 border-pink-600 p-2 md:p-4 lg:p-4 rounded-full hover:bg-pink-600 hover:text-white hover:cursor-pointer transition-all duration-300 hover:scale-110"
          onClick={() => {
            const nav = document.querySelector("nav");
            const navHeight = nav ? nav.offsetHeight : 80;
            const targetY = Math.max(0, window.innerHeight - navHeight);
            window.scrollTo({
              top: targetY,
              behavior: "smooth",
            });
          }}
        >
          <HiChevronDoubleDown />
        </button>
      </div>
    </>
  );
}
export default HeroSection;
