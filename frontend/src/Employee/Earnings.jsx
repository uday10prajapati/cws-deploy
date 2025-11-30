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
  const [transactions, setTransactions] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(false);

  /* LOAD EARNINGS DATA FROM TRANSACTIONS */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        setUser(auth.user);

        // Fetch earnings from transactions table
        const response = await fetch(`http://localhost:5000/earnings/transactions/${auth.user.id}`);
        const result = await response.json();

        if (result.success) {
          setTransactions(result.data.transactions || []);
          setMonthlyTotal(parseFloat(result.data.thisMonthEarnings) || 0);
          setTotalEarnings(parseFloat(result.data.totalEarnings) || 0);
          console.log("Earnings loaded:", result.data);
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
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
          {/* TOP STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">This Month</p>
                <FiCalendar className="text-green-400 text-xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">₹{monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-slate-500 text-xs mt-2">Current month earnings</p>
            </div>

            <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium">Transactions</p>
                <FiDollarSign className="text-blue-400 text-xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">{transactions.length}</p>
              <p className="text-slate-500 text-xs mt-2">Successful payments</p>
            </div>
          </div>

          {/* TOTAL EARNINGS CARD WITH TRANSACTION HISTORY */}
          <div className="bg-linear-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/30">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                <p className="text-4xl font-bold text-purple-400 mt-2">₹{totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p className="text-slate-500 text-xs mt-2">All successful transactions</p>
              </div>
              <FiTrendingUp className="text-purple-400 text-4xl opacity-50" />
            </div>

            {/* Transaction History */}
            <div>
              <h3 className="text-white text-sm font-semibold mb-4">Recent Transactions</h3>

              {loading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FaCar className="text-3xl text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No transactions yet. Complete bookings to generate earnings!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.slice(0, 5).map((transaction, idx) => (
                    <div key={transaction.id || idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/80 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-purple-300 capitalize">
                            {transaction.type}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 capitalize">
                            {transaction.payment_method || "N/A"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            transaction.status === 'success'
                              ? 'bg-green-600/20 text-green-300'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-600/20 text-yellow-300'
                              : 'bg-red-600/20 text-red-300'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-green-400">
                          ₹{parseFloat(transaction.total_amount || transaction.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {transaction.gst ? `+₹${parseFloat(transaction.gst).toLocaleString('en-IN', { maximumFractionDigits: 2 })} GST` : 'No GST'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {transactions.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-500">+{transactions.length - 5} more transactions</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* FOOTER INFO */}
          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
            <p className="text-slate-400 text-sm">
              💡 <strong>Note:</strong> Earnings are calculated from successful payment transactions in the transactions table. GST and other charges are included in the total amount.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
