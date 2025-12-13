import { useEffect, useState } from "react";
import { FiTrendingUp, FiDollarSign, FiRefreshCw, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiUsers, FiSettings, FiCreditCard, FiBell, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaCar } from "react-icons/fa";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function AllRevenue() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chartView, setChartView] = useState("monthly"); // monthly, daily, yearly

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
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/all-revenue");
      const result = await response.json();
      if (result.success) {
        setRevenueData(result.data);
      }
    } catch (error) {
      console.error("Error loading revenue:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-400" />
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu className="text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} />
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
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
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
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3 shadow-lg transition-all
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
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>

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
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto top-12">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white transition">
                    <FiX />
                  </button>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition last:border-b-0">
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
        <main className="p-4 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Revenue Dashboard</h1>
            <p className="text-slate-400">Complete revenue analytics</p>
          </div>
          <button
            onClick={loadRevenueData}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS CARDS */}
        {revenueData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <FiDollarSign className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">
                ₹{revenueData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">From {revenueData.totalTransactions} transactions</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Avg Per Transaction</p>
                <FiTrendingUp className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">
                ₹{revenueData.averagePerTransaction.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">Average transaction value</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Transactions</p>
                <FiDollarSign className="text-yellow-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-yellow-400">{revenueData.totalTransactions}</p>
              <p className="text-xs text-slate-500 mt-2">Completed bookings</p>
            </div>
          </div>
        )}

        {/* CHART TABS */}
        <div className="flex gap-2 mb-6 bg-slate-900/50 border border-slate-800 rounded-lg p-2 w-fit">
          <button
            onClick={() => setChartView("daily")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "daily"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setChartView("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "monthly"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setChartView("yearly")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "yearly"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Yearly
          </button>
        </div>

        {/* BREAKDOWN & CHARTS */}
        {revenueData && Object.keys(revenueData.monthlyBreakdown).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* DAILY VIEW */}
            {chartView === "daily" && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Daily Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.dailyBreakdown || {})
                      .sort()
                      .reverse()
                      .slice(0, 7)
                      .map(([day, amount]) => (
                        <div key={day} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                          <span className="text-sm font-medium">{day}</span>
                          <span className="text-lg font-bold text-blue-400">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Daily Chart</h2>
                  <div className="flex items-end justify-between gap-1 h-48 p-4 bg-slate-800/50 rounded-lg overflow-x-auto">
                    {Object.entries(revenueData.dailyBreakdown || {})
                      .sort()
                      .slice(0, 30)
                      .map(([day, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.dailyBreakdown || {}),
                          1
                        );
                        return (
                          <div
                            key={day}
                            className="flex flex-col items-center gap-2 flex-1 min-w-max"
                          >
                            <div
                              className="w-full bg-linear-to-t from-blue-500 to-cyan-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "4px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{day.split("-")[2]}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* MONTHLY VIEW */}
            {chartView === "monthly" && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Monthly Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.monthlyBreakdown)
                      .sort()
                      .reverse()
                      .map(([month, amount]) => (
                        <div key={month} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-lg font-bold text-green-400">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Monthly Chart</h2>
                  <div className="flex items-end justify-between gap-2 h-48 p-4 bg-slate-800/50 rounded-lg">
                    {Object.entries(revenueData.monthlyBreakdown)
                      .sort()
                      .map(([month, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.monthlyBreakdown),
                          1
                        );
                        return (
                          <div
                            key={month}
                            className="flex flex-col items-center gap-2 flex-1"
                          >
                            <div
                              className="w-full bg-linear-to-t from-green-500 to-emerald-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "8px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{month.split("-")[1]}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* YEARLY VIEW */}
            {chartView === "yearly" && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Yearly Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.yearlyBreakdown || {})
                      .sort()
                      .reverse()
                      .map(([year, amount]) => (
                        <div key={year} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                          <span className="text-sm font-medium">{year}</span>
                          <span className="text-lg font-bold text-purple-400">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Yearly Chart</h2>
                  <div className="flex items-end justify-between gap-3 h-48 p-4 bg-slate-800/50 rounded-lg">
                    {Object.entries(revenueData.yearlyBreakdown || {})
                      .sort()
                      .map(([year, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.yearlyBreakdown || {}),
                          1
                        );
                        return (
                          <div
                            key={year}
                            className="flex flex-col items-center gap-2 flex-1"
                          >
                            <div
                              className="w-full bg-linear-to-t from-purple-500 to-pink-500 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "8px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{year}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* RECENT TRANSACTIONS */}
        {revenueData?.recentTransactions && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="py-3 text-left font-medium text-slate-400">Date</th>
                    <th className="py-3 text-left font-medium text-slate-400">Customer</th>
                    <th className="py-3 text-left font-medium text-slate-400">Car</th>
                    <th className="py-3 text-left font-medium text-slate-400">Service</th>
                    <th className="py-3 text-left font-medium text-slate-400">Amount</th>
                    <th className="py-3 text-left font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.recentTransactions.map((transaction, idx) => (
                    <tr
                      key={transaction.id || idx}
                      className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3">{transaction.date}</td>
                      <td className="py-3">{transaction.customer_name || "N/A"}</td>
                      <td className="py-3">{transaction.car_name || "N/A"}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-blue-600/25 text-blue-300 rounded text-xs">
                          {Array.isArray(transaction.services)
                            ? transaction.services[0]
                            : transaction.services || "Service"}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-green-400">
                        ₹{(transaction.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-green-600/25 text-green-300 rounded text-xs">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
