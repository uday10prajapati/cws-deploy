import { useState, useEffect } from "react";
import { FiSave, FiAlertCircle, FiCheck, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiUsers, FiDollarSign, FiTrendingUp, FiSettings, FiCreditCard, FiBell, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaCar } from "react-icons/fa";

export default function Settings() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    account_type: "Savings",
  });

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("http://localhost:5000/admin/bank-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetails),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("Error saving settings: " + err.message);
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
    { name: "Cars", icon: <FaCar />, link: "/admin/cars" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

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
          <h1 className="text-2xl font-bold">Settings</h1>

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-slate-400">Configure platform settings</p>
        </div>

        {/* ALERTS */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-300">
            <FiCheck className="text-xl" />
            <p>Settings saved successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300">
            <FiAlertCircle className="text-xl" />
            <p>{error}</p>
          </div>
        )}

        {/* BANK ACCOUNT SECTION */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Bank Account Settings</h2>
          <p className="text-slate-400 mb-6">
            Configure your bank account for payment settlements. Money from completed bookings will be transferred to this account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Account Holder Name *</label>
              <input
                type="text"
                name="account_holder_name"
                value={bankDetails.account_holder_name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium mb-2">Account Number *</label>
              <input
                type="text"
                name="account_number"
                value={bankDetails.account_number}
                onChange={handleInputChange}
                placeholder="1234567890"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">8-17 digits</p>
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-sm font-medium mb-2">IFSC Code *</label>
              <input
                type="text"
                name="ifsc_code"
                value={bankDetails.ifsc_code}
                onChange={handleInputChange}
                placeholder="SBIN0001234"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Format: AAAA0AAAAAA</p>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Bank Name *</label>
              <input
                type="text"
                name="bank_name"
                value={bankDetails.bank_name}
                onChange={handleInputChange}
                placeholder="State Bank of India"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Account Type</label>
              <select
                name="account_type"
                value={bankDetails.account_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option>Savings</option>
                <option>Current</option>
              </select>
            </div>

            {/* INFO BOX */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> All transactions from completed bookings will be automatically transferred to this account. Ensure the account details are correct before saving.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <FiSave /> {loading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        {/* ADDITIONAL SETTINGS */}
        <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Other Settings</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2">Notification Settings</h3>
              <p className="text-sm text-slate-400">Manage email and SMS notifications for bookings and payments.</p>
              <button className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition">
                Configure
              </button>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2">Service Configuration</h3>
              <p className="text-sm text-slate-400">Add, edit, or remove car wash services offered on the platform.</p>
              <button className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition">
                Configure
              </button>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2">Pricing Configuration</h3>
              <p className="text-sm text-slate-400">Set pricing for different services and manage add-ons.</p>
              <button className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition">
                Configure
              </button>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
