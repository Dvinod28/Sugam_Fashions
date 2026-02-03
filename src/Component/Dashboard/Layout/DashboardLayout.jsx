import { HiOutlineBell, HiMenu, HiOutlineLogout, HiX } from "react-icons/hi";
import { BiUser } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  toggleMobileSidebar,
  closeMobileSidebar,
} from "../../../Redux/Dashboard/DashboardSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../../api/auth";
import { useState } from "react";
import { Link } from "react-router-dom";

function DashboardTopbar({ title }) {
  const dispatch = useDispatch();
  const notifications = useSelector((s) => s.dashboard?.notifications || 0);
  const user = useSelector((s) => s.user?.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Logout failed", e);
      // Optional: surface a user-friendly message
      // alert("Logout failed. Please try again.");
    }
  }

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-pink-500 border-b border-gray-300 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="md:hidden p-2 rounded hover:bg-gray-100"
        >
          <HiMenu className="w-6 h-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3 relative">
        {/* <div className="relative">
          <HiOutlineBell className="w-6 h-6 text-white" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-100 text-black text-xs rounded-full px-1.5">
              {notifications}
            </span>
          )}
        </div> */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center hover:cursor-pointer transition-all duration-300"
        >
          <BiUser className="w-5 h-5 text-pink-700" />
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-56 bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
            <div className="px-3 py-3 border-b border-pink-500 bg-pink-50">
              <div className="text-sm font-medium mb-1 text-gray-900">
                {user?.displayName || user?.email || "User"}
              </div>
              <div className="text-xs text-gray-500">{user?.email || ""}</div>
            </div>
            <div className="p-2">
              {/* <div className="text-xs text-gray-500 px-2 py-1">Account</div>
              <button onClick={() => navigate("/user")} className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-sm">Profile</button> */}
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center gap-2 px-2 py-2 rounded hover:bg-pink-100 text-sm hover:cursor-pointer transition-all duration-300"
              >
                <HiOutlineLogout className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-pink-100 hover:bg-pink-200 text-sm hover:cursor-pointer transition-all duration-300"
        >
          <HiOutlineLogout className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}

function DashboardSidebar({ menu, activeKey, onChange }) {
  const collapsed = useSelector((s) => s.dashboard?.sidebarCollapsed);
  const mobileSidebarOpen = useSelector((s) => s.dashboard?.mobileSidebarOpen);
  const dispatch = useDispatch();

  const handleMenuClick = (key) => {
    onChange(key);
    dispatch(closeMobileSidebar());
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: collapsed ? 64 : 250 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="bg-white border-r border-gray-200 h-full hidden md:block overflow-hidden shadow-sm"
      >
        <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
          <Link to="/">
            <div className="text-pink-600 font-semibold">Sugam Fashion</div>
          </Link>
        </div>
        <nav className="p-3 pt-4 space-y-1">
          {menu.map((item) => (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 rounded-4xl transition-colors border ${
                activeKey === item.key
                  ? "bg-pink-500/90 text-pink-100 border-pink-100 shadow-sm"
                  : "hover:bg-pink-100 border-transparent hover:text-pink-500 hover:cursor-pointer"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => dispatch(closeMobileSidebar())}
            />
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
                <Link to="/">
                  <div className="text-pink-600 font-semibold">
                    Sugam Fashion
                  </div>
                </Link>
                <button
                  onClick={() => dispatch(closeMobileSidebar())}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-3 pt-4 space-y-1">
                {menu.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item.key)}
                    className={`w-full flex items-center gap-3 px-6 py-3 rounded-4xl transition-colors border ${
                      activeKey === item.key
                        ? "bg-pink-500/90 text-pink-100 border-pink-100 shadow-sm"
                        : "hover:bg-pink-100 border-transparent"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function DashboardLayout({
  title,
  menu,
  activeKey,
  onChange,
  children,
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTopbar title={title} />
      <div className="mx-auto grid md:grid-cols-[250px_1fr] gap-0">
        <DashboardSidebar
          menu={menu}
          activeKey={activeKey}
          onChange={onChange}
        />
        <main className="min-h-[90vh] p-4 md:p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
