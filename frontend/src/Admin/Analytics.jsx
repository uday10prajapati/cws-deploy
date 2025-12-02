import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { FiTrendingUp, FiBarChart2, FiPieChart, FiRefreshCw, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiUsers, FiDollarSign, FiBell, FiSettings, FiCreditCard, FiX } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function Analytics() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingsData, setBookingsData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  useRoleBasedRedirect("admin");

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
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [bookings, earnings, ratings, overview] = await Promise.all([
        fetch("http://localhost:5000/admin/analytics/bookings").then((r) => r.json()),
        fetch("http://localhost:5000/admin/analytics/earnings").then((r) => r.json()),
        fetch("http://localhost:5000/admin/analytics/ratings").then((r) => r.json()),
        fetch("http://localhost:5000/admin/analytics/overview").then((r) => r.json()),
      ]);

      setBookingsData(bookings.data);
      setEarningsData(earnings.data);
      setRatingsData(ratings.data);
      setOverviewData(overview.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/admin/earnings" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓ MOBILE TOP BAR ▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">CarWash+</h1>
        <FiMenu className="text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} />
      </div>

      {/* ▓▓ BACKDROP FOR MOBILE ▓▓ */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ▓▓ SIDEBAR ▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">{collapsed ? "CW" : "CarWash+"}</span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
                ${location.pathname === item.link ? "bg-blue-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"}
                ${collapsed ? "justify-center" : ""}
              `}
              onClick={() => setSidebarOpen(false)}
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
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓ MAIN CONTENT AREA ▓▓ */}
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>
        {/* NAVBAR (Desktop Only) */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <h1 className="text-2xl font-bold">Analytics</h1>

          <div className="flex items-center gap-6">
            {user && (
              <img
                src={`https://ui-avatars.com/api/?name=${user.email}&background=3b82f6&color=fff`}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
                alt="Profile"
              />
            )}
          </div>
        </header>

        {/* ▓▓ PAGE CONTENT ▓▓ */}
        <main className="p-4 md:p-8 space-y-6">
          {loading ? (
            <div className="text-center py-20">
              <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-400" />
              <p>Loading analytics...</p>
            </div>
          ) : null}
          {!loading && (
            <div className="max-w-7xl mx-auto w-full">
              {/* HEADER */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                  <p className="text-slate-400">Real-time platform insights and metrics</p>
                </div>
                <button
                  onClick={loadAnalyticsData}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>

              {/* OVERVIEW CARDS */}
              {overviewData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm">Today's Bookings</p>
                      <FiBarChart2 className="text-blue-400 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400">{overviewData.today.bookings}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Revenue: ₹{overviewData.today.revenue.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm">Active Washers</p>
                      <FiTrendingUp className="text-green-400 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-green-400">{overviewData.today.washers}</p>
                    <p className="text-xs text-slate-500 mt-2">Currently active</p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm">Total Bookings</p>
                      <FiPieChart className="text-purple-400 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-purple-400">{overviewData.total.bookings}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {overviewData.total.completedBookings} completed
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm">Total Users</p>
                      <FiTrendingUp className="text-yellow-400 text-xl" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{overviewData.total.totalUsers}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {overviewData.total.customers} customers
                    </p>
                  </div>
                </div>
              )}

              {/* CHARTS ROW 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* BOOKINGS TREND */}
              {bookingsData && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FiBarChart2 className="text-blue-400" />
                    Bookings Trend (30 Days)
                  </h2>
                  <div className="flex items-end justify-between gap-1 h-64 overflow-x-auto p-4 bg-slate-800/50 rounded-lg">
                    {bookingsData.dailyData?.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: "20px" }}>
                        <div
                          className="w-full bg-linear-to-t from-blue-500 to-cyan-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                          style={{
                            height: `${(day.count / Math.max(...bookingsData.dailyData.map((d) => d.count), 1)) * 200}px`,
                            minHeight: "4px",
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {day.count}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500">{new Date(day.date).getDate()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-sm text-slate-400">
                    <span>Total: {bookingsData.totalBookings}</span>
                    <span>Avg: {(bookingsData.totalBookings / bookingsData.dailyData?.length).toFixed(1)}/day</span>
                  </div>
                </div>
              )}

              {/* BOOKINGS STATUS */}
              {bookingsData && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FiPieChart className="text-green-400" />
                    Bookings by Status
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(bookingsData.statusBreakdown || {}).map(([status, count]) => {
                      const total = bookingsData.totalBookings;
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                      const colors = {
                        Pending: "bg-yellow-500",
                        Confirmed: "bg-blue-500",
                        "In Progress": "bg-purple-500",
                        Completed: "bg-green-500",
                      };
                      return (
                        <div key={status}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{status}</span>
                            <span className="text-sm text-slate-400">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className={`${colors[status]} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

              {/* CHARTS ROW 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* EARNINGS TREND */}
              {earningsData && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FiTrendingUp className="text-green-400" />
                    Earnings Trend (30 Days)
                  </h2>
                  <div className="flex items-end justify-between gap-1 h-64 overflow-x-auto p-4 bg-slate-800/50 rounded-lg">
                    {earningsData.dailyData?.map((day, idx) => {
                      const maxAmount = Math.max(...earningsData.dailyData.map((d) => d.amount), 1);
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: "20px" }}>
                          <div
                            className="w-full bg-linear-to-t from-green-500 to-emerald-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                            style={{
                              height: `${(day.amount / maxAmount) * 200}px`,
                              minHeight: "4px",
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                              ₹{day.amount}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500">{new Date(day.date).getDate()}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-400">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-lg font-bold text-green-400">₹{earningsData.totalEarnings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">This Month</p>
                      <p className="text-lg font-bold text-blue-400">₹{earningsData.monthlyEarnings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Today</p>
                      <p className="text-lg font-bold text-yellow-400">₹{earningsData.todayEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RATINGS DISTRIBUTION */}
              {ratingsData && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FiPieChart className="text-yellow-400" />
                    Rating Distribution
                  </h2>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingsData.distribution[star] || 0;
                      const total = ratingsData.totalRatings || 1;
                      const percentage = ((count / total) * 100).toFixed(1);
                      return (
                        <div key={star}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {Array(star)
                                .fill(0)
                                .map((_, i) => (
                                  <span key={i} className="text-yellow-400">
                                    ⭐
                                  </span>
                                ))}
                            </span>
                            <span className="text-sm text-slate-400">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">Average Rating</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {ratingsData.averageRating.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

              {/* BOTTOM SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SERVICES BREAKDOWN */}
              {bookingsData?.serviceBreakdown && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Services Breakdown</h2>
                  <div className="space-y-3">
                    {Object.entries(bookingsData.serviceBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([service, count]) => (
                        <div key={service} className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                          <span className="text-sm">{service}</span>
                          <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SUMMARY STATS */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Summary Stats</h2>
                <div className="space-y-4">
                  {overviewData && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                        <span className="text-sm text-slate-400">New Users Today</span>
                        <span className="text-lg font-bold text-blue-400">+{overviewData.today.newUsers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                        <span className="text-sm text-slate-400">Employees</span>
                        <span className="text-lg font-bold text-purple-400">{overviewData.total.employees}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                        <span className="text-sm text-slate-400">Completion Rate</span>
                        <span className="text-lg font-bold text-green-400">
                          {overviewData.total.bookings > 0
                            ? ((overviewData.total.completedBookings / overviewData.total.bookings) * 100).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      {ratingsData && (
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                          <span className="text-sm text-slate-400">Total Ratings</span>
                          <span className="text-lg font-bold text-yellow-400">{ratingsData.totalRatings}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
