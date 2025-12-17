import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { clearUserData, getUserRole } from "../utils/roleBasedRedirect";

import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiBell,
  FiUser,
  FiMenu,
  FiLogOut,
  FiClipboard,
  FiSettings,
  FiChevronLeft,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";


export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      FETCH USER ROLE FROM LOCAL STORAGE
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  useEffect(() => {
    const userRole = getUserRole();
    if (userRole) {
      setRole(userRole);
    } else {
      // If no role in local storage, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      MENUS
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Orders", icon: <FiClipboard />, link: "/admin/orders" },
    { name: "Services", icon: <FiSettings />, link: "/admin/services" },
    { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/admin/emergency-wash" },
    { name: "About Us", icon: <FiInfo />, link: "/about-us" },
  ];

  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/emergency-wash" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
    { name: "Account Settings", icon: <FiSettings />, link: "/account-settings" },
    { name: "About Us", icon: <FiInfo />, link: "/about-us" },
  ];

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee-dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/employee/emergency-wash" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
    { name: "About Us", icon: <FiInfo />, link: "/about-us" },
  ];

  let menu = [];
  if (role === "admin") {
    menu = adminMenu;
  } else if (role === "employee" || role === "washer") {
    menu = employeeMenu;
  } else {
    menu = customerMenu;
  }

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      LOGOUT
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */

  const handleLogout = () => {
    console.log("Logout clicked");
    
    // 🔥 Clear ALL user data from local storage
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("sb-cjaufvqninknntiukxka-auth-token");
    
    // Verify clearing
    console.log("Cleared localStorage:", {
      userDetails: localStorage.getItem("userDetails"),
      userId: localStorage.getItem("userId"),
      userRole: localStorage.getItem("userRole")
    });
    
    // Sign out from Supabase (non-blocking)
    supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    
    // Redirect to login
    navigate("/login");
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      SIDEBAR UI
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40 mt-20">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">CarWash+</h1>
        <FiMenu className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setMobileOpen(true)} />
      </div>

      {/* BACKDROP FOR MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* DARK SIDEBAR */}
      <aside
        className={`fixed top-20 left-0 h-full bg-gray-900 border-r border-gray-800 shadow-2xl z-50 transition-all duration-300
          ${collapsed ? "w-24" : "w-72"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors rounded-lg m-4"
          onClick={() => setCollapsed(!collapsed)}>
          <div className={`font-extrabold text-xl text-white ${collapsed ? "text-center w-full" : ""}`}>
            {collapsed ? "CW" : "CarWash+"}
          </div>
          {!collapsed && (
            <FiChevronLeft className="text-gray-400 hover:text-blue-400 transition-colors" />
          )}
        </div>

        {/* Menu Items */}
        <nav className="mt-4 px-3 pb-32">
          {menu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all mb-2
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.name : ""}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            console.log("Logout button clicked!");
            handleLogout();
          }}
          className={`absolute bottom-6 left-3 right-3 flex items-center gap-4 px-4 py-3 rounded-lg 
            bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg border-none
            cursor-pointer active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg shrink-0" />
          {!collapsed && <span className="text-sm shrink-0">Logout</span>}
        </button>
      </aside>

      {/* CONTENT PADDING */}
      <div className="lg:hidden h-12" />
    </>
  );
}