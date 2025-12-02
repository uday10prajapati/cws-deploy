import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  FiCreditCard,
  FiCheck,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiMenu,
  FiLogOut,
  FiChevronLeft,
  FiHome,
  FiClipboard,
  FiUsers,
  FiDollarSign,
  FiBell,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { supabase } from "../supabaseClient";

const API_BASE = "http://localhost:5000";

export default function BankAccountSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [verified, setVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [verifyAmounts, setVerifyAmounts] = useState({
    deposit1: "",
    deposit2: "",
  });

  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    account_type: "Savings",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current bank account on load
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
    fetchBankAccount();
  }, []);

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
    { name: "Analytics", icon: <FiRefreshCw />, link: "/admin/analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

  const fetchBankAccount = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/bank-account`);
      const data = await response.json();

      if (data.success) {
        setBankAccount(data.bank_account);
        setVerified(data.bank_account.verified || false);
        setFormData({
          account_holder_name: data.bank_account.account_holder_name,
          account_number: data.bank_account.account_number,
          ifsc_code: data.bank_account.ifsc_code,
          bank_name: data.bank_account.bank_name,
          account_type: data.bank_account.account_type,
        });
      }
    } catch (err) {
      console.error("Error fetching bank account:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (
        !formData.account_holder_name ||
        !formData.account_number ||
        !formData.ifsc_code ||
        !formData.bank_name
      ) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      // IFSC validation
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(formData.ifsc_code)) {
        setError("Invalid IFSC code. Format: AAAA0AAAAAA (e.g., HDFC0000123)");
        setLoading(false);
        return;
      }

      // Account number validation
      const accountRegex = /^\d{8,17}$/;
      if (!accountRegex.test(formData.account_number)) {
        setError("Invalid account number. Must be 8-17 digits");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/bank-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setBankAccount(data.bank_account);
        setSuccess(
          "Bank account details saved! Please verify using microdeposits."
        );
        setShowForm(false);
        setShowVerify(true);
        setVerified(false);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Failed to save bank account");
      }
    } catch (err) {
      setError("Error saving bank account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!verifyAmounts.deposit1 || !verifyAmounts.deposit2) {
        setError("Both deposit amounts are required");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/verify-bank-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit1_amount: parseFloat(verifyAmounts.deposit1),
          deposit2_amount: parseFloat(verifyAmounts.deposit2),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        setBankAccount(data.bank_account);
        setSuccess("✅ Bank account verified successfully!");
        setShowVerify(false);
        setVerifyAmounts({ deposit1: "", deposit2: "" });
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Error verifying bank account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Bank Account</h1>

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
        <main className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FiCreditCard className="text-blue-400 text-4xl" />
                Bank Account Setup
              </h1>
              <p className="text-slate-400 mt-2">
                Configure your bank account for payment settlement
              </p>
            </div>

            {/* Status Card */}
            <div
              className={`rounded-xl p-6 mb-6 border-2 ${
                verified
                  ? "bg-green-600/10 border-green-500/30"
                  : "bg-yellow-600/10 border-yellow-500/30"
              }`}
            >
              <div className="flex items-start gap-4">
                {verified ? (
                  <>
                    <FiCheck className="text-green-400 text-2xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-green-300">Verified ✅</p>
                      <p className="text-green-200 text-sm mt-1">
                        Your bank account is verified. All payments will settle to
                        this account.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="text-yellow-400 text-2xl shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-yellow-300">
                        {bankAccount
                          ? "Pending Verification"
                          : "Not Configured"}
                      </p>
                      <p className="text-yellow-200 text-sm mt-1">
                        {bankAccount
                          ? "Verify using microdeposits from Razorpay"
                          : "Add your bank account details to receive payments"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Current Bank Account Info */}
            {bankAccount && !showForm && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Current Account Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Account Holder</p>
                    <p className="text-white font-semibold">
                      {bankAccount.account_holder_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm">Bank Name</p>
                    <p className="text-white font-semibold">
                      {bankAccount.bank_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm">Account Type</p>
                    <p className="text-white font-semibold">
                      {bankAccount.account_type}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm">IFSC Code</p>
                    <p className="text-white font-semibold">
                      {bankAccount.ifsc_code}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-slate-400 text-sm">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">
                        {showFullAccount
                          ? bankAccount.account_number
                          : "**** " + bankAccount.account_number.slice(-4)}
                      </p>
                      <button
                        onClick={() => setShowFullAccount(!showFullAccount)}
                        className="text-slate-400 hover:text-blue-400 transition"
                      >
                        {showFullAccount ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Settlement Info */}
                <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm font-semibold mb-2">
                    💰 Settlement Information
                  </p>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>✓ Payments settle T+1 (next business day)</li>
                    <li>✓ Automatic daily settlement of verified transactions</li>
                    <li>✓ Razorpay processes settlements daily</li>
                    <li>✓ No manual intervention needed</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw /> Update Details
                  </button>
                  {!verified && (
                    <button
                      onClick={() => setShowVerify(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FiCheck /> Verify Account
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bank Account Form */}
            {showForm && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {bankAccount ? "Update" : "Add"} Bank Account
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={handleInputChange}
                  placeholder="Your name as per bank records"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Account Type *
                  </label>
                  <select
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ifsc_code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., HDFC0000001"
                    maxLength="11"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  placeholder="8-17 digit account number"
                  maxLength="17"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {error && (
                <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  {loading ? "Saving..." : "Save Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
                </form>
              </div>
            )}

            {/* Verification Form */}
            {showVerify && !verified && (
              <div className="bg-slate-900/80 border border-yellow-500/50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Verify Bank Account
                </h2>

                <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm font-semibold mb-2">
                    📋 How Verification Works:
                  </p>
                  <ol className="text-yellow-200 text-sm space-y-1 ml-4 list-decimal">
                    <li>Razorpay sends 2 small deposits (₹1-5) to your account</li>
                    <li>Check your bank statement in 1-2 business days</li>
                    <li>Enter the exact amounts below</li>
                    <li>Your account will be verified ✅</li>
                  </ol>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      First Deposit Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={verifyAmounts.deposit1}
                      onChange={(e) =>
                        setVerifyAmounts({
                          ...verifyAmounts,
                          deposit1: e.target.value,
                        })
                      }
                      placeholder="e.g., 2.50"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Second Deposit Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={verifyAmounts.deposit2}
                      onChange={(e) =>
                        setVerifyAmounts({
                          ...verifyAmounts,
                          deposit2: e.target.value,
                        })
                      }
                      placeholder="e.g., 3.75"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying..." : <>
                      <FiCheck /> Verify
                    </>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVerify(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
                </form>
              </div>
            )}        {/* Success Message */}
        {success && (
          <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 text-green-300 text-sm mb-6">
            ✅ {success}
          </div>
        )}

            {/* Initial Setup */}
            {!bankAccount && !showForm && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center">
                <FiCreditCard className="text-6xl text-blue-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Bank Account Configured
                </h3>
                <p className="text-slate-400 mb-6">
                  Add your bank account to start receiving payments
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
                >
                  <FiCreditCard /> Add Bank Account
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
