import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import ApprovalPanel from "./ApprovalPanel";
import ExpiredPassesNotification from "./ExpiredPassesNotification";
import AdminLoyaltyDashboard from "./AdminLoyaltyDashboard";
import AdminDocumentVerification from "./AdminDocumentVerification";
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiBell,
  FiMenu,
  FiSettings,
  FiClipboard,
  FiLogOut,
  FiChevronLeft,
  FiCreditCard,
  FiAlertCircle,
  FiAward,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function AdminDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("admin");
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBookingsData, setRecentBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Build earnings URL with user_id for authentication
      const earningsUrl = new URL("http://localhost:5000/earnings/transactions/admin");
      if (user?.id) {
        earningsUrl.searchParams.append('user_id', user.id);
      }
      
      const [overviewRes, bookingsRes, earningsRes] = await Promise.all([
        fetch("http://localhost:5000/admin/analytics/overview").then((r) => r.json()),
        fetch("http://localhost:5000/admin/recent-bookings").then((r) => r.json()),
        fetch(earningsUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
          }
        }).then((r) => r.json()),
      ]);

      if (overviewRes.success) {
        setDashboardData(overviewRes.data);
        // Create notifications from data
        const notifs = [];
        if (overviewRes.data.today.bookings > 0) {
          notifs.push({
            id: 1,
            type: "booking",
            title: `${overviewRes.data.today.bookings} Bookings Today`,
            message: `Total revenue: ₹${overviewRes.data.today.revenue.toLocaleString()}`,
            time: "Just now",
            icon: "📅",
          });
        }
        if (overviewRes.data.today.newUsers > 0) {
          notifs.push({
            id: 2,
            type: "user",
            title: `${overviewRes.data.today.newUsers} New Users`,
            message: "Welcome to CarWash+",
            time: "Few minutes ago",
            icon: "👤",
          });
        }
        notifs.push({
          id: 3,
          type: "info",
          title: "Active Washers",
          message: `${overviewRes.data.today.washers} washers are currently active`,
          time: "Live",
          icon: "🧑‍🔧",
        });
        setNotifications(notifs);
      }

      if (bookingsRes.success) {
        setRecentBookingsData(bookingsRes.data.slice(0, 5));
      }

      // Fetch lifetime earnings from successful transactions
      if (earningsRes.success) {
        setLifetimeEarnings(parseFloat(earningsRes.data.totalEarnings) || 0);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const stats = [
    { title: "Today's Bookings", value: dashboardData?.today.bookings || "0", change: "+20%" },
    { title: "Revenue Today", value: `₹${dashboardData?.today.revenue.toLocaleString() || "0"}`, change: "+12%" },
    { title: "Active Washers", value: dashboardData?.today.washers || "0", change: "+2" },
    { title: "Lifetime Earnings", value: `₹${lifetimeEarnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, change: "All time" },
  ];

  const recentBookings = recentBookingsData.map((booking) => ({
    id: booking.id,
    customer: booking.customer_name || "N/A",
    car: booking.car_name || "N/A",
    city: booking.location || "N/A",
    slot: `${booking.time || "N/A"}`,
    status: booking.status || "Pending",
  }));

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard", id: "dashboard" },
    { name: "Approvals", icon: <FiAlertCircle />, link: null, id: "approvals" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings", id: "bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users", id: "users" },
    { name: "Riders", icon: <FiUsers />, link: "/admin/riders", id: "riders" },
    { name: "Customer Accounts", icon: <FiSettings />, link: "/admin/customer-accounts", id: "customer-accounts" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/admin/earnings", id: "earnings" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars", id: "cars" },
    { name: "Pass Expirations", icon: <FiAlertCircle />, link: null, id: "pass-expiration" },
    { name: "Loyalty Points", icon: <FiAward />, link: null, id: "loyalty-points" },
    { name: "Washer Documents", icon: <FiClipboard />, link: null, id: "washer-documents" },
    { name: "Scan QR", icon: <FiClipboard />, link: "/scan-customer-qr", id: "scan-qr" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue", id: "revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics", id: "analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account", id: "bank" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">

      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">CarWash+</h1>
        <FiMenu className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSidebarOpen(true)} />
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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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

          {!collapsed && (
            <FiChevronLeft className="text-slate-400" />
          )}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => {
            if (item.link) {
              return (
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
              );
            } else {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-4 px-3 py-2 rounded-lg 
                    mb-2 font-medium transition-all
                    ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                  title={collapsed ? item.name : ""}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </button>
              );
            }
          })}
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
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>

        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg">

          <h1 className="text-2xl font-bold">
            {activeSection === "approvals" ? "Employee Approvals" : "Admin Dashboard"}
          </h1>

          <div className="flex items-center gap-8">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-xl text-slate-300 hover:text-blue-400 transition relative"
              >
                <FiBell />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-slate-800/50 transition cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{notif.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-8">

          {/* APPROVALS SECTION */}
          {activeSection === "approvals" && <ApprovalPanel />}

          {/* PASS EXPIRATION SECTION */}
          {activeSection === "pass-expiration" && <ExpiredPassesNotification />}

          {/* LOYALTY POINTS SECTION */}
          {activeSection === "loyalty-points" && <AdminLoyaltyDashboard />}

          {/* WASHER DOCUMENTS SECTION */}
          {activeSection === "washer-documents" && <AdminDocumentVerification />}

          {/* DASHBOARD CONTENT */}
          {activeSection === "dashboard" && (
            <>
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Live business insights</p>
          </div>

          {/* 🌈 STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-xl p-6 shadow-lg border border-slate-800 
                bg-linear-to-br
                ${index % 2 === 0 ? "from-blue-600/20 to-blue-900/20" : "from-purple-600/20 to-pink-900/20"} 
                hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <p className="text-slate-400 text-sm font-medium">{item.title}</p>
                <p className="text-4xl font-bold mt-3 text-white">{item.value}</p>
                <p className="text-green-400 text-xs mt-2 font-medium">{item.change}</p>
              </div>
            ))}
          </div>

          {/* 📊 BOOKINGS TREND CHART */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Daily Bookings Trend</h2>
            {dashboardData?.total.bookings === 0 ? (
              <div className="h-56 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                <div className="text-center">
                  <FiTrendingUp className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No booking data available yet</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-1 h-64 p-4 bg-slate-800/50 rounded-lg overflow-x-auto">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const randomHeight = Math.random() * 100 + 20;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2 flex-1 min-w-12"
                    >
                      <div
                        className="w-full bg-linear-to-t from-blue-500 to-cyan-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                        style={{ height: `${randomHeight}%`, minHeight: "8px" }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {Math.floor(randomHeight / 10)} bookings
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(Date.now() - (6 - idx) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 📝 Recent Bookings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
              <Link to="/admin/all-bookings" className="text-blue-400 text-sm hover:text-blue-300 transition font-medium">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-400">Loading bookings...</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <p>No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 text-left font-medium">ID</th>
                      <th className="py-3 text-left font-medium">Customer</th>
                      <th className="py-3 text-left font-medium">Car</th>
                      <th className="py-3 text-left font-medium">City</th>
                      <th className="py-3 text-left font-medium">Time</th>
                      <th className="py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition">
                        <td className="py-3 font-medium text-blue-400 font-mono text-xs">{b.id}</td>
                        <td className="py-3">{b.customer}</td>
                        <td className="py-3">{b.car}</td>
                        <td className="py-3">{b.city}</td>
                        <td className="py-3 text-slate-400">{b.slot}</td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              b.status === "Completed"
                                ? "bg-green-600/25 text-green-300"
                                : b.status === "In Progress"
                                ? "bg-yellow-600/25 text-yellow-300"
                                : b.status === "Confirmed"
                                ? "bg-blue-600/25 text-blue-300"
                                : "bg-slate-600/25 text-slate-300"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
