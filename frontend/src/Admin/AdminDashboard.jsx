import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import ApprovalPanel from "./ApprovalPanel";
import ExpiredPassesNotification from "./ExpiredPassesNotification";
import AdminLoyaltyDashboard from "./AdminLoyaltyDashboard";
import AdminDocumentVerification from "./AdminDocumentVerification";
import NavbarNew from "../components/NavbarNew";
import {
  FiTrendingUp,
  FiDollarSign,
  FiSettings,
  FiClipboard,
  FiAlertCircle,
  FiAward,
  FiTruck,
  FiUsers,
  FiStar,
  FiBarChart2,
  FiCheckCircle,
  FiActivity,
  FiMapPin,
  FiHome
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userTaluko, setUserTaluko] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect(["admin", "sub-admin"]);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBookingsData, setRecentBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingTrendData, setBookingTrendData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [satisfactionData, setSatisfactionData] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get taluko and role
        const { data: profile } = await supabase
          .from("profiles")
          .select("taluko, role")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setUserTaluko(profile.taluko);
          setIsSubAdmin(profile.role === "sub-admin");
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [userTaluko, isSubAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Build query string for taluko if sub-admin
      const talukoQuery = isSubAdmin && userTaluko ? `?taluko=${encodeURIComponent(userTaluko)}` : "";
      
      const [overviewRes, bookingsRes, trendRes, locRes, perfRes, satRes] = await Promise.all([
        fetch("http://localhost:5000/admin/analytics/overview").then((r) => r.json()),
        fetch("http://localhost:5000/admin/recent-bookings").then((r) => r.json()),
        fetch("http://localhost:5000/admin/booking-trend").then((r) => r.json()).catch(() => ({ success: false })),
        fetch("http://localhost:5000/admin/location-stats").then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`http://localhost:5000/admin/washer-performance${talukoQuery}`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch("http://localhost:5000/admin/satisfaction-metrics").then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (overviewRes.success) {
        setDashboardData(overviewRes.data);
      }

      if (bookingsRes.success) {
        setRecentBookingsData(bookingsRes.data.slice(0, 5));
      }

      if (trendRes.success) {
        setBookingTrendData(trendRes.data || []);
      }

      if (locRes.success) {
        setLocationData(locRes.data || []);
      }

      if (perfRes.success) {
        setPerformanceData(perfRes.data || []);
      }

      if (satRes.success) {
        setSatisfactionData(satRes.data || {});
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
    { 
      title: "Today's Bookings", 
      value: dashboardData?.today.bookings || "0", 
      change: `+${dashboardData?.today.bookings || "0"} services completed`,
      icon: <FiTruck />,
      colors: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    { 
      title: "Active Washers", 
      value: dashboardData?.today.washers || "0", 
      change: "Serving customers now",
      icon: <FiActivity />,
      colors: "from-emerald-600 to-green-600",
      bgGradient: "from-emerald-50 to-green-50"
    }, 
    { 
      title: "Total Users", 
      value: dashboardData?.total.users || "0", 
      change: `+${dashboardData?.total.newUsers || "0"} joined today`,
      icon: <FiUsers />,
      colors: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    },
    { 
      title: "Completion Rate", 
      value: `${Math.round((dashboardData?.completionRate || 85))}%`, 
      change: "Services completed on time",
      icon: <FiCheckCircle />,
      colors: "from-orange-600 to-red-600",
      bgGradient: "from-orange-50 to-red-50"
    },
  ];

  const quickActions = [
    { to: "/admin/approvals", icon: FiAlertCircle, label: "Approvals", colors: "from-red-600 to-pink-600", bg: "from-red-50 to-pink-50", border: "border-red-200" },
    { to: "/admin/bookings", icon: FiClipboard, label: "Bookings", colors: "from-blue-600 to-cyan-600", bg: "from-blue-50 to-cyan-50", border: "border-blue-200" },
    { to: "/admin/users", icon: FiUsers, label: "Users", colors: "from-purple-600 to-pink-600", bg: "from-purple-50 to-pink-50", border: "border-purple-200" },
    { to: "/admin/earnings", icon: FiDollarSign, label: "Earnings", colors: "from-emerald-600 to-green-600", bg: "from-emerald-50 to-green-50", border: "border-emerald-200" },
    { to: "/admin/analytics", icon: FiTrendingUp, label: "Analytics", colors: "from-amber-600 to-orange-600", bg: "from-amber-50 to-orange-50", border: "border-amber-200" },
    { to: "/admin/settings", icon: FiSettings, label: "Settings", colors: "from-indigo-600 to-purple-600", bg: "from-indigo-50 to-purple-50", border: "border-indigo-200" },
  ];

  const recentBookings = recentBookingsData.map((booking) => ({
    id: booking.id,
    customer: booking.name || "N/A",
    car: booking.car_name || "N/A",
    city: booking.location || "N/A",
    slot: `${booking.time || "N/A"}`,
    status: booking.status || "Pending",
  }));

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin-dashboard", id: "dashboard" },
    { name: "Approvals", icon: <FiAlertCircle />, link: null, id: "approvals" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings", id: "bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users", id: "users" },
    { name: "Riders", icon: <FiUsers />, link: "/admin/riders", id: "riders" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/admin/earnings", id: "earnings" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars", id: "cars" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics", id: "analytics" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
            Admin Dashboard 🎯
          </h1>
          <p className="text-slate-600 text-base">
            Manage bookings, users, and track your business metrics in real-time
          </p>
        </div>

        {/* 🎯 QUICK ACTIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {quickActions.map(({ to, icon: Icon, label, colors, bg, border }) => (
            <Link
              key={label}
              to={to}
              className={`group rounded-xl p-5 border ${border} bg-gradient-to-br ${bg} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center cursor-pointer`}
            >
              <div className={`text-3xl mb-3 mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-r ${colors} text-white group-hover:scale-110 transition-transform`}>
                <Icon />
              </div>
              <p className="text-sm font-bold text-slate-900">{label}</p>
            </Link>
          ))}
        </div>

        {/* 📊 STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {stats.map((item) => (
            <div
              key={item.title}
              className={`bg-gradient-to-br ${item.bgGradient} rounded-2xl p-6 shadow-lg border border-opacity-30 hover:shadow-xl hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-700 text-sm font-semibold tracking-wide">
                  {item.title}
                </p>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.colors} text-white flex items-center justify-center text-xl opacity-90`}>
                  {item.icon}
                </div>
              </div>
              <p className={`text-4xl font-black bg-gradient-to-r ${item.colors} bg-clip-text text-transparent`}>
                {item.value}
              </p>
              <p className="text-slate-600 text-xs font-medium mt-3 leading-relaxed">
                {item.change}
              </p>
            </div>
          ))}
        </div>

        {/* 📈 CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Booking Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center">
                <FiTrendingUp />
              </div>
              Booking Trends
            </h3>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 flex items-center justify-center">
              {bookingTrendData.length > 0 ? (
                <div className="w-full h-full flex items-end gap-2 justify-center px-2">
                  {bookingTrendData.slice(-7).map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-cyan-500 group-hover:shadow-lg"
                        style={{ height: `${(item.count / Math.max(...bookingTrendData.map(x => x.count))) * 100}%` }}
                      />
                      <p className="text-xs text-slate-600 mt-2 text-center">{item.day}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 font-medium">No data available</p>
              )}
            </div>
          </div>

          {/* Location Distribution Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center">
                <FiMapPin />
              </div>
              Top Locations
            </h3>
            <div className="space-y-4">
              {locationData.length > 0 ? (
                locationData.slice(0, 5).map((location, idx) => {
                  const maxCount = Math.max(...locationData.map(x => x.count));
                  const percentage = (location.count / maxCount) * 100;
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{location.name}</span>
                        <span className="text-sm font-bold text-purple-600">{location.count} bookings</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all group-hover:from-purple-600 group-hover:to-pink-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 font-medium text-center py-4">No location data</p>
              )}
            </div>
          </div>
        </div>

        {/* 🏆 PERFORMANCE & SATISFACTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Washer Performance */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-center">
                <FiAward />
              </div>
              Top Performers
            </h3>
            <div className="space-y-4">
              {performanceData.length > 0 ? (
                performanceData.slice(0, 5).map((washer, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-amber-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{washer.name || `Washer ${idx + 1}`}</p>
                        <p className="text-xs text-slate-600">{washer.bookings || 0} bookings completed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiStar className="text-amber-500" />
                        <span className="font-bold text-amber-600">{washer.rating || "4.5"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 text-center py-4">No performance data</p>
              )}
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center justify-center">
                <FiStar />
              </div>
              Satisfaction Metrics
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Overall Rating</span>
                  <span className="text-2xl font-black text-green-600">{satisfactionData.overallRating || "4.8"}/5</span>
                </div>
                <p className="text-xs text-slate-600">Based on customer reviews</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-green-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Positive Feedback</span>
                  <span className="text-2xl font-black text-emerald-600">{satisfactionData.positiveFeedback || "92"}%</span>
                </div>
                <p className="text-xs text-slate-600">Customer satisfaction rate</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-green-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Response Time</span>
                  <span className="text-2xl font-black text-green-600">2 min</span>
                </div>
                <p className="text-xs text-slate-600">Average booking confirmation</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📈 TEAM OVERVIEW SECTION */}
        <div className="mb-10">
          {/* Users & Washers */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-center text-2xl">
                  <FiUsers />
                </div>
                Team Overview
              </h3>
              <span className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-full font-bold tracking-wide">
                ACTIVE
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Total Users</span>
                  <span className="text-3xl font-black text-emerald-600">{dashboardData?.total.users || "0"}</span>
                </div>
                <p className="text-xs text-slate-600">{dashboardData?.today.newUsers || "0"} new users today</p>
              </div>
              <div className="border-t border-emerald-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Active Washers</span>
                  <span className="text-3xl font-black text-green-600">{dashboardData?.today.washers || "0"}</span>
                </div>
                <p className="text-xs text-slate-600">Currently working on bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 Recent Bookings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center">
                <FiClipboard />
              </div>
              Recent Bookings
            </h2>
            <Link to="/admin/bookings" className="text-blue-600 text-sm hover:text-blue-700 transition font-bold">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-400 font-medium">Loading bookings...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <p className="font-medium">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-4 px-4 text-left font-bold">Booking ID</th>
                    <th className="py-4 px-4 text-left font-bold">Customer</th>
                    <th className="py-4 px-4 text-left font-bold">Car</th>
                    <th className="py-4 px-4 text-left font-bold">Location</th>
                    <th className="py-4 px-4 text-left font-bold">Time</th>
                    <th className="py-4 px-4 text-left font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                      <td className="py-4 px-4 font-bold text-blue-600 font-mono text-xs">{b.id.substring(0, 8)}</td>
                      <td className="py-4 px-4 font-semibold">{b.customer}</td>
                      <td className="py-4 px-4">{b.car}</td>
                      <td className="py-4 px-4 text-slate-600">{b.city}</td>
                      <td className="py-4 px-4 text-slate-600">{b.slot}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-bold ${
                            b.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : b.status === "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : b.status === "Confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
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

        {/* SECTIONS */}
        {activeSection === "approvals" && <ApprovalPanel />}
        {activeSection === "pass-expiration" && <ExpiredPassesNotification />}
        {activeSection === "loyalty-points" && <AdminLoyaltyDashboard />}
        {activeSection === "washer-documents" && <AdminDocumentVerification />}
      </main>
    </div>
  );
}
