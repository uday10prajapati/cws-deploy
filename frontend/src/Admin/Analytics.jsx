import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiBarChart2, FiPieChart, FiRefreshCw } from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingsData, setBookingsData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  useRoleBasedRedirect("admin", "sub-admin");

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
    { name: "Dashboard", link: "/admin/dashboard" },
    { name: "Bookings", link: "/admin/bookings" },
    { name: "Users", link: "/admin/users" },
    { name: "Earnings", link: "/admin/earnings" },
    { name: "Analytics", link: "/admin/analytics" },
    { name: "Settings", link: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
              Analytics Dashboard 📊
            </h1>
            <p className="text-slate-600 text-base">
              Real-time platform insights and metrics
            </p>
          </div>
          <button
            onClick={loadAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* OVERVIEW CARDS */}
        {overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Today's Bookings</p>
                <FiBarChart2 className="text-blue-600 text-xl" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{overviewData.today.bookings}</p>
              <p className="text-xs text-slate-600 mt-2">
                Revenue: ₹{overviewData.today.revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Active Washers</p>
                <FiTrendingUp className="text-green-600 text-xl" />
              </div>
              <p className="text-3xl font-bold text-green-600">{overviewData.today.washers}</p>
              <p className="text-xs text-slate-600 mt-2">Currently active</p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Total Bookings</p>
                <FiPieChart className="text-purple-600 text-xl" />
              </div>
              <p className="text-3xl font-bold text-purple-600">{overviewData.total.bookings}</p>
              <p className="text-xs text-slate-600 mt-2">
                {overviewData.total.completedBookings} completed
              </p>
            </div>

            <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Total Users</p>
                <FiTrendingUp className="text-amber-600 text-xl" />
              </div>
              <p className="text-3xl font-bold text-amber-600">{overviewData.total.totalUsers}</p>
              <p className="text-xs text-slate-600 mt-2">
                {overviewData.total.customers} customers
              </p>
            </div>
          </div>
        )}

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BOOKINGS TREND */}
          {bookingsData && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                <FiBarChart2 className="text-blue-600" />
                Bookings Trend (30 Days)
              </h2>
              <div className="flex items-end justify-between gap-1 h-64 overflow-x-auto p-4 bg-slate-50 rounded-lg">
                {bookingsData.dailyData?.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: "20px" }}>
                    <div
                      className="w-full bg-linear-to-t from-blue-500 to-cyan-400 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                      style={{
                        height: `${(day.count / Math.max(...bookingsData.dailyData.map((d) => d.count), 1)) * 200}px`,
                        minHeight: "4px",
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {day.count}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600">{new Date(day.date).getDate()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-sm text-slate-600">
                <span>Total: {bookingsData.totalBookings}</span>
                <span>Avg: {(bookingsData.totalBookings / bookingsData.dailyData?.length).toFixed(1)}/day</span>
              </div>
            </div>
          )}

          {/* BOOKINGS STATUS */}
          {bookingsData && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                <FiPieChart className="text-green-600" />
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
                        <span className="text-sm font-medium text-slate-700">{status}</span>
                        <span className="text-sm text-slate-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                <FiTrendingUp className="text-green-600" />
                Earnings Trend (30 Days)
              </h2>
              <div className="flex items-end justify-between gap-1 h-64 overflow-x-auto p-4 bg-slate-50 rounded-lg">
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
                      <p className="text-[10px] text-slate-600">{new Date(day.date).getDate()}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs text-slate-600 font-semibold">Total</p>
                  <p className="text-lg font-bold text-green-600">₹{earningsData.totalEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">This Month</p>
                  <p className="text-lg font-bold text-blue-600">₹{earningsData.monthlyEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">Today</p>
                  <p className="text-lg font-bold text-amber-600">₹{earningsData.todayEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* RATINGS DISTRIBUTION */}
          {ratingsData && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                <FiPieChart className="text-amber-600" />
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
                        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          {Array(star)
                            .fill(0)
                            .map((_, i) => (
                              <span key={i} className="text-amber-400">
                                ⭐
                              </span>
                            ))}
                        </span>
                        <span className="text-sm text-slate-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 text-center">
                <p className="text-slate-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-amber-600">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Services Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(bookingsData.serviceBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([service, count]) => (
                    <div key={service} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 font-medium">{service}</span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SUMMARY STATS */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Summary Stats</h2>
            <div className="space-y-4">
              {overviewData && (
                <>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium">New Users Today</span>
                    <span className="text-lg font-bold text-blue-600">+{overviewData.today.newUsers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium">Employees</span>
                    <span className="text-lg font-bold text-purple-600">{overviewData.total.employees}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium">Completion Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {overviewData.total.bookings > 0
                        ? ((overviewData.total.completedBookings / overviewData.total.bookings) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  {ratingsData && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700 font-medium">Total Ratings</span>
                      <span className="text-lg font-bold text-amber-600">{ratingsData.totalRatings}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
