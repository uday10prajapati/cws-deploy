import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { clearUserData, getUserRole } from "../utils/roleBasedRedirect";
import { FiUser, FiMenu, FiX, FiLogOut, FiChevronDown, FiHome, FiClipboard, FiSettings, FiUsers, FiDollarSign, FiTrendingUp } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /* ---------------------------
     LOAD LOGGED-IN USER + ROLE FROM LOCAL STORAGE
  ----------------------------*/
  useEffect(() => {
    const userRole = getUserRole();
    if (userRole) {
      setRole(userRole);
    }

    // Also get user from Supabase for display purposes
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };

    loadUser();
  }, []);

  /* ---------------------------
      LOGOUT
  ----------------------------*/
  const handleLogout = () => {
    console.log("Logout clicked");
    
    // 🔥 Clear ALL user data from local storage
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    
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

  /* ---------------------------
      NAV MENUS
  ----------------------------*/
  const adminMenu = [
    { label: "Dashboard", link: "/admin/dashboard", icon: <FiHome /> },
    { label: "Bookings", link: "/admin/bookings", icon: <FiClipboard /> },
    { label: "Users", link: "/admin/users", icon: <FiUsers /> },
    { label: "Revenue", link: "/admin/revenue", icon: <FiDollarSign /> },
    { label: "Analytics", link: "/admin/analytics", icon: <FiTrendingUp /> },
    { label: "Settings", link: "/admin/settings", icon: <FiSettings /> },
  ];

  const customerMenu = [
    { label: "Home", link: "/", icon: <FiHome /> },
    { label: "Bookings", link: "/bookings", icon: <FiClipboard /> },
    { label: "My Cars", link: "/my-cars", icon: <FaCar /> },
    { label: "Profile", link: "/profile", icon: <FiUser /> },
  ];

  const menu = role === "admin" ? adminMenu : customerMenu;

  return (
    <>
      {/* DARK NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-linear-to-r from-slate-900 via-slate-900 to-blue-950 border-b border-slate-800 shadow-xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

          {/* LOGO */}
          <Link
            to={role === "admin" ? "/admin/dashboard" : "/"}
            className="text-3xl font-extrabold text-white flex items-center gap-1 shrink-0"
          >
            <span className="bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">CarWash</span>
            <span className="text-blue-500">+</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-1">
            {menu.map((m) => (
              <Link
                key={m.label}
                to={m.link}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                  location.pathname === m.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-blue-400 hover:bg-slate-800/50"
                }`}
              >
                <span className="text-base">{m.icon}</span>
                {m.label}
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE - USER & LOGOUT */}
          <div className="flex items-center gap-4">
            {/* USER DROPDOWN */}
            <div className="hidden md:flex items-center relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
                  className="w-6 h-6 rounded-full border border-blue-500"
                  alt="Profile"
                />
                <span className="text-sm font-medium hidden sm:inline">
                  {user?.email?.split("@")[0]}
                </span>
                <FiChevronDown
                  className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  size={16}
                />
              </button>

              {/* DROPDOWN MENU */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Logged in as</p>
                    <p className="text-sm font-medium text-white mt-1">{user?.email}</p>
                    <p className="text-xs text-blue-400 mt-1 uppercase tracking-wide">{role}</p>
                  </div>
                  <button
                    onClick={() => {
                      console.log("Dropdown logout button clicked!");
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <FiLogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="lg:hidden text-white text-2xl hover:text-blue-400 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 border-t border-slate-800 p-4 space-y-2">
            {menu.map((m) => (
              <Link
                key={m.label}
                to={m.link}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  location.pathname === m.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-blue-400 hover:bg-slate-800"
                }`}
              >
                <span className="text-base">{m.icon}</span>
                {m.label}
              </Link>
            ))}

            {/* MOBILE USER INFO */}
            <div className="border-t border-slate-700 pt-4 mt-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg mb-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
                  className="w-8 h-8 rounded-full border border-blue-500"
                  alt="Profile"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-400">User</p>
                  <p className="text-sm font-medium text-white">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  console.log("Mobile logout button clicked!");
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full  px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* TOP PADDING */}
      <div className="h-20" />
    </>
  );
}
