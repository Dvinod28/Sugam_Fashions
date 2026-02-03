import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

function FeaturedIn() {
  const featuredCategories = [
    "Blouse Designs",
    "Hand Work",
    "Kurtis",
    "Thread Work",
    "Pattern Work",
    "Patch Work",
  ];

  const containerRef = useRef(null);

  return (
    <>
      <div className="my-18">
        {/* Continuous Slider */}
        <div className="overflow-hidden relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4 uppercase text-center"
          >
            Featured In
          </motion.h2>
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
            <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
            <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
          </div>
          {/* Continuous Slider */}
          <div className="md:mt-1 mt-10 overflow-hidden relative">
            <div className="relative w-full overflow-hidden">
              <motion.div
                className="flex gap-4"
                animate={{
                  x: [0, -2000],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 40,
                    ease: "linear",
                  },
                }}
                style={{
                  width: "fit-content",
                }}
              >
                {[
                  ...featuredCategories,
                  ...featuredCategories,
                  ...featuredCategories,
                  ...featuredCategories,
                  ...featuredCategories,
                  ...featuredCategories,
                ].map((items, index) => (
                  <motion.span
                    key={index}
                    className="bg-pink-200 text-pink-500 border border-pink-500 px-6 py-3 font-medium rounded-full text-md whitespace-nowrap hover:bg-pink-500 hover:text-white cursor-pointer transition-all duration-300"
                  >
                    {items}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <hr className="my-8 text-pink-500" />
    </>
  );
}
export default FeaturedIn;
