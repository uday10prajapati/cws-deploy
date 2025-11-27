import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiLogOut,
  FiChevronLeft,
  FiHome,
  FiClipboard,
  FiDollarSign,
  FiBell,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function Earnings() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [dailyEarnings, setDailyEarnings] = useState([]);

  /* LOAD EARNINGS DATA */
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      // Fetch completed bookings with payment info
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("assigned_to", auth.user.id)
        .eq("status", "Completed")
        .order("created_at", { ascending: false });

      setEarnings(bookings || []);

      // Calculate monthly total
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const monthlyBookings = (bookings || []).filter(
        (b) => b.date >= monthStart && b.date <= monthEnd
      );
      const monthTotal = monthlyBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      setMonthlyTotal(monthTotal);

      // Calculate total earnings
      const total = (bookings || []).reduce((sum, b) => sum + (b.amount || 0), 0);
      setTotalEarnings(total);

      // Calculate daily earnings for chart
      const dailyMap = {};
      (bookings || []).forEach((booking) => {
        const date = booking.date || new Date().toISOString().split("T")[0];
        dailyMap[date] = (dailyMap[date] || 0) + (booking.amount || 0);
      });

      const sortedDaily = Object.entries(dailyMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 days

      setDailyEarnings(sortedDaily);
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee/dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
  ];

  // Get max earnings for chart scaling
  const maxEarnings = Math.max(...dailyEarnings.map((d) => d.amount), 0) || 1000;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓ MOBILE TOP BAR ▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓ BACKDROP FOR MOBILE ▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
          {employeeMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
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
          <h1 className="text-2xl font-bold">Earnings</h1>

          <div className="flex items-center gap-6">
            <FiBell className="text-xl text-slate-300 hover:text-blue-400 cursor-pointer" />

            {user && (
              <img
                src={`https://ui-avatars.com/api/?name=${user.email}&background=3b82f6&color=fff`}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
                alt="User"
              />
            )}
          </div>
        </header>

        {/* ▓▓ PAGE CONTENT ▓▓ */}
        <main className="p-4 md:p-8 space-y-6">
          {/* EARNINGS SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">This Month</p>
                <FiCalendar className="text-green-400 text-xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">₹{monthlyTotal.toLocaleString()}</p>
              <p className="text-slate-500 text-xs mt-2">{earnings.filter(e => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const eDate = new Date(e.date);
                return eDate >= monthStart;
              }).length} completed jobs</p>
            </div>

            <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                <FiTrendingUp className="text-blue-400 text-xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">₹{totalEarnings.toLocaleString()}</p>
              <p className="text-slate-500 text-xs mt-2">{earnings.length} total completed</p>
            </div>

            <div className="bg-linear-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Average per Job</p>
                <FiDollarSign className="text-purple-400 text-xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                ₹{earnings.length > 0 ? Math.round(totalEarnings / earnings.length) : 0}
              </p>
              <p className="text-slate-500 text-xs mt-2">Per completed service</p>
            </div>
          </div>

          {/* EARNINGS CHART - BAR GRAPH */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-6">Last 30 Days Earnings</h2>

            {dailyEarnings.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <p>No earnings data yet</p>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-1 h-64 overflow-x-auto p-4 bg-slate-800/50 rounded-lg">
                {dailyEarnings.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 shrink-0" style={{ minWidth: "30px" }}>
                    <div
                      className="w-full bg-linear-to-t from-cyan-500 to-blue-500 rounded-t-md hover:opacity-80 transition group relative cursor-pointer"
                      style={{
                        height: `${(day.amount / maxEarnings) * 100 * 2}px`,
                        minHeight: "8px",
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        ₹{day.amount}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500" style={{ fontSize: "10px" }}>
                      {new Date(day.date).getDate()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Recent Completed Jobs</h2>

            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No completed jobs yet. Start accepting jobs to earn!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 text-left font-medium">Date</th>
                      <th className="py-3 text-left font-medium">Customer</th>
                      <th className="py-3 text-left font-medium">Car</th>
                      <th className="py-3 text-left font-medium">Service</th>
                      <th className="py-3 text-left font-medium">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {earnings.slice(0, 10).map((earning, idx) => (
                      <tr key={earning.id || idx} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50 transition">
                        <td className="py-3">
                          {new Date(earning.date).toLocaleDateString()}
                        </td>
                        <td className="py-3">{earning.customer_name || "N/A"}</td>
                        <td className="py-3 flex items-center gap-2">
                          <FaCar className="text-blue-400" />
                          {earning.car_name || "N/A"}
                        </td>
                        <td className="py-3">
                          <span className="px-3 py-1 bg-blue-600/25 text-blue-300 rounded-full text-xs">
                            {Array.isArray(earning.services) ? earning.services[0] : "Wash"}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-green-400">
                          ₹{(earning.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* EARNINGS BREAKDOWN */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-lg font-semibold mb-4">Earnings Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-slate-300 font-medium mb-3">By Service Type</h3>
                <div className="space-y-2">
                  {[
                    { type: "Regular Wash", count: earnings.filter(e => Array.isArray(e.services) && e.services.includes("Regular Wash")).length },
                    { type: "Premium Wash", count: earnings.filter(e => Array.isArray(e.services) && e.services.includes("Premium Wash")).length },
                    { type: "Interior Clean", count: earnings.filter(e => Array.isArray(e.services) && e.services.includes("Interior Clean")).length },
                  ].map((item) => (
                    <div key={item.type} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded">
                      <span>{item.type}</span>
                      <span className="text-blue-400 font-semibold">{item.count} jobs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-slate-300 font-medium mb-3">Monthly Progress</h3>
                <div className="space-y-2">
                  {[
                    { label: "This Week", amount: earnings.filter(e => {
                      const date = new Date(e.date);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return date >= weekAgo;
                    }).reduce((sum, e) => sum + (e.amount || 0), 0) },
                    { label: "This Month", amount: monthlyTotal },
                    { label: "All Time", amount: totalEarnings },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded">
                      <span>{item.label}</span>
                      <span className="text-green-400 font-semibold">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
