import React, { useEffect, useState } from "react";
import {
  FiMenu,
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiTrendingUp,
  FiDollarSign,
  FiBell,
  FiClipboard,
  FiCreditCard,
  FiAlertCircle,
  FiSearch,
  FiCheck,
  FiX,
  FiClock,
  FiEye,
  FiToggleLeft,
} from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function CustomerAccountManagement() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // State for customer management
  const [activeTab, setActiveTab] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useRoleBasedRedirect("admin");

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/account-status/summary`);
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, []);

  // Fetch customers based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab, filterStatus, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      let queryParams = new URLSearchParams();

      if (activeTab === "all") {
        endpoint = `/account-status/customers`;
      } else if (activeTab === "pending") {
        endpoint = `/account-status/pending-requests`;
      }

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (filterStatus !== "all" && activeTab === "all") {
        queryParams.append("status", filterStatus);
      }

      const query = queryParams.toString()
        ? `?${queryParams.toString()}`
        : "";
      const res = await fetch(`${API_URL}${endpoint}${query}`);
      const data = await res.json();

      if (data.success) {
        if (activeTab === "all") {
          setCustomers(data.customers || []);
        } else if (activeTab === "pending") {
          setPendingRequests(data.pending_requests || []);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details
  const fetchCustomerDetail = async (customerId) => {
    try {
      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}`
      );
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(data.customer);
        setShowDetail(true);
      }
    } catch (err) {
      console.error("Error fetching customer detail:", err);
    }
  };

  // Handle activate customer
  const handleActivate = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/activate/${customerId}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(`✅ ${customerName} has been activated`);
        await fetchData();
        await fetchSummary();
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to activate customer");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle deactivate customer
  const handleDeactivate = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/deactivate/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: deactivateReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(`❌ ${customerName} has been deactivated`);
        await fetchData();
        await fetchSummary();
        setDeactivateReason("");
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to deactivate customer");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve deactivation request
  const handleApproveDeactivation = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/approve-deactivate/${customerId}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(
          `✅ Deactivation approved for ${customerName}`
        );
        await fetchData();
        await fetchSummary();
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to approve deactivation");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject deactivation request
  const handleRejectDeactivation = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/reject-deactivate/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(
          `✅ Deactivation request rejected for ${customerName}`
        );
        await fetchData();
        await fetchSummary();
        setRejectReason("");
        setShowRejectModal(false);
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to reject deactivation");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
            ✅ Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
            ❌ Inactive
          </span>
        );
      case "deactivate_requested":
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
            ⏳ Pending Approval
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sidebar links
  const menuItems = [
    { icon: FiHome, label: "Dashboard", href: "/admin/dashboard" },
    { icon: FiClipboard, label: "Bookings", href: "/admin/all-bookings" },
    { icon: FiUsers, label: "Users", href: "/admin/all-user" },
    { icon: FiTrendingUp, label: "Analytics", href: "/admin/analytics" },
    { icon: FiDollarSign, label: "Revenue", href: "/admin/all-revenue" },
    { icon: FiCreditCard, label: "Earnings", href: "/admin/earnings" },
    { icon: FiSettings, label: "Settings", href: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 bg-slate-800 border-r border-slate-700 transition-transform duration-300 z-50 md:relative md:translate-x-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                location.pathname === item.href
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold flex-1 md:flex-none">
            Customer Account Management
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-400 hover:text-white transition"
            >
              <FiBell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-linear-to-br from-slate-900 via-slate-900 to-slate-800">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {summary.total_customers}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-400">
                    {summary.active}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.active_percentage}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-red-400">
                    {summary.inactive}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">
                    Pending Deactivation
                  </p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {summary.pending_deactivation}
                  </p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-700">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setFilterStatus("all");
                }}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                📋 All Customers
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 font-medium border-b-2 transition flex items-center gap-2 ${
                  activeTab === "pending"
                    ? "border-yellow-500 text-yellow-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                ⏳ Pending Requests
                {summary && summary.pending_deactivation > 0 && (
                  <span className="bg-yellow-500 text-xs font-bold px-2 py-1 rounded-full">
                    {summary.pending_deactivation}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Filter */}
            {activeTab === "all" && (
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {/* Content Area */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <FiSettings className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400 mt-2">Loading customers...</p>
              </div>
            ) : activeTab === "all" ? (
              <div className="space-y-3">
                {customers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <FiAlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">No customers found</p>
                  </div>
                ) : (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => fetchCustomerDetail(customer.id)}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                            {customer.name}
                          </h3>
                          <p className="text-sm text-gray-400">{customer.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            📞 {customer.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(customer.account_status)}
                          <p className="text-xs text-gray-500 mt-2">
                            Joined: {formatDate(customer.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <FiCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => fetchCustomerDetail(request.id)}
                      className="bg-slate-800/50 border border-yellow-700/50 rounded-lg p-4 hover:border-yellow-500 cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-yellow-400 transition">
                            {request.name}
                          </h3>
                          <p className="text-sm text-gray-400">{request.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            📞 {request.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                            ⏳ Pending Approval
                          </span>
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {formatDate(request.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000]p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedCustomer(null);
                  setActionSuccess("");
                  setActionError("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Messages */}
              {actionSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-sm">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                  {actionError}
                </div>
              )}

              {/* Customer Info */}
              <div>
                <p className="text-gray-400 text-sm mb-1">Email</p>
                <p className="text-white">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Phone</p>
                <p className="text-white">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                {getStatusBadge(selectedCustomer.account_status)}
              </div>

              {/* Activity Info */}
              {selectedCustomer.activity && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Activity</p>
                  <div className="space-y-1 text-sm">
                    <p>📋 Total Bookings: {selectedCustomer.activity.total_bookings}</p>
                    <p>✅ Completed: {selectedCustomer.activity.completed_bookings}</p>
                    {selectedCustomer.activity.last_booking_date && (
                      <p>📅 Last Booking: {formatDate(selectedCustomer.activity.last_booking_date)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-700">
                {selectedCustomer.account_status === "active" && (
                  <>
                    <button
                      onClick={() =>
                        handleDeactivate(selectedCustomer.id, selectedCustomer.name)
                      }
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      ❌ Deactivate Account
                    </button>
                    {deactivateReason && (
                      <input
                        type="text"
                        placeholder="Reason for deactivation (optional)"
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500"
                      />
                    )}
                  </>
                )}

                {selectedCustomer.account_status === "inactive" && (
                  <button
                    onClick={() =>
                      handleActivate(selectedCustomer.id, selectedCustomer.name)
                    }
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500 text-green-300 rounded-lg transition disabled:opacity-50"
                  >
                    ✅ Activate Account
                  </button>
                )}

                {selectedCustomer.account_status === "deactivate_requested" && (
                  <>
                    <button
                      onClick={() =>
                        handleApproveDeactivation(
                          selectedCustomer.id,
                          selectedCustomer.name
                        )
                      }
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500 text-green-300 rounded-lg transition disabled:opacity-50"
                    >
                      ✅ Approve Deactivation
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      ❌ Reject Request
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedCustomer(null);
                    setActionSuccess("");
                    setActionError("");
                  }}
                  className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1001 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-sm w-full">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold">Reject Deactivation Request</h3>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleRejectDeactivation(
                      selectedCustomer.id,
                      selectedCustomer.name
                    )
                  }
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 rounded-lg transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
