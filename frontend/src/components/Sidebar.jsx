import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

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
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";


export default function Sidebar() {
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      FETCH USER ROLE
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  useEffect(() => {
    const loadRole = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      setRole(data?.role || "customer");
    };

    loadRole();
  }, []);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      MENUS
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Orders", icon: <FiClipboard />, link: "/admin/orders" },
    { name: "Services", icon: <FiSettings />, link: "/admin/services" },
  ];

  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  const menu = role === "admin" ? adminMenu : customerMenu;

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      LOGOUT
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
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
        <nav className="mt-4 px-3 pb-24">
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
        <div
          onClick={handleLogout}
          className={`absolute bottom-6 left-3 right-3 flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer 
            bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* CONTENT PADDING */}
      <div className="lg:hidden h-12" />
    </>
  );
}
