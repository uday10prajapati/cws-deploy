import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiX, FiAlertCircle, FiCheck, FiClock, FiToggleLeft, FiRefreshCw, FiMenu, FiChevronLeft, FiHome, FiClipboard, FiMapPin, FiCreditCard, FiSettings, FiAward } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { FaCar } from "react-icons/fa";

export default function CustomerAccountSettings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(null);
  const [accountStatus, setAccountStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reactivationReason, setReactivationReason] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  const API_URL = "http://localhost:5000";

  const customerMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/customer-dashboard" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Monthly Pass", icon: <FiAward />, link: "/monthly-pass" },
    { name: "Profile", icon: <FiSettings />, link: "/profile" },
    { name: "Location", icon: <FiMapPin />, link: "/location" },
    { name: "Transactions", icon: <FiCreditCard />, link: "/transactions" },
    { name: "Account Settings", icon: <FiSettings />, link: "/account-settings" },
    { name: "Emergency Wash", icon: <FiAlertCircle />, link: "/emergency-wash" },
    { name: "About Us", icon: <FiGift />, link: "/about-us" },
  ];

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          setCustomerId(auth.user.id);
          setUser(auth.user);
          
          // Get account status from profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_status")
            .eq("id", auth.user.id)
            .single();

          if (profile) {
            setAccountStatus(profile.account_status || "active");
          }
        }
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    
    await supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    navigate("/login");
  };

  const handleRequestDeactivation = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/request-deactivate`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("deactivate_requested");
        setSuccessMessage(
          "✅ Your deactivation request has been submitted. Admin will review it soon."
        );
        setShowDeactivateModal(false);
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to request deactivation");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeactivateRequest = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/cancel-deactivate`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("active");
        setSuccessMessage("✅ Deactivation request cancelled.");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to cancel request");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/request-reactivate`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reactivationReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("reactivate_requested");
        setSuccessMessage(
          "✅ Your reactivation request has been submitted. Admin will review it soon."
        );
        setShowReactivateModal(false);
        setReactivationReason("");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to request reactivation");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <FiLogOut className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-300">Loading account settings...</p>
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
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
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

        {/* Menu */}
        <nav className="mt-4 px-3 pb-24">
          {customerMenu.map((item) => (
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

        {/* Logout */}
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
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header
          className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
          items-center justify-between px-8 sticky top-0 z-20 shadow-lg"
        >
          <h1 className="text-2xl font-bold">Account Settings</h1>

          <div className="flex items-center gap-8">
            <button className="text-xl text-slate-300 hover:text-blue-400 transition">
              <FiLogOut />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 space-y-6">
        <div className="max-w-2xl">
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiToggleLeft className="w-8 h-8 text-blue-400" />
            Account Settings
          </h1>
          <p className="text-gray-300">Manage your account status and privacy</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 flex items-center gap-3 animate-in">
            <FiCheck className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Account Status Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6 hover:border-slate-600 transition">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FiToggleLeft className="w-6 h-6 text-blue-400" />
            Account Status
          </h2>

          <div className="space-y-4">
            {/* Current Status */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-3 font-medium">Current Status</p>
              <div className="flex items-center gap-3">
                {accountStatus === "active" && (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-green-400">✅ Account Active</p>
                      <p className="text-sm text-green-300/70">You can access all features</p>
                    </div>
                  </>
                )}
                {accountStatus === "inactive" && (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-lg font-semibold text-red-400">❌ Account Inactive</p>
                      <p className="text-sm text-red-300/70">Your account has been deactivated</p>
                    </div>
                  </>
                )}
                {accountStatus === "deactivate_requested" && (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-yellow-400">⏳ Deactivation Pending</p>
                      <p className="text-sm text-yellow-300/70">Awaiting admin approval</p>
                    </div>
                  </>
                )}
                {accountStatus === "reactivate_requested" && (
                  <>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-blue-400">🔄 Reactivation Pending</p>
                      <p className="text-sm text-blue-300/70">Awaiting admin approval</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Information */}
            {accountStatus === "active" && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                  Your account is active and fully functional. You can make bookings, manage your profile, and access all platform features.
                </p>
              </div>
            )}

            {accountStatus === "inactive" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                <p className="text-red-300 text-sm font-medium">
                  Your account has been deactivated.
                </p>
                <p className="text-red-300/80 text-sm">
                  You cannot make new bookings or access your account. Send a reactivation request to the admin team to restore your account access.
                </p>
              </div>
            )}

            {accountStatus === "deactivate_requested" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                <p className="text-yellow-300 text-sm font-medium">
                  Deactivation Request Pending
                </p>
                <p className="text-yellow-300/80 text-sm">
                  Your account will remain active until the admin approves your deactivation request. You can cancel this request anytime.
                </p>
              </div>
            )}

            {accountStatus === "reactivate_requested" && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                <p className="text-blue-300 text-sm font-medium">
                  Reactivation Request Pending
                </p>
                <p className="text-blue-300/80 text-sm">
                  Your reactivation request is under review by the admin team. You'll be notified once it's processed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-blue-400" />
            Account Actions
          </h3>

          <div className="space-y-3">
            {accountStatus === "active" && (
              <>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <FiLogOut className="w-5 h-5" />
                  Request Account Deactivation
                </button>
                <p className="text-gray-400 text-xs text-center">
                  Your account will remain active until admin approves the request
                </p>
              </>
            )}

            {accountStatus === "inactive" && (
              <>
                <button
                  onClick={() => setShowReactivateModal(true)}
                  className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 hover:text-blue-200 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  Request Account Reactivation
                </button>
                <p className="text-gray-400 text-xs text-center">
                  Send a request to admin team to restore your account
                </p>
              </>
            )}

            {accountStatus === "deactivate_requested" && (
              <>
                <button
                  onClick={handleCancelDeactivateRequest}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 hover:text-blue-200 rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX className="w-5 h-5" />
                  {actionLoading ? "Cancelling..." : "Cancel Deactivation Request"}
                </button>
                <p className="text-gray-400 text-xs text-center">
                  Cancel your pending deactivation request and keep your account active
                </p>
              </>
            )}

            {accountStatus === "reactivate_requested" && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-gray-300 text-sm text-center">
                  ⏳ Your reactivation request is pending. We'll notify you once the admin has reviewed it.
                </p>
              </div>
            )}

            <Link
              to="/profile"
              className="w-full px-4 py-3 bg-linear-to-r from-blue-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 border border-blue-500/50 rounded-lg transition font-medium text-center text-gray-200 hover:text-white"
            >
              View Full Profile
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>
              <strong>How it works:</strong> You can deactivate your account anytime. Once deactivated, contact the admin team to reactivate it. 
              All your data will be preserved during deactivation.
            </span>
          </p>
        </div>
        </div>
        </main>
      </div>
    </div>
  );
}
