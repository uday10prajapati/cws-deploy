import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { clearUserData, getUserRole } from "../utils/roleBasedRedirect";
import { FiUser, FiMenu, FiX, FiLogOut, FiChevronDown, FiHome, FiClipboard, FiSettings, FiUsers, FiDollarSign, FiTrendingUp, FiBell, FiPhone, FiMail } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

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
        
        // Fetch user details from profiles table
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", auth.user.id)
            .single();
          
          if (profile) {
            setUserDetails(profile);
          }
        } catch (err) {
          console.error("Error fetching user details:", err);
        }
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
            {/* NOTIFICATION BELL */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="relative p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                title="User Details"
              >
                <FiBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>

              {/* USER DETAILS PANEL */}
              {notificationPanelOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
                  <div className="px-6 py-4 border-b border-slate-700 bg-linear-to-r from-blue-600/20 to-purple-600/20">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">User Information</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Profile Avatar */}
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff&size=64`}
                        className="w-16 h-16 rounded-full border-2 border-blue-500"
                        alt="Profile"
                      />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-white font-medium text-sm break-all">{user?.email}</p>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <FiUser className="text-blue-400 shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-slate-400">Full Name</p>
                          <p className="text-white text-sm font-medium">
                            {userDetails?.name || "Not provided"}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-3">
                        <FiMail className="text-blue-400 shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-slate-400">Email</p>
                          <p className="text-white text-sm font-medium break-all">{user?.email}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-3">
                        <FiPhone className="text-blue-400 shrink-0" size={18} />
                        <div>
                          <p className="text-xs text-slate-400">Phone Number</p>
                          <p className="text-white text-sm font-medium">
                            {userDetails?.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Account Type</p>
                      <p className="text-blue-300 font-semibold capitalize mt-1">{role || "User"}</p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="px-6 py-3 border-t border-slate-700 flex justify-end">
                    <button
                      onClick={() => setNotificationPanelOpen(false)}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50">
                  {/* User Header */}
                  <div className="px-4 py-4 border-b border-slate-700 flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff&size=48`}
                      className="w-12 h-12 rounded-full border-2 border-blue-500"
                      alt="Profile"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {userDetails?.name || "User"}
                      </p>
                      <p className="text-xs text-blue-400 uppercase tracking-wide mt-1">{role}</p>
                    </div>
                  </div>

                  {/* User Details Section */}
                  <div className="px-4 py-3 space-y-3 border-b border-slate-700">
                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <FiMail size={16} className="text-blue-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-sm text-slate-100">{user?.email || "Not provided"}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <FiPhone size={16} className="text-blue-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Phone</p>
                        <p className="text-sm text-slate-100">
                          {userDetails?.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Account Status</p>
                        <p className="text-sm text-slate-100 capitalize">
                          {userDetails?.account_status?.replace(/_/g, " ") || "Active"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
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
