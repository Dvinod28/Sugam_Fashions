import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdEmail,
  MdLock,
  MdPhone,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { login, sendPasswordReset } from "../../api/auth";
import { ROLES } from "../../data/roles";
import { FaPhoneAlt } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  useEffect(() => {
    // After login, AuthContext updates currentUser; redirect based on role
    if (!currentUser) return;
    const isAdminFallback = (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase() === String(currentUser.email || "").toLowerCase();
    const effectiveRole = currentUser.role || (isAdminFallback ? ROLES.ADMIN : null);

    if (effectiveRole === ROLES.ADMIN) {
      navigate("/admin");
    } else if (effectiveRole === ROLES.THREAD_WORK) {
      navigate("/production/thread-work");
    } else if (effectiveRole === ROLES.RD_DEPARTMENT) {
      navigate("/production/rd-department");
    } else if (effectiveRole === ROLES.STORE_MANAGER) {
      navigate("/production/store-manager");
    } else if (effectiveRole === ROLES.PRODUCT_MANAGER) {
      navigate("/production/product-manager");
    } else {
      navigate("/user");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const identifier = (formData.identifier || "").trim();
    const password = formData.password || "";
    if (!identifier) newErrors.identifier = "Phone number or email is required";
    if (!password) newErrors.password = "Password is required";

    if (identifier) {
      if (/@/.test(identifier)) {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        if (!emailOk) newErrors.identifier = "Enter a valid email address";
      } else {
        const phoneDigits = identifier.replace(/[^0-9]/g, "");
        if (phoneDigits.length !== 10)
          newErrors.identifier = "Enter a valid 10-digit phone number";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
        setIsLoading(true);
        setErrors({}); // Clear previous errors
        // Login the user; AuthContext will update and useEffect will redirect
        await login({
          email: identifier,
          password,
        });
      } catch (err) {
      const code = err?.code || "";
      let friendly = "Login failed";
      const nextErrors = {};
      if (code === "auth/user-not-found") {
        friendly = "No account found for this phone/email";
        nextErrors.identifier = friendly;
      } else if (code === "auth/wrong-password") {
        friendly = "Incorrect password";
        nextErrors.password = friendly;
      } else if (code === "auth/invalid-email") {
        friendly = "Enter a valid email address";
        nextErrors.identifier = friendly;
      } else if (code === "auth/too-many-requests") {
        friendly = "Too many attempts. Try again later.";
      } else if (code === "auth/network-request-failed") {
        friendly = "Network error. Please try again.";
      } else {
        friendly = err?.message || "Login failed";
      }
      setErrors({ ...nextErrors, general: friendly });
      setToast(friendly);
      setTimeout(() => setToast(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const identifier = window.prompt(
      "Enter your registered email or phone number to reset password:"
    );
    if (!identifier) return;
    try {
      await sendPasswordReset(identifier);
      alert(
        "Password reset email sent if an account with that identifier exists."
      );
    } catch (err) {
      console.error(err);
      alert("Failed to send password reset: " + (err?.message || err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-10 left-10 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl"
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl"
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-100/30 rounded-full blur-xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg shadow-lg border border-pink-200"
        >
          {toast}
        </motion.div>
      )}

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mb-4 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Sign in to your account</p>
        </motion.div>

        <motion.div
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm"
              >
                {errors.general}
              </motion.p>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhoneAlt className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${errors.identifier ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-pink-400"}`}
                  placeholder="you@example.com or 9876543210"
                />
              </div>
              {errors.identifier && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-red-600 font-medium"
                >
                  {errors.identifier}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pr-12 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${errors.password ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-pink-400"}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 p-2 rounded-lg hover:bg-pink-50 transition-colors duration-200"
                >
                  {showPassword ? (
                    <MdVisibilityOff className="w-5 h-5 text-pink-500" />
                  ) : (
                    <MdVisibility className="w-5 h-5 text-pink-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-red-600 font-medium"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </button>
              <Link
                to="/signup"
                className="text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Create account
              </Link>
            </div>

            <motion.button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>
          
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <Link to="/legal" className="text-pink-600 hover:text-pink-700 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/legal" className="text-pink-600 hover:text-pink-700 font-medium">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
