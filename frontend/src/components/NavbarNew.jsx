import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { getUserRole } from "../utils/roleBasedRedirect";
import { FiUser, FiMenu, FiX, FiLogOut, FiChevronDown, FiHome, FiClipboard, FiSettings, FiUsers, FiDollarSign, FiTrendingUp, FiBell, FiPhone, FiMail, FiGift, FiAlertCircle, FiCreditCard, FiAward, FiTruck, FiWind, FiInfo } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function NavbarNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdown, setServicesDropdown] = useState(false);
  const [paymentsDropdown, setPaymentsDropdown] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [operationsDropdown, setOperationsDropdown] = useState(false);
  const [financeDropdown, setFinanceDropdown] = useState(false);
  const [reportsDropdown, setReportsDropdown] = useState(false);
  const [adminAccountDropdown, setAdminAccountDropdown] = useState(false);

  // Mock notifications data
  const [notifications] = useState([
    {
      id: 1,
      message: "Your booking is confirmed for today at 2:00 PM",
      type: "success",
      time: "2 hours ago"
    },
    { 
      id: 2, 
      message: "New offer: 50% off on monthly pass", 
      type: "offer",
      time: "5 hours ago"
    },
    { 
      id: 3, 
      message: "Your vehicle is ready for pickup", 
      type: "info",
      time: "1 day ago"
    },
  ]);

  useEffect(() => {
    const userRole = getUserRole();
    if (userRole) {
      setRole(userRole);
    }

    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
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

  const handleLogout = () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    navigate("/login");
  };

  /* CUSTOMER MENU */
  const customerMainMenu = [
    { label: "Dashboard", link: "/customer-dashboard", icon: <FiHome /> },
    { label: "Book a Wash", link: "/bookings", icon: <FiAlertCircle /> },
    { label: "My Cars", link: "/my-cars", icon: <FaCar /> },
  ];

  const servicesMenu = [
    { label: "My Bookings", link: "/bookings", icon: <FiClipboard /> },
    { label: "Wash History", link: "/wash-history", icon: <FiTruck /> },
    { label: "Monthly Pass", link: "/monthly-pass", icon: <FiAward /> },
    { label: "Quick Wash", link: "/emergency-wash", icon: <FiWind /> },
  ];

  const paymentsMenu = [
    { label: "Wallet", link: "/transactions", icon: <FiDollarSign /> },
    { label: "Transactions", link: "/transactions", icon: <FiCreditCard /> },
    { label: "Loyalty Points", link: "/customer/loyalty", icon: <FiGift /> },
  ];

  const accountMenu = [
    { label: "Profile", link: "/profile", icon: <FiUser /> },
    { label: "Account Settings", link: "/account-settings", icon: <FiSettings /> },
    { label: "About Us", link: "/about-us", icon: <FiInfo /> },
  ];

  /* ADMIN MENU */
  const adminMainMenu = [
    { label: "Dashboard", link: "/admin-dashboard", icon: <FiHome /> },
    { label: "Bookings", link: "/admin/bookings", icon: <FiClipboard /> },
  ];

  const operationsMenu = [
    { label: "Approvals", link: "/admin/approvals", icon: <FiAlertCircle /> },
    { label: "Users", link: "/admin/users", icon: <FiUsers /> },
    { label: "Riders", link: "/admin/riders", icon: <FiTruck /> },
    { label: "Customer Accounts", link: "/admin/customer-accounts", icon: <FiUsers /> },
    { label: "Cars", link: "/admin/cars", icon: <FaCar /> },
    { label: "WasherDocuments", link: "/admin/washer-documents", icon: <FiAlertCircle /> },
    { label: "Emergency Wash", link: "/admin/emergency-wash", icon: <FiWind /> },
    { label: "Scan QR", link: "/admin/scan-qr", icon: <FiAlertCircle /> },
  ];

  const financeMenu = [
    { label: "Revenue", link: "/admin/AllRevenue", icon: <FiDollarSign /> },
    { label: "Earnings", link: "/admin/earnings", icon: <FiTrendingUp /> },
    { label: "Bank Account", link: "/admin/bank-account", icon: <FiCreditCard /> },
    { label: "Pass Expirations", link: "/admin/pass-expirations", icon: <FiAward /> },
    { label: "Loyalty Dashboard", link: "/admin/loyalty-dashboard", icon: <FiGift /> },
  ];

  const reportsMenu = [
    { label: "Analytics", link: "/admin/analytics", icon: <FiTrendingUp /> },
    { label: "Booking Reports", link: "/admin/booking-reports", icon: <FiClipboard /> },
    { label: "Revenue Reports", link: "/admin/revenue-reports", icon: <FiDollarSign /> },
  ];

  const adminAccountMenu = [
    { label: "Settings", link: "/admin/settings", icon: <FiSettings /> },
    { label: "Profile", link: "/profile", icon: <FiUser /> },
    { label: "About Us", link: "/about-us", icon: <FiInfo /> },
  ];

  const isCustomer = role === "customer";
  const isAdmin = role === "admin";

  return (
    <>
      {/* PROFESSIONAL LIGHT NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-blue-200 shadow-sm z-50">
        <div className="w-full mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="text-2xl font-extrabold text-slate-900 flex items-center gap-1 shrink-0"
          >
            <span className="bg-linear-to-r from-blue-700 to-blue-600 text-transparent bg-clip-text">CarWash</span>
            <span className="text-blue-600">+</span>
          </Link>

          {/* DESKTOP MENU - CUSTOMER */}
          {isCustomer && (
            <div className="hidden lg:flex items-center gap-6">
              {/* Main Menu Items */}
              {customerMainMenu.map((m) => (
                <Link
                  key={m.label}
                  to={m.link}
                  className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    location.pathname === m.link
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:text-blue-600"
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  {m.label}
                </Link>
              ))}

              {/* Services Dropdown */}
              <div className="relative group">
                <button
                  className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-50"
                  onMouseEnter={() => setServicesDropdown(true)}
                  onMouseLeave={() => setServicesDropdown(false)}
                >
                  Services
                  <FiChevronDown className={`transition-transform ${servicesDropdown ? "rotate-180" : ""}`} size={16} />
                </button>

                {/* Services Dropdown Menu */}
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${servicesDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setServicesDropdown(true)}
                  onMouseLeave={() => setServicesDropdown(false)}
                >
                  <div className="py-2">
                    {servicesMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payments Dropdown */}
              <div className="relative group">
                <button
                  className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-50"
                  onMouseEnter={() => setPaymentsDropdown(true)}
                  onMouseLeave={() => setPaymentsDropdown(false)}
                >
                  Payments
                  <FiChevronDown className={`transition-transform ${paymentsDropdown ? "rotate-180" : ""}`} size={16} />
                </button>

                {/* Payments Dropdown Menu */}
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${paymentsDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setPaymentsDropdown(true)}
                  onMouseLeave={() => setPaymentsDropdown(false)}
                >
                  <div className="py-2">
                    {paymentsMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* My Account Dropdown */}
              <div className="relative group">
                <button
                  className="px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-50"
                  onMouseEnter={() => setAccountDropdown(true)}
                  onMouseLeave={() => setAccountDropdown(false)}
                >
                  My Account
                  <FiChevronDown className={`transition-transform ${accountDropdown ? "rotate-180" : ""}`} size={16} />
                </button>

                {/* Account Dropdown Menu */}
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${accountDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setAccountDropdown(true)}
                  onMouseLeave={() => setAccountDropdown(false)}
                >
                  <div className="py-2">
                    {accountMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                    <div className="border-t border-blue-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut size={18} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP MENU - ADMIN */}
          {isAdmin && (
            <div className="hidden lg:flex items-center gap-1">
              {/* Main Menu Items */}
              {adminMainMenu.map((m) => (
                <Link
                  key={m.label}
                  to={m.link}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    location.pathname === m.link
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  {m.label}
                </Link>
              ))}

              {/* Operations Dropdown */}
              <div className="relative group">
                <button
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                  onMouseEnter={() => setOperationsDropdown(true)}
                  onMouseLeave={() => setOperationsDropdown(false)}
                >
                  Operations
                  <FiChevronDown className={`transition-transform ${operationsDropdown ? "rotate-180" : ""}`} size={16} />
                </button>
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${operationsDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setOperationsDropdown(true)}
                  onMouseLeave={() => setOperationsDropdown(false)}
                >
                  <div className="py-2">
                    {operationsMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Finance Dropdown */}
              <div className="relative group">
                <button
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                  onMouseEnter={() => setFinanceDropdown(true)}
                  onMouseLeave={() => setFinanceDropdown(false)}
                >
                  Finance
                  <FiChevronDown className={`transition-transform ${financeDropdown ? "rotate-180" : ""}`} size={16} />
                </button>
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${financeDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setFinanceDropdown(true)}
                  onMouseLeave={() => setFinanceDropdown(false)}
                >
                  <div className="py-2">
                    {financeMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reports Dropdown */}
              <div className="relative group">
                <button
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                  onMouseEnter={() => setReportsDropdown(true)}
                  onMouseLeave={() => setReportsDropdown(false)}
                >
                  Reports
                  <FiChevronDown className={`transition-transform ${reportsDropdown ? "rotate-180" : ""}`} size={16} />
                </button>
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${reportsDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setReportsDropdown(true)}
                  onMouseLeave={() => setReportsDropdown(false)}
                >
                  <div className="py-2">
                    {reportsMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* My Account Dropdown */}
              <div className="relative group">
                <button
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                  onMouseEnter={() => setAdminAccountDropdown(true)}
                  onMouseLeave={() => setAdminAccountDropdown(false)}
                >
                  My Account
                  <FiChevronDown className={`transition-transform ${adminAccountDropdown ? "rotate-180" : ""}`} size={16} />
                </button>
                <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${adminAccountDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  onMouseEnter={() => setAdminAccountDropdown(true)}
                  onMouseLeave={() => setAdminAccountDropdown(false)}
                >
                  <div className="py-2">
                    {adminAccountMenu.map((item) => (
                      <Link
                        key={item.label}
                        to={item.link}
                        className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <span className="text-base text-blue-600">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                    <div className="border-t border-blue-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut size={18} />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {/* NOTIFICATION ICON */}
            {isCustomer && (
              <div className="relative">
                <button
                  onClick={() => setNotificationDropdown(!notificationDropdown)}
                  className="relative text-slate-700 hover:text-blue-600 transition text-2xl hover:scale-110"
                >
                  <FiBell size={24} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                </button>

                {/* NOTIFICATION DROPDOWN */}
                {notificationDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-blue-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between">
                      <h3 className="font-bold text-lg">Notifications</h3>
                      <button
                        onClick={() => setNotificationDropdown(false)}
                        className="hover:bg-white/20 p-1 rounded transition"
                      >
                        <FiX size={20} />
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${
                              notif.type === "success"
                                ? "border-l-4 border-l-green-500 bg-green-50/30"
                                : notif.type === "offer"
                                ? "border-l-4 border-l-purple-500 bg-purple-50/30"
                                : "border-l-4 border-l-blue-500 bg-blue-50/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${
                                notif.type === "success"
                                  ? "bg-green-200 text-green-700"
                                  : notif.type === "offer"
                                  ? "bg-purple-200 text-purple-700"
                                  : "bg-blue-200 text-blue-700"
                              }`}>
                                {notif.type === "success" ? "✓" : notif.type === "offer" ? "🎉" : "ℹ"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 break-words">{notif.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <Link
                        to="#"
                        className="text-center block text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                        onClick={() => setNotificationDropdown(false)}
                      >
                        View All Notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USER PROFILE */}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{userDetails?.name || "User"}</p>
                  <p className="text-xs text-slate-500 capitalize">{role}</p>
                </div>
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
                  className="w-8 h-8 rounded-full border-2 border-blue-600"
                  alt="Profile"
                />
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              className="lg:hidden text-slate-900 text-2xl hover:text-blue-600 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* DESKTOP LOGOUT */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-blue-200 p-4 space-y-2 max-h-[calc(100vh-64px)] overflow-y-auto">
            {isCustomer && (
              <>
                {/* Main Menu Items */}
                {customerMainMenu.map((m) => (
                  <Link
                    key={m.label}
                    to={m.link}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      location.pathname === m.link
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    {m.label}
                  </Link>
                ))}

                {/* Services Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">Services</p>
                  {servicesMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Payments Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">Payments</p>
                  {paymentsMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* My Account Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">My Account</p>
                  {accountMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {isAdmin && (
              <>
                {/* Main Menu Items */}
                {adminMainMenu.map((m) => (
                  <Link
                    key={m.label}
                    to={m.link}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      location.pathname === m.link
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    {m.label}
                  </Link>
                ))}

                {/* Operations Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">Operations</p>
                  {operationsMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Finance Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">Finance</p>
                  {financeMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Reports Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">Reports</p>
                  {reportsMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* My Account Section */}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="px-4 py-2 font-semibold text-slate-700 text-sm">My Account</p>
                  {adminAccountMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 ml-4"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* MOBILE USER INFO & LOGOUT */}
            <div className="border-t border-blue-200 pt-4 mt-4">
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg mb-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
                    className="w-8 h-8 rounded-full border-2 border-blue-600"
                    alt="Profile"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">User</p>
                    <p className="text-sm font-semibold text-slate-900">{userDetails?.name || user?.email}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* TOP PADDING */}
      <div className="h-16" />
    </>
  );
}
