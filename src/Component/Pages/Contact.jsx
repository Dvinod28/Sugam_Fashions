import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaComments,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaHeadset,
  FaShippingFast,
  FaUndo,
  FaCreditCard,
} from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

export default function Contact() {
  const { currentUser, isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phonenumber: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message || !formData.message.trim())
      return toast.error("Please enter a message");
    toast.info("Sending message...");
    if (!isAuthenticated || !currentUser) {
      return toast.error("Please login to send feedback");
    }
    try {
      const payload = {
        name: formData.name || currentUser?.displayName || null,
        email: formData.email || currentUser?.email || null,
        phone: formData.phonenumber || currentUser?.phoneNumber || null,
        subject: formData.subject || null,
        message: formData.message,
        createdAt: serverTimestamp(),
      };
      if (isAuthenticated && currentUser) {
        payload.user = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || null,
          email: currentUser.email || null,
          phone: currentUser.phoneNumber || null,
        };
      }
      await addDoc(collection(db, "inquiries"), payload);
      toast.success("Message sent — we'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phonenumber: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error("Send inquiry failed", err);
      toast.error("Failed to send message. Try again later.");
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What are your shipping options?",
      answer:
        "We offer standard shipping (5-7 business days), express shipping (2-3 business days), and overnight shipping. Free standard shipping on orders over $50.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Return shipping is free for defective items.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account on our website.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by location.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, Apple Pay, Google Pay, and Shop Pay for your convenience.",
    },
  ];

  const contactMethods = [
    {
      icon: FaPhone,
      title: "Phone Support",
      info: " +916361432962",
      description: "Mon-Fri 9AM-6PM EST",
      action: "tel:+916361432962",
    },
    {
      icon: FaEnvelope,
      title: "Email Support",
      info: "suraj.ar.sp@gmail.com",
      description: "We respond within 24 hours",
      action: "mailto:suraj.ar.sp@gmail.com",
    },
    {
      icon: FaComments,
      title: "Live Chat",
      info: "Chat with us now",
      description: "Available 24/7",
      action: "https://wa.me/918880483456",
    },
  ];

  const helpCategories = [
    {
      icon: FaHeadset,
      title: "Customer Service",
      description: "General inquiries and account support",
    },
    {
      icon: FaShippingFast,
      title: "Shipping & Delivery",
      description: "Track orders and shipping information",
    },
    {
      icon: FaUndo,
      title: "Returns & Exchanges",
      description: "Return policy and exchange process",
    },
    {
      icon: FaCreditCard,
      title: "Payment & Billing",
      description: "Payment methods and billing questions",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.section
        className="bg-pink-500 text-white py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-balance"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Get in Touch
          </motion.h2>
          <motion.p
            className="text-md md:text-lg text-pink-100 max-w-3xl mx-auto text-pretty"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            We're here to help! Reach out to us for any questions, support, or
            feedback. Our dedicated team is ready to assist you.
          </motion.p>
        </div>
      </motion.section>

      {/* Contact Methods */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4 text-center">
              Contact Methods
            </h2>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
              <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.action}
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.div
                  key={index}
                  className="bg-pink-100 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 border border-gray-300"
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-pink-500 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <method.icon className="text-xl md:text-2xl text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-black mb-2">
                    {method.title}
                  </h3>
                  <a
                    href={method.action}
                    className="text-pink-500 hover:text-pink-600 transition-colors duration-300 font-medium text-lg block mb-2"
                  >
                    {method.info}
                  </a>
                  <p className="text-gray-600 text-sm md:text-md">
                    {method.description}
                  </p>
                </motion.div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Store Location */}
      <section className="py-16 bg-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Visit Our Store
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <FaMapMarkerAlt className="text-pink-500 text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Sugam+embroiderys,+sangam+complex,+sigi+galli,+near+balaji+mandir,+Humnabad,+Karnataka+585330"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-500 transition-colors cursor-pointer"
                      aria-label="Open address in Google Maps"
                    >
                      Sugam embroiderys, sangam complex, sigi galli, near balaji
                      mandir, Humnabad, Karnataka 585330
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FaClock className="text-pink-500 text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Store Hours</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
                      <p>Saturday: 10:00 AM - 6:00 PM</p>
                      <p>Sunday: 12:00 PM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-pink-200 rounded-2xl overflow-hidden shadow-lg border border-pink-300"
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="h-80 flex items-center justify-center border-0">
                <iframe
                  title="Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3799.4008293485517!2d77.12678667332888!3d17.772849391590057!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcf29631b69be87%3A0x505136027b2254d6!2sSugam%20embroiderys!5e0!3m2!1sen!2sin!4v1761330869740!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4 text-center">
              How Can We Help?
            </h2>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
              <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category, index) => (
              <motion.div
                key={index}
                className="bg-pink-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-gray-300"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-pink-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <category.icon className="text-xl text-white" />
                </div>
                <h3 className="text-lg font-semibold tracking-wide text-black mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-pink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4">
              Frequently Asked Questions
            </h2>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
              <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="rounded-2xl border border-gray-300 overflow-hidden"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted transition-colors duration-300"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-card-foreground flex items-center gap-3">
                    <FaQuestionCircle className="text-pink-500" />
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <FaChevronUp className="text-pink-500" />
                  ) : (
                    <FaChevronDown className="text-pink-500" />
                  )}
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === index ? "auto" : 0,
                    opacity: openFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <p className="text-muted-foreground leading-relaxed border-t-1 border-gray-300 pt-3">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-4">
              Send Us a Message
            </h2>
            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
              <div className="h-1 w-3 bg-pink-500 rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-l from-pink-400 to-pink-600 rounded-full"></div>
            </div>
            <p className="text-md md:text-lg text-gray-600">
              Have a specific question? We'd love to hear from you
            </p>
          </motion.div>

          <motion.form
            className="bg-pink-100 rounded-2xl p-8 border border-gray-300"
            onSubmit={handleSubmit}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:bg-pink-2 focus:outline-none focus:border-2 focus:border-pink-500 transition-all duration-300"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:bg-pink-2 focus:outline-none focus:border-2 focus:border-pink-500 transition-all duration-300"
                  placeholder="Your Phone Number"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:bg-pink-200 focus:outline-none focus:border-2 focus:border-pink-500 transition-all duration-300"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:bg-pink-2 focus:outline-none focus:border-2 focus:border-pink-500 transition-all duration-300"
                  placeholder="What's this about?"
                />
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:bg-pink-2 focus:outline-none focus:border-2 focus:border-pink-500 transition-all duration-300 resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <motion.button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-100 text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-100 hover:border-1 hover:border-pink-500 hover:text-pink-500 hover:cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h2 className="font-semibold text-lg uppercase flex items-center justify-center">
                Send Message <IoIosSend className="ms-2 text-xl md:text-2xl" />
              </h2>
            </motion.button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
