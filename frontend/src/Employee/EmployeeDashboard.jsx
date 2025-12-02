import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { FiMenu, FiBell, FiCalendar, FiMapPin, FiTrendingUp, FiDollarSign, FiLogOut, FiChevronLeft, FiUser, FiHome, FiClock, FiCheckCircle, FiAlertCircle, FiClipboard, FiX } from "react-icons/fi";
import { FaCar, FaStar, FaPhone } from "react-icons/fa";


export default function EmployeeDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [assignments, setAssignments] = useState([]);
  const [earnings, setEarnings] = useState({ thisMonthEarnings: 0, totalEarnings: 0 });
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  /* LOAD LOGGED-IN EMPLOYEE + ASSIGNMENTS */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      try {
        // Fetch bookings from backend API
        const response = await fetch(`http://localhost:5000/employee/bookings/${auth.user.id}`);
        if (response.ok) {
          const result = await response.json();
          console.log("Bookings fetched successfully:", result.bookings?.length || 0);
          setAssignments(result.bookings || []);
        } else {
          console.error("Backend error fetching bookings");
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setAssignments([]);
      }

      // Calculate average rating from completed bookings (will update after assignments are set)
    };

    load();
  }, []);

  /* CALCULATE RATINGS AND LOAD NOTIFICATIONS */
  useEffect(() => {
    if (assignments.length > 0 && user?.id) {
      // Calculate average rating from completed bookings
      const completedJobs = assignments.filter(b => b.status === "Completed" && b.rating);
      if (completedJobs.length > 0) {
        const avgRating = (completedJobs.reduce((sum, b) => sum + (b.rating || 0), 0) / completedJobs.length).toFixed(1);
        setAverageRating(parseFloat(avgRating));
        setRatingCount(completedJobs.length);
      }

      // Fetch earnings from transactions
      fetchEarnings(user.id);

      // Load notifications
      loadNotifications(user.id);
    }
  }, [assignments, user]);

  /* LOAD NOTIFICATIONS FOR EMPLOYEE */
  const loadNotifications = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/notifications/user/${userId}`);
      const data = await response.json();
      
      if (data.success && data.notifications) {
        // Map notifications to include display format
        const formattedNotifications = data.notifications.map((notif) => ({
          ...notif,
          icon: getNotificationIcon(notif.type),
          time: getTimeAgo(notif.created_at || new Date()),
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  /* FETCH EARNINGS FROM TRANSACTIONS */
  const fetchEarnings = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/earnings/dashboard-summary/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setEarnings({
          thisMonthEarnings: data.data.thisMonthEarnings || 0,
          totalEarnings: data.data.thisMonthEarnings || 0 // Using this month for display
        });
      }
    } catch (error) {
      console.error("Failed to load earnings:", error);
    }
  };

  /* GET NOTIFICATION ICON BASED ON TYPE */
  const getNotificationIcon = (type) => {
    const icons = {
      rating: "⭐",
      upcoming: "🚗",
      completed: "✅",
      payment: "💰",
      rating_needed: "⭐",
      new_job: "📋",
    };
    return icons[type] || "📢";
  };

  /* FORMAT TIME AGO */
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee-dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Ratings", icon: <FaStar />, link: "/employee/ratings" },
    { name: "Cars", icon: <FaCar />, link: "/employee/cars" },
    { name: "Locations", icon: <FiMapPin />, link: "/employee/location" },
  ];

  // Filter pending and completed bookings
  const pendingBookings = assignments.filter(a => a.status !== "Completed");
  const completedBookings = assignments.filter(a => a.status === "Completed");

  const stats = [
    { title: "Today's Pending Jobs", value: pendingBookings.length, icon: <FiClock />, change: "Awaiting action" },
    { title: "Completed", value: completedBookings.length, icon: <FiCheckCircle />, change: "Total completed" },
    { title: "Earnings This Month", value: "₹" + parseFloat(earnings.thisMonthEarnings).toLocaleString('en-IN', { maximumFractionDigits: 2 }), icon: <FiDollarSign />, change: "From transactions" },
    { title: "Average Rating", value: averageRating > 0 ? averageRating.toFixed(1) : "N/A", icon: <FaStar />, change: ratingCount > 0 ? `${ratingCount} ratings` : "No ratings yet" },
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
          {employeeMenu.map((item) => (
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
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>

        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg">

          <h1 className="text-2xl font-bold">My Dashboard</h1>

          <div className="flex items-center gap-8 relative">
            {/* NOTIFICATIONS BELL */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xl text-slate-300 hover:text-blue-400 transition relative group"
            >
              <FiBell />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                Notifications ({notifications.length})
              </span>
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto top-12">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-white transition"
                  >
                    <FiX />
                  </button>
                </div>

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition cursor-pointer last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{notif.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            )}

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
            <p className="text-slate-400 text-sm mt-1">Manage your jobs and track your earnings</p>
          </div>

          {/* 🌈 STAT CARDS — DARK THEME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-xl p-6 shadow-lg border border-slate-800 
                bg-linear-to-br
                ${index % 2 === 0 ? "from-blue-600/20 to-blue-900/20" : "from-purple-600/20 to-pink-900/20"}
                hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">{item.title}</p>
                  <span className="text-2xl text-blue-400 opacity-60">{item.icon}</span>
                </div>
                <p className="text-4xl font-bold text-white">{item.value}</p>
                <p className="text-blue-400 text-xs mt-2 font-medium">{item.change}</p>
              </div>
            ))}
          </div>

          {/* 📊 EARNINGS CHART PLACEHOLDER */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Weekly Earnings</h2>
            <div className="h-56 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
              <div className="text-center">
                <FiTrendingUp className="text-4xl mx-auto mb-2 opacity-50" />
                <p>Chart Coming Soon</p>
              </div>
            </div>
          </div>

          {/* 🚗 TODAY'S ASSIGNMENTS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Today's Jobs</h2>
              <Link to="/employee/jobs" className="text-blue-400 text-sm hover:text-blue-300 transition font-medium">
                View All →
              </Link>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="py-12 text-center">
                <FaCar className="text-4xl text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">All jobs completed! Great work! 🎉</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 text-left font-medium">Customer</th>
                      <th className="py-3 text-left font-medium">Car</th>
                      <th className="py-3 text-left font-medium">Time</th>
                      <th className="py-3 text-left font-medium">Location</th>
                      <th className="py-3 text-left font-medium">Amount</th>
                      <th className="py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendingBookings.slice(0, 5).map((job, idx) => (
                      <tr key={job.id || idx} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition">
                        <td className="py-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                            {job.customer_name?.charAt(0) || "C"}
                          </div>
                          {job.customer_name || "Customer"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FaCar className="text-blue-400" />
                            {job.car_name || "Car"}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-slate-500" />
                            {job.slot_time || "10:00 AM"}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="text-slate-500" />
                            {job.location || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-green-400">
                          ₹{job.amount || "299"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              job.status === "Completed"
                                ? "bg-green-600/25 text-green-300"
                                : job.status === "In Progress"
                                ? "bg-yellow-600/25 text-yellow-300"
                                : job.status === "Cancelled"
                                ? "bg-red-600/25 text-red-300"
                                : "bg-blue-600/25 text-blue-300"
                            }`}
                          >
                            {job.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 📞 SUPPORT & TIPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quick Tips */}
            <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiAlertCircle className="text-blue-400" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>✓ Accept jobs within 30 seconds for better ratings</li>
                <li>✓ Arrive 5 minutes early for a 10% bonus</li>
                <li>✓ Complete jobs on time to maintain 5-star rating</li>
                <li>✓ Take photos before and after each wash</li>
              </ul>
            </div>

            {/* Support Card */}
            <div className="bg-linear-to-br from-purple-600/20 to-pink-900/20 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaPhone className="text-purple-400" />
                Need Help?
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Contact our support team for any issues or questions.
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition">
                Contact Support
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
