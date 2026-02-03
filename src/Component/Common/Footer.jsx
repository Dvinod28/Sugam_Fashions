import { motion } from "framer-motion";
import { FaInstagram, FaHeart, FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { MdContactSupport, MdLocationPin, MdMailOutline } from "react-icons/md";
import { IoCallOutline } from "react-icons/io5";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { IoIosSend } from "react-icons/io";
import { CiFacebook } from "react-icons/ci";
import { useState } from "react";

function Footer() {
  return (
    <div className="bg-pink-200 relative overflow-hidden border-t-2 border-pink-500">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-5 relative z-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className=""
            >
              <img
                src="/images/logo.png"
                loading="lazy"
                className="w-full h-20 md:h-25 object-contain"
                alt="logo"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-gray-700 text-sm md:text-md"
            >
              Crafting digital experiences with passion and precision. A web
              developer dedicated
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex mt-8"
            >
              <FeedbackForm />
            </motion.div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 ps-0 md:ps-14 lg:ps-18"
          >
            <h3 className="text-2xl font-semibold text-pink-500">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {["Home", "About", "Offers", "Contact", "Login", "Signup"].map(
                (link, index) => (
                  <motion.li
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <Link
                      to={
                        link === "Home"
                          ? "/"
                          : link === "Offers"
                          ? "/products"
                          : `/${link.toLowerCase()}`
                      }
                      className="text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-pink-500 rounded-full group-hover:scale-150 transition-transform"></span>
                      {link}
                    </Link>
                  </motion.li>
                )
              )}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-semibold text-pink-500">Contact</h3>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-md mb-1 flex items-center gap-1">
                <MdLocationPin />
                Address:
              </h3>
              <motion.a
                href="https://www.google.com/maps/search/?api=1&query=Sugam+embroiderys,+sangam+complex,+sigi+galli,+near+balaji+mandir,+Humnabad,+Karnataka+585330"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-pink-500 transition-colors text-sm ms-4 block capitalize"
                whileHover={{ scale: 1.02 }}
                aria-label="Open address in Google Maps"
              >
                Sugam embroiderys, sangam complex, sigi galli, near balaji
                mandir, Humnabad, Karnataka 585330
              </motion.a>
              <h3 className="font-semibold text-gray-700 text-md mb-1 flex items-center gap-1">
                <MdContactSupport />
                Customer Support:
              </h3>
              <motion.a
                href="mailto:suraj.ar.sp@gmail.com"
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1 text-gray-700 hover:text-pink-500 transition-colors ms-4 text-sm mb-1"
                aria-label="Send email to suraj.ar.sp@gmail.com"
              >
                <MdMailOutline /> suraj.ar.sp@gmail.com
              </motion.a>
              <motion.a
                href="tel:+916361432962"
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1 text-gray-700 hover:text-pink-500 transition-colors ms-4 text-sm mb-1"
                aria-label="Call +91 6361432962"
              >
                <IoCallOutline /> +916361432962
              </motion.a>
              <motion.a
                href="https://wa.me/918880483456"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1 text-gray-700 hover:text-pink-500 transition-colors ms-4 text-sm"
                aria-label="Open WhatsApp chat with +91 8880483456"
              >
                <FaWhatsapp /> +918880483456
              </motion.a>
            </div>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4 ps-0 md:ps-14 lg:ps-15"
          >
            <h3 className="text-2xl font-semibold text-pink-500">Legal</h3>
            <ul className="space-y-2">
              {[
                "Privacy Policy",
                "Terms & Conditions",
                "Exchange & Return Policy",
                "Payment Policy",
                "Shipping & Delivery Policy",
              ].map((link, index) => {
                const slug = link.toLowerCase().split(" ").join("-");
                return (
                  <motion.li
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <Link
                      to={`/legal/${slug}`}
                      className="text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-pink-500 rounded-full group-hover:scale-150 transition-transform"></span>
                      {link}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        {/* Social Links and Copyright */}
        <div className="mt-9 pt-6 border-t border-pink-500/20">
          <div className="flex flex-col md:flex-row justify-between items-center text-center gap-4">
            <div className="flex gap-6">
              {[
                { icon: FaWhatsapp, href: "" },
                {
                  icon: CiFacebook,
                  href: "",
                },
                {
                  icon: FaInstagram,
                  href: "",
                },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-700 hover:text-pink-500 transition-colors"
                >
                  <social.icon size={24} />
                </motion.a>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-gray-700 text-center"
            >
              © {new Date().getFullYear()} SUGAM. All rights reserved.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-gray-700 text-center flex items-center gap-1"
            >
              Thanks for Shopping
              <span className="text-pink-500">
                <FaHeart />
              </span>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackForm() {
  const { currentUser, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message || !message.trim())
      return toast.error("Please enter feedback");
    if (!isAuthenticated || !currentUser) {
      return toast.error("Please login to send feedback");
    }
    setSubmitting(true);
    try {
      const payload = {
        message: message.trim(),
        createdAt: serverTimestamp(),
      };
      // require authenticated user; include phone if available
      payload.user = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || null,
        email: currentUser.email || null,
        phone: currentUser.phoneNumber || null,
      };
      await addDoc(collection(db, "feedback"), payload);
      toast.success("Feedback sent — thank you!"), { position: "top-right" };
      setMessage("");
    } catch (e) {
      console.error("Failed to send feedback", e);
      toast.error("Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex w-full" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Please Share Your Feedback"
        className="p-2 border-2 border-pink-500 rounded-l-md focus:outline-none text-pink-600 w-full"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-pink-500 p-1 border-2 border-pink-500 text-white rounded-r-md text-3xl cursor-pointer"
        aria-label="Send feedback"
      >
        <IoIosSend />
      </button>
    </form>
  );
}

export default Footer;
