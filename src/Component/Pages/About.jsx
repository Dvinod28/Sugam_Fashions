import { motion } from "framer-motion";
import {
  FaHeart,
  FaUsers,
  FaShieldAlt,
  FaLeaf,
  FaStar,
  FaRocket,
  FaHandshake,
  FaGlobe,
} from "react-icons/fa";
import { IoMdCall } from "react-icons/io";
import { IoHome } from "react-icons/io5";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 },
};

export default function About() {
  // const navigate = useNavigate();
  // const { category } = useParams();
  const values = [
    {
      icon: <FaHeart className="w-8 h-8" />,
      title: "Customer First",
      description:
        "Every decision we make puts our customers at the center, ensuring exceptional experiences.",
    },
    {
      icon: <FaLeaf className="w-8 h-8" />,
      title: "Sustainability",
      description:
        "We're committed to eco-friendly practices and sustainable sourcing for a better tomorrow.",
    },
    {
      icon: <FaShieldAlt className="w-8 h-8" />,
      title: "Quality Assured",
      description:
        "Rigorous quality control ensures every product meets our high standards before reaching you.",
    },
    {
      icon: <FaRocket className="w-8 h-8" />,
      title: "Innovation",
      description:
        "We continuously evolve and innovate to bring you the latest and greatest products.",
    },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "images/img-1.jpg",
    },
    {
      name: "Michael Chen",
      role: "Head of Design",
      image: "images/img-5.jpg",
    },
    {
      name: "Emily Rodriguez",
      role: "Customer Success",
      image: "images/model-4.png",
    },
    {
      name: "David Kim",
      role: "Product Manager",
      image: "images/model-5.png",
    },
  ];

  const stats = [
    { number: "50K+", label: "Happy Customers" },
    { number: "10K+", label: "Products Sold" },
    { number: "99%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Customer Support" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-pink-500 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 opacity-90" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-cormorant text-4xl md:text-6xl font-semibold leading-tight mb-6">
              Our Story
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-pretty">
              Building meaningful connections through exceptional products and
              unforgettable experiences
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products">
                <button className="bg-pink-100 text-pink-500 text-lg px-8 py-4 rounded-full font-semibold hover:bg-white transition-colors duration-300 flex items-center mx-auto">
                  <FaGlobe className="mr-2" />
                  Explore Our Products
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-4 bg-pink-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp} className="order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-800">
                From Vision to Reality
              </h2>
              <div className="space-y-1 text-md md:text-md leading-relaxed text-gray-600">
                <h3 className="font-semibold text-lg md:text-xl">Vision</h3>
                <p className=" mb-4 text-justify">
                  To be a leading name in boutique and fashion design,
                  recognized for our exceptional craftsmanship, timeless
                  embroidery, and dedication to delivering next-level quality
                  that inspires confidence and elegance in every customer.
                </p>
                <h3 className="font-semibold text-xl">Mission </h3>
                <p className="text-justify">
                  Our mission is to blend traditional artistry with modern
                  trends, offering superior embroidery, muggam work, and custom
                  stitching that reflect perfection in every detail. We aim to
                  create a seamless online experience where customers can access
                  our 30+ years of expertise, trust, and unmatched finishing
                  quality from anywhere.
                </p>
                <blockquote className=" mt-4 border-l-4 border-pink-500 pl-4 md:pl-4 italic text-pink-500 font-medium">
                  "Success isn't just about what you accomplish in your life,
                  it's about what you inspire others to do." - Our founding
                  principle
                </blockquote>
              </div>
            </motion.div>
            <motion.div {...fadeInUp} className="order-1 md:order-2">
              <div className="relative">
                <img
                  src="images/team-work.png"
                  alt="Our team at work"
                  loading="lazy"
                  className="rounded-2xl shadow-2xl w-full"
                />
                <motion.div
                  className="absolute -bottom-6 -right-0 md:-right-6 bg-pink-500 text-white p-3 md:p-6 rounded-2xl shadow-xl"
                  whileHover={{ rotate: 5 }}
                >
                  <FaStar className="w-4 h-4 md:w-8 md:h-8 mb-1 md:mb-2" />
                  <p className="font-bold text-md md:text-lg">30+ Years</p>
                  <p className="text-sm">of Excellence</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="bg-pink-100 p-6 shadow-sm hover:shadow-lg transition-shadow border border-pink-100">
                  <h3 className="text-3xl md:text-4xl font-bold text-pink-500 mb-2">
                    {stat.number}
                  </h3>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-pink-100">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-2 text-center">
              What Drives Us
            </h2>
            <p className="text-md md:text-lg text-gray-600 max-w-3xl mx-auto text-pretty mb-4">
              Our core values shape everything we do, from product development
              to customer service
            </p>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
              <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={fadeInUp} {...scaleOnHover}>
                <div className="h-full bg-pink-200 p-6 text-center rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-pink-500 mb-2 md:mb-4 flex justify-center">
                    {value.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold tracking-wide mb-2 md:mb-4 text-gray-800">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm md:text-md leading-relaxed ">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-pink-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <FaHandshake className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Ready to Join Our Journey?
            </h2>
            <p className="text-lg md:text-xl mb-8 leading-relaxed text-pretty">
              Discover our carefully curated collection of products and become
              part of our growing community
            </p>
            <div className="flex items-center sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/products"
                  className="bg-pink-100 text-pink-500 text-sm md:text-lg px-4 md:px-6 py-3 rounded-full font-semibold hover:bg-white transition-colors duration-300 flex items-center justify-center"
                >
                  <FaUsers className="mr-2" />
                  Shop Now
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/contact"
                  className="bg-transparent border-2 border-white text-white text-sm md:text-lg px-4 md:px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-pink-500 transition-colors duration-300 flex items-center justify-center"
                >
                  <IoMdCall className="mr-2" />
                  Contact Us
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
