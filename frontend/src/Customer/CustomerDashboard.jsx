import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NotificationBell from "../components/NotificationBell";
import {
  FiMenu,
  FiBell,
  FiCalendar,
  FiMapPin,
  FiTrendingUp,
  FiCheckCircle,
  FiDollarSign,
  FiLogOut,
  FiChevronLeft,
  FiClipboard,
  FiUser,
  FiHome,
  FiTag,
  FiGift,
  FiCreditCard,
  FiTruck,
  FiAward,
  FiSettings,
} from "react-icons/fi";
import { FaCar, FaStar } from "react-icons/fa";

export default function CustomerDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("customer");

  const [bookings, setBookings] = useState([]);
  const [currentPass, setCurrentPass] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      try {
        const res = await fetch(
          `http://localhost:5000/pass/current/${auth.user.id}`
        );
        const result = await res.json();

        if (result.success && result.data) {
          setCurrentPass(result.data);
          console.log("✅ Active pass loaded:", result.data);
        } else {
          console.log("ℹ️ No active pass found");
          setCurrentPass(null);
        }
      } catch (err) {
        console.error("❌ Error fetching pass:", err);
        setCurrentPass(null);
      }
    };

    load();
  }, []);

  /* LOAD LOGGED-IN CUSTOMER + BOOKINGS + WALLET */
  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        setUser(auth.user);

        // Fetch bookings from backend API instead of direct Supabase query to avoid RLS issues
        try {
          const response = await fetch(
            `http://localhost:5000/bookings/customer/${auth.user.id}`
          );
          const result = await response.json();
          
          if (result.success) {
            setBookings(result.bookings || []);

            // Calculate completed bookings
            const completed = (result.bookings || []).filter((b) => b.status === "Completed").length;
            setCompletedBookings(completed);

            // Calculate loyalty points (1.5 points per completed booking, with tier bonuses)
            const loyaltyPts = completed > 0 ? Math.floor(completed * 1.5 * 10) : 0;
            setLoyaltyPoints(loyaltyPts);
          } else {
            console.error("❌ Error fetching bookings:", result.error);
            setBookings([]);
          }
        } catch (err) {
          console.error("❌ Error fetching bookings from backend:", err);
          setBookings([]);
        }

        // Fetch wallet balance
        await fetchWalletBalance(auth.user.id);
      } catch (err) {
        console.error("❌ Error loading customer data:", err);
        setBookings([]);
      }
    };

    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Fetch wallet balance from transactions
  const fetchWalletBalance = async (customerId) => {
    try {
      // Send userId in query params for backend authentication
      const url = new URL(
        `http://localhost:5000/transactions/customer/${customerId}`
      );
      url.searchParams.append('user_id', customerId);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();

      if (result.success && result.transactions) {
        // Calculate wallet balance (credit transactions only)
        const balance = result.transactions
          .filter(
            (tx) =>
              tx.direction === "credit" &&
              (tx.status === "success" || tx.status === "pending")
          )
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        // Calculate total spent (debit transactions + card payments)
        const spent = result.transactions
          .filter(
            (tx) =>
              (tx.direction === "debit" && tx.status === "success") ||
              (tx.payment_method === "card" && tx.status === "success")
          )
          .reduce((sum, tx) => sum + (tx.total_amount || tx.amount || 0), 0);

        setWalletBalance(balance);
        setTotalSpent(spent);
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch wallet balance:", err);
      setWalletBalance(0);
      setTotalSpent(0);
    }
  };

  // Refresh active pass (call this after purchasing a pass)
  const refreshActivePass = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    try {
      const res = await fetch(
        `http://localhost:5000/pass/current/${auth.user.id}`
      );
      const result = await res.json();

      if (result.success && result.data) {
        setCurrentPass(result.data);
        console.log("✅ Pass refreshed:", result.data);
      } else {
        setCurrentPass(null);
      }
    } catch (err) {
      console.error("❌ Error refreshing pass:", err);
    }
  };

  // Submit rating to backend
  const submitRating = async () => {
    if (!selectedBooking || rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      const ratingData = {
        booking_id: selectedBooking.id,
        customer_id: user.id,
        rating: rating,
        comment: ratingComment,
        car_name: selectedBooking.car_name,
        service_date: selectedBooking.date,
      };

      const response = await fetch(
        "http://localhost:5000/bookings/add-rating",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ratingData),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("✅ Rating submitted successfully!");
        
        // Update booking status to include rating
        const updatedBookings = bookings.map((b) =>
          b.id === selectedBooking.id ? { ...b, has_rated: true } : b
        );
        setBookings(updatedBookings);

        // Close modal and reset
        setShowRatingModal(false);
        setSelectedBooking(null);
        setRating(0);
        setRatingComment("");
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Rating submission error:", err);
      alert(`Error submitting rating: ${err.message}`);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Open rating modal for completed booking
  const openRatingModal = (booking) => {
    if (booking.status === "Completed" && !booking.has_rated) {
      setSelectedBooking(booking);
      setRating(0);
      setRatingComment("");
      setShowRatingModal(true);
    }
  };

  const customerMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/customer-dashboard" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
    { name: "Location", icon: <FiMapPin />, link: "/location" },
    { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
    { name: "Account Settings", icon: <FiSettings />, link: "/account-settings" },
  ];

  const stats = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: <FiClipboard />,
      change: `${bookings.length} bookings total`,
    },
    {
      title: "Completed",
      value: completedBookings,
      icon: <FiCheckCircle />,
      change: `${completedBookings > 0 ? "All successful" : "No completed yet"}`,
    },
    {
      title: "Total Spent",
      value: `₹${totalSpent.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
      icon: <FiDollarSign />,
      change: `${completedBookings} bookings completed`,
    },
    {
      title: "Loyalty Points",
      value: loyaltyPoints,
      icon: <FiTrendingUp />,
      change: `${Math.floor(loyaltyPoints / 10)} tier rewards`,
    },
  ];

  // Active bookings (bookings with status not Completed)
  const activeBookings = bookings.filter((b) => b.status !== "Completed");

  // Offers/Promotions mock data
  const offers = [
    {
      id: 1,
      title: "30% Off Premium Wash",
      code: "PREMIUM30",
      discount: "30%",
      icon: "🎯",
    },
    {
      id: 2,
      title: "Free Interior Clean",
      code: "INTERIOR",
      discount: "Free",
      icon: "✨",
    },
    {
      id: 3,
      title: "Loyalty Bonus",
      code: "LOYAL100",
      discount: "+100 pts",
      icon: "⭐",
    },
  ];

  // Notifications mock data
  const notifications = [
    {
      id: 1,
      message: "Your booking is confirmed for today at 2:00 PM",
      type: "success",
    },
    { id: 2, message: "New offer: 50% off on monthly pass", type: "offer" },
    { id: 3, message: "Your vehicle is ready for pickup", type: "info" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo Row */}
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>

          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg 
                mb-2 font-medium transition-all
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
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

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            text-white px-4 py-2 font-semibold rounded-lg cursor-pointer 
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header
          className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg"
        >
          <h1 className="text-2xl font-bold">My Dashboard</h1>

          <div className="flex items-center gap-8">
            <NotificationBell />

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold">Welcome back 👋</h1>
            <p className="text-slate-400 text-sm mt-1">
              Check your bookings and service history
            </p>
          </div>

          {/* 🎯 QUICK ACTIONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/bookings"
              className="bg-linear-to-br from-blue-600/30 to-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-center hover:scale-105 transition-transform group cursor-pointer"
            >
              <FiTruck className="text-3xl mx-auto mb-2 text-blue-400 group-hover:text-blue-300" />
              <p className="text-xs font-semibold text-white">Book a Wash</p>
            </Link>

            <Link
              to="/monthly-pass"
              className="bg-linear-to-br from-purple-600/30 to-purple-900/30 border border-purple-500/50 rounded-lg p-4 text-center hover:scale-105 transition-transform group cursor-pointer"
            >
              <FiAward className="text-3xl mx-auto mb-2 text-purple-400 group-hover:text-purple-300" />
              <p className="text-xs font-semibold text-white">Monthly Pass</p>
            </Link>

            <Link
              to="/my-cars"
              className="bg-linear-to-br from-green-600/30 to-green-900/30 border border-green-500/50 rounded-lg p-4 text-center hover:scale-105 transition-transform group cursor-pointer"
            >
              <FaCar className="text-3xl mx-auto mb-2 text-green-400 group-hover:text-green-300" />
              <p className="text-xs font-semibold text-white">My Cars</p>
            </Link>

            <Link
              to="/transactions"
              className="bg-linear-to-br from-pink-600/30 to-pink-900/30 border border-pink-500/50 rounded-lg p-4 text-center hover:scale-105 transition-transform group cursor-pointer"
            >
              <FiCreditCard className="text-3xl mx-auto mb-2 text-pink-400 group-hover:text-pink-300" />
              <p className="text-xs font-semibold text-white">Transactions</p>
            </Link>
            <Link
  to="/location"
  className="bg-slate-900/60 backdrop-blur border border-slate-700 rounded-xl p-4 text-center hover:bg-slate-800 hover:scale-[1.03] transition-all cursor-pointer group"
>
  <FiMapPin className="text-3xl mx-auto mb-2 text-blue-400 group-hover:text-blue-300" />
  <p className="text-sm font-semibold text-blue-200">Location</p>
</Link>

          </div>

          {/* 🌈 STAT CARDS — DARK THEME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-xl p-6 shadow-lg border border-slate-800 
                bg-linear-to-br
                ${
                  index % 2 === 0
                    ? "from-blue-600/20 to-blue-900/20"
                    : "from-purple-600/20 to-pink-900/20"
                }
                hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">
                    {item.title}
                  </p>
                  <span className="text-2xl text-blue-400 opacity-60">
                    {item.icon}
                  </span>
                </div>
                <p className="text-4xl font-bold text-white">{item.value}</p>
                <p className="text-blue-400 text-xs mt-2 font-medium">
                  {item.change}
                </p>
              </div>
            ))}
          </div>

          {/* 💳 WALLET & MONTHLY PASS STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Wallet Balance */}
            <div className="bg-linear-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiDollarSign className="text-emerald-400" />
                  Wallet Balance
                </h3>
                <span className="text-xs bg-emerald-600/30 px-3 py-1 rounded-full text-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-4xl font-bold text-emerald-400 mb-2">
                ₹{walletBalance.toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-slate-300 mb-4">
                Available for bookings
              </p>
              <div className="space-y-2">
                <Link
                  to="/transactions"
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
                >
                  Add Money
                </Link>
                <div className="text-xs text-slate-400 mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="flex justify-between mb-2">
                    <span>Total Spent:</span>
                    <span className="text-emerald-300 font-semibold">
                      ₹{totalSpent.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Pass Status */}
            <div
              className="
    bg-[#0F1624] 
    border border-amber-500/40 
    rounded-xl p-6 shadow-xl 
    relative
"
              style={{
                boxShadow: "0 0 25px rgba(255,193,7,0.25)", // 🔥 AMBER GLOW
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiAward className="text-amber-400" />
                  Monthly Pass
                </h3>

                {currentPass ? (
                  <span className="text-xs bg-amber-600/20 px-3 py-1 rounded-full text-amber-300">
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-red-600/20 px-3 py-1 rounded-full text-red-300">
                    No Pass
                  </span>
                )}
              </div>

              {!currentPass ? (
                <>
                  <p className="text-sm text-slate-400 mb-4">
                    You have no active pass.
                  </p>

                  {/* LEFT ALIGNED BUTTON */}
                  <div className="flex justify-start">
                    <Link
                      to="/monthly-pass"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium transition"
                    >
                      Buy Pass Now
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* PLAN NAME */}
                  <p className="text-xl font-bold text-amber-400">
                    {currentPass.total_washes === 4
                      ? "Basic Plan"
                      : currentPass.total_washes === 8
                      ? "Standard Plan"
                      : currentPass.total_washes === 16
                      ? "Premium Plan"
                      : "Monthly Plan"}
                  </p>

                  {/* WASHES USED */}
                  <p className="text-sm text-slate-400 mt-1">
                    {currentPass.total_washes - currentPass.remaining_washes}/
                    {currentPass.total_washes} washes used
                  </p>

                  {/* PROGRESS BAR */}
                  <div className="w-full bg-slate-700/40 rounded-full h-2 mt-3">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((currentPass.total_washes -
                            currentPass.remaining_washes) /
                            currentPass.total_washes) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>

                  {/* EXPIRY */}
                  <p className="text-sm text-slate-400 mt-3">
                    Expires:{" "}
                    <span className="text-white font-medium">
                      {new Date(currentPass.valid_till).toLocaleDateString()}
                    </span>
                  </p>

                  {/* LEFT ALIGNED BUTTON */}
                  <div className="mt-4 flex justify-start">
                    <Link
                      to="/monthly-pass"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium transition"
                    >
                      Manage / Renew
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 🔔 NOTIFICATIONS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiBell className="text-blue-400" />
              Recent Notifications
            </h2>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg text-sm border-l-4 ${
                    notif.type === "success"
                      ? "bg-green-600/10 border-green-500 text-green-300"
                      : notif.type === "offer"
                      ? "bg-purple-600/10 border-purple-500 text-purple-300"
                      : "bg-blue-600/10 border-blue-500 text-blue-300"
                  }`}
                >
                  {notif.message}
                </div>
              ))}
            </div>
          </div>

          {/* 🎁 OFFERS & PROMOTIONS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiGift className="text-pink-400" />
              Active Offers & Promotions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-linear-to-br from-pink-600/15 to-rose-900/15 border border-pink-500/30 rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{offer.icon}</span>
                    <span className="text-xs bg-pink-600/40 text-pink-300 px-2 py-1 rounded font-semibold">
                      {offer.discount}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">
                    {offer.title}
                  </p>
                  <p className="text-xs text-slate-400 mb-3">
                    Code:{" "}
                    <span className="text-pink-400 font-mono font-bold">
                      {offer.code}
                    </span>
                  </p>
                  <button className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-xs font-medium transition">
                    Claim Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 🚗 RECENT BOOKINGS / ACTIVE BOOKINGS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">
                {activeBookings.length > 0
                  ? "Active & Recent Bookings"
                  : "Your Bookings"}
              </h2>
              <Link
                to="/bookings"
                className="text-blue-400 text-sm hover:text-blue-300 transition font-medium"
              >
                View All →
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="py-12 text-center">
                <FaCar className="text-4xl text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  No bookings yet. Start your first wash!
                </p>
                <Link
                  to="/bookings"
                  className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
                >
                  Book Now
                </Link>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 text-left font-medium">Car</th>
                      <th className="py-3 text-left font-medium">
                        Date & Time
                      </th>
                      <th className="py-3 text-left font-medium">Location</th>
                      <th className="py-3 text-left font-medium">Amount</th>
                      <th className="py-3 text-left font-medium">Status</th>
                      <th className="py-3 text-left font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.slice(0, 5).map((b, idx) => (
                      <tr
                        key={b.id || idx}
                        className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 flex items-center gap-2">
                          <FaCar className="text-blue-400" />
                          {b.car_name || "Car"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-slate-500" />
                            {b.date || "N/A"}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="text-slate-500" />
                            {b.location || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-blue-400">
                          {b.amount || "₹299"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              b.status === "Completed"
                                ? "bg-green-600/25 text-green-300"
                                : b.status === "In Progress"
                                ? "bg-yellow-600/25 text-yellow-300"
                                : b.status === "Cancelled"
                                ? "bg-red-600/25 text-red-300"
                                : "bg-slate-600/25 text-slate-300"
                            }`}
                          >
                            {b.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3">
                          {b.status === "Completed" && !b.has_rated ? (
                            <button
                              onClick={() => openRatingModal(b)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium transition flex items-center gap-1"
                            >
                              ⭐ Rate
                            </button>
                          ) : b.status === "Completed" && b.has_rated ? (
                            <span className="text-xs text-green-400 font-medium">✅ Rated</span>
                          ) : (b.status === "In Progress" || b.status === "Confirmed" || b.status === "Pending") ? (
                            <Link
                              to={`/location`}
                              state={{ bookingId: b.id }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition inline-block"
                            >
                              📍 Track
                            </Link>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* ⭐ RATING MODAL */}
        {showRatingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-linear-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Rate Your Service</h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-2xl text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Service Details */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-2">
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-white">{selectedBooking.car_name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Completed on {selectedBooking.date}
                </p>
              </div>

              {/* Rating Stars */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-300 mb-4">
                  How was your experience?
                </p>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition transform hover:scale-125"
                    >
                      <FaStar
                        size={40}
                        className={`${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-600"
                        } transition`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-3 text-yellow-400 font-semibold">
                    {rating} out of 5 stars
                  </p>
                )}
              </div>

              {/* Comment (Optional) */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-slate-300 block mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your feedback about the service..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || submittingRating}
                  className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      ⭐ Submit Rating
                    </>
                  )}
                </button>
              </div>

              {/* Rating Info */}
              <p className="text-center text-xs text-slate-500 mt-4">
                Your rating helps us improve our service
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}