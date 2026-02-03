import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSliders } from "../../api/catalog";

function NewArraival({ autoChangeInterval = 4000, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSliders();
        // Filter only active banners and sort by order
        const activeBanners = s
          .filter(banner => banner.active !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setSlides(activeBanners);
      } catch (e) {
        setSlides([]);
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === Math.max(1, slides.length) - 1 ? 0 : prevIndex + 1
      );
    }, autoChangeInterval);

    return () => clearInterval(interval);
  }, [autoChangeInterval, slides.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[400px] md:h-[360px] lg:h-[420px] xl:h-[500px] overflow-hidden">
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <Link
            key={slide.id}
            to={slide.link || "/"}
            className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={slide.src || slide.image}
              alt={slide.alt || ""}
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </Link>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-pink-600 scale-125"
                : "bg-white/50 hover:bg-white/70 hover:scale-110 hover:cursor-pointer"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default NewArraival;
