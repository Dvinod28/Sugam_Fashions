import "./App.css";
import Navbar from "./Component/Common/Navbar";
import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "./Component/Common/ScrollToTop";
import HomePage from "./Component/Pages/HomePage";
import Footer from "./Component/Common/Footer";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cart from "./Component/Cart/Cart";
import CartDrawer from "./Component/Cart/CartDrawer";
import CategoryPage from "./Component/Pages/CategoryPage";
import SearchResults from "./Component/Pages/SearchResults";
import Login from "./Component/Auth/Login";
import Signup from "./Component/Auth/Signup";
import About from "./Component/Pages/About";
import Contact from "./Component/Pages/Contact";
import ProductDetails from "./Component/Pages/ProductDetails";
import Checkout from "./Component/Pages/Checkout";
import Preloader from "./Component/Common/Preloader";
import AdminSeed from "./Component/Pages/AdminSeed";
import ThankYou from "./Component/Pages/ThankYou";

import AdminDashboard from "./Component/Dashboard/Admin/AdminDashboard";
import CustomerDashboard from "./Component/Dashboard/Customer/CustomerDashboard";
import ProductionDashboard from "./Component/Dashboard/Production/ProductionDashboard";
import ProtectedRoute from "./Component/Dashboard/ProtectedRoute";
import { ROLES } from "./data/roles";

// import Dashboard from "./Component/Admin/Dashboard";
// import ProductsAdmin from "./Component/Admin/ProductsAdmin";
// import CategoriesAdmin from "./Component/Admin/CategoriesAdmin";
// import SlidersAdmin from "./Component/Admin/SlidersAdmin";
// import UserDashboard from "./Component/Pages/UserDashboard";
import AllProducts from "./Component/Pages/AllProducts";
import LegalPage from "./Component/Pages/LegalPage";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Function to open cart drawer
  const openCartDrawer = () => {
    setIsCartOpen(true);
  };

  // Function to close cart drawer
  const closeCartDrawer = () => {
    setIsCartOpen(false);
  };

  // Make these functions available globally
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;

  useEffect(() => {
    const onEnded = () => setIsLoading(false);

    const video = document.querySelector(
      "video[src='/videos/preloader-vid.mp4']"
    );
    if (video) {
      video.addEventListener("ended", onEnded);
    }

    const timeoutId = setTimeout(() => setIsLoading(false), 9000);

    return () => {
      if (video) video.removeEventListener("ended", onEnded);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {isLoading && <Preloader />}
      {!isLoading && (
        <>
          <ToastContainer position="top-right" autoClose={3000} />
          <ScrollToTop />
          {!isAdminRoute && <Navbar />}
          <CartDrawer isOpen={isCartOpen} onClose={closeCartDrawer} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/products" element={<AllProducts />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="/checkout" element={<ProtectedRoute requireAdmin={false}><Checkout /></ProtectedRoute>} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/admin/seed" element={<AdminSeed />} />

            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            {/* <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsAdmin /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute requireAdmin={true}><CategoriesAdmin /></ProtectedRoute>} />
            <Route path="/admin/sliders" element={<ProtectedRoute requireAdmin={true}><SlidersAdmin /></ProtectedRoute>} /> */}
            <Route path="/user" element={<CustomerDashboard />} />
            <Route path="/production/thread-work" element={<ProtectedRoute allowedRoles={[ROLES.THREAD_WORK]}><ProductionDashboard userRole={ROLES.THREAD_WORK} /></ProtectedRoute>} />
            <Route path="/production/rd-department" element={<ProtectedRoute allowedRoles={[ROLES.RD_DEPARTMENT]}><ProductionDashboard userRole={ROLES.RD_DEPARTMENT} /></ProtectedRoute>} />
            <Route path="/production/store-manager" element={<ProtectedRoute allowedRoles={[ROLES.STORE_MANAGER]}><ProductionDashboard userRole={ROLES.STORE_MANAGER} /></ProtectedRoute>} />
            <Route path="/production/product-manager" element={<ProtectedRoute allowedRoles={[ROLES.PRODUCT_MANAGER]}><ProductionDashboard userRole={ROLES.PRODUCT_MANAGER} /></ProtectedRoute>} />
            {/* Temporary test route to bypass authentication */}
            <Route path="/test/production" element={<ProductionDashboard userRole={ROLES.THREAD_WORK} />} />
          </Routes>
          {!isAdminRoute && <Footer />}
        </>
      )}
    </>
  );
}


export default App;
