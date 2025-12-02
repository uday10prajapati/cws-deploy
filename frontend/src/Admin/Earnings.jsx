import { useEffect, useState } from "react";
import { FiTrendingUp, FiDollarSign, FiRefreshCw, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiUsers, FiSettings, FiCreditCard, FiBell, FiX, FiSearch, FiCalendar, FiDownload, FiEye } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaCar } from "react-icons/fa";
import { generateTransactionPDF, viewTransactionPDF } from "../utils/pdfGenerator";

export default function Earnings() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

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
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Fetch all system earnings/transactions
      const response = await fetch("http://localhost:5000/earnings/transactions/admin");
      const result = await response.json();
      if (result.success) {
        setEarnings({
          totalEarnings: parseFloat(result.data.totalEarnings),
          thisMonthEarnings: parseFloat(result.data.thisMonthEarnings),
          totalTransactions: result.data.totalTransactions,
          thisMonthTransactions: result.data.thisMonthTransactions,
        });
        setTransactions(result.data.transactions || []);
        setFilteredTransactions(result.data.transactions || []);
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search and date filter
  useEffect(() => {
    let filtered = transactions;

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.customer_id && t.customer_id.toLowerCase().includes(term)) ||
        (t.booking_id && t.booking_id.toString().includes(term)) ||
        (t.type && t.type.toLowerCase().includes(term)) ||
        (t.payment_method && t.payment_method.toLowerCase().includes(term))
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, dateFilter, transactions]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Get customer profile using customer_id from transaction
  const getCustomerProfile = async (customerId) => {
    try {
      if (!customerId) return null;
      
      // Try to fetch from profiles table using correct column names
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, email, phone")
        .eq("id", customerId)
        .single();
      
      if (profile && (profile.name || profile.email)) {
        console.log("Customer profile found:", profile);
        return {
          name: profile.name || 'Customer',
          email: profile.email || 'N/A',
          phone: profile.phone || 'N/A'
        };
      }
      
      // If profiles table doesn't have data, try to get from backend
      try {
        const response = await fetch(`http://localhost:5000/auth/user/${customerId}`);
        const result = await response.json();
        if (result.success && result.user) {
          console.log("Fetching from backend:", result.user);
          return {
            name: result.user.full_name || result.user.email || 'Customer',
            email: result.user.email || 'N/A',
            phone: result.user.phone || 'N/A'
          };
        }
      } catch (backendError) {
        console.error("Backend fetch error:", backendError);
      }
      
      return { name: 'Customer', email: 'N/A', phone: 'N/A' };
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      return { name: 'Customer', email: 'N/A', phone: 'N/A' };
    }
  };

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Earnings", icon: <FiTrendingUp />, link: "/admin/earnings" },
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
          <p>Loading earnings data...</p>
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
          <h1 className="text-2xl font-bold">Earnings</h1>

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
              <h1 className="text-4xl font-bold mb-2">All System Earnings</h1>
              <p className="text-slate-400">Complete transaction and earnings overview</p>
            </div>
            <button
              onClick={loadEarningsData}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {/* STATS CARDS */}
          {earnings && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-green-500/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                  <FiDollarSign className="text-green-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-green-400">
                  ₹{earnings.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-2">All time earnings</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-blue-500/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">{new Date().toLocaleString('en-US', { month: 'long' })} Earnings</p>
                  <FiCalendar className="text-blue-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-blue-400">
                  ₹{earnings.thisMonthEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-2">{earnings.thisMonthTransactions} transactions this month</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-purple-500/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">Total Transactions</p>
                  <FiTrendingUp className="text-purple-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-purple-400">{earnings.totalTransactions}</p>
                <p className="text-xs text-slate-500 mt-2">Completed bookings</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-yellow-500/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-sm font-medium">Avg Per Transaction</p>
                  <span className="text-yellow-400 text-2xl">📊</span>
                </div>
                <p className="text-4xl font-bold text-yellow-400">
                  ₹{earnings.totalTransactions > 0 ? (earnings.totalEarnings / earnings.totalTransactions).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                </p>
                <p className="text-xs text-slate-500 mt-2">Average value</p>
              </div>
            </div>
          )}

          {/* FILTERS AND SEARCH */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Search by customer ID, booking ID, type, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div className="flex gap-2">
              {[
                { label: "All", value: "all" },
                { label: "Today", value: "today" },
                { label: "Week", value: "week" },
                { label: "Month", value: "month" },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setDateFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    dateFilter === filter.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-blue-400" />
              All Transactions
            </h2>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FaCar className="text-5xl text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchTerm || dateFilter !== "all" ? "No transactions match your filters." : "No transactions yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/50">
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Date & Time</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Customer ID</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Booking ID</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Type</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Amount</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">GST</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Total</th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-300">Payment Method</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, idx) => (
                      <tr
                        key={transaction.id || idx}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition"
                      >
                        <td className="px-6 py-4 text-slate-300">
                          <div className="text-sm">
                            <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">{new Date(transaction.created_at).toLocaleTimeString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-sm">{transaction.customer_id || "N/A"}</td>
                        <td className="px-6 py-4 text-slate-300 text-sm font-mono">{transaction.booking_id || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-600/25 text-blue-300 rounded text-xs font-semibold capitalize">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300 font-semibold">
                          ₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 text-sm">
                          {transaction.gst ? `₹${parseFloat(transaction.gst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-bold">
                          ₹{parseFloat(transaction.total_amount || transaction.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-600/25 text-purple-300 rounded text-xs capitalize">
                            {transaction.payment_method || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded text-xs font-semibold capitalize ${
                            transaction.status === 'success'
                              ? 'bg-green-600/25 text-green-300'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-600/25 text-yellow-300'
                              : 'bg-red-600/25 text-red-300'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {transaction.status === 'success' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={async () => {
                                  const customerProfile = await getCustomerProfile(transaction.customer_id);
                                  viewTransactionPDF(transaction, { name: customerProfile?.name || 'Customer', email: customerProfile?.email || 'N/A', phone: customerProfile?.phone || 'N/A' }, 'customer');
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                                title="View PDF Invoice"
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  const customerProfile = await getCustomerProfile(transaction.customer_id);
                                  generateTransactionPDF(transaction, { name: customerProfile?.name || 'Customer', email: customerProfile?.email || 'N/A', phone: customerProfile?.phone || 'N/A' }, 'customer');
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                                title="Download PDF Invoice"
                              >
                                <FiDownload size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLE INFO */}
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg flex items-center justify-between text-sm text-slate-400">
              <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
              {filteredTransactions.length > 0 && (
                <p className="text-green-400 font-semibold">
                  Total: ₹{filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.total_amount || t.amount) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
