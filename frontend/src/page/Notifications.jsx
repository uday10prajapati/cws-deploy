import { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import NavbarNew from "../components/NavbarNew";
import { FiBell, FiTrash2, FiFilter, FiCheck, FiCheckCircle, FiAlertCircle, FiInfo, FiClipboard, FiGift, FiDollarSign, FiTruck, FiCalendar, FiSearch, FiUser, FiFileText } from "react-icons/fi";
import { FaCreditCard } from "react-icons/fa";

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [displayMode, setDisplayMode] = useState("list"); // list or grid

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notif => {
    const typeMatch = filterType === "all" || notif.type === filterType;
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "read" && notif.read) || 
      (filterStatus === "unread" && !notif.read);
    const searchMatch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return typeMatch && statusMatch && searchMatch;
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === "unread") {
      return a.read - b.read;
    }
    return 0;
  });

  // Get stats
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    payment: notifications.filter(n => n.type === "payment").length,
    booking: notifications.filter(n => n.type === "booking").length,
    pass: notifications.filter(n => n.type === "pass").length,
    delivery: notifications.filter(n => n.type === "delivery" || n.type === "pickup").length,
    userRegistered: notifications.filter(n => n.type === "user_registered").length,
    documentVerification: notifications.filter(n => n.type === "document_verification").length,
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment":
        return <FaCreditCard className="text-blue-600" />;
      case "booking":
        return <FiClipboard className="text-emerald-600" />;
      case "pass":
        return <FiGift className="text-purple-600" />;
      case "wallet":
        return <FiDollarSign className="text-amber-600" />;
      case "pickup":
      case "delivery":
        return <FiTruck className="text-orange-600" />;
      case "user_registered":
        return <FiUser className="text-indigo-600" />;
      case "document_verification":
        return <FiFileText className="text-rose-600" />;
      default:
        return <FiInfo className="text-slate-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "payment":
        return "bg-linear-to-br from-blue-50 via-blue-100 to-cyan-50 border-l-4 border-blue-500 hover:shadow-lg hover:shadow-blue-200";
      case "booking":
        return "bg-linear-to-br from-emerald-50 via-green-100 to-teal-50 border-l-4 border-emerald-500 hover:shadow-lg hover:shadow-emerald-200";
      case "pass":
        return "bg-linear-to-br from-purple-50 via-purple-100 to-pink-50 border-l-4 border-purple-500 hover:shadow-lg hover:shadow-purple-200";
      case "wallet":
        return "bg-linear-to-br from-amber-50 via-yellow-100 to-orange-50 border-l-4 border-amber-500 hover:shadow-lg hover:shadow-amber-200";
      case "pickup":
      case "delivery":
        return "bg-linear-to-br from-orange-50 via-red-100 to-rose-50 border-l-4 border-orange-500 hover:shadow-lg hover:shadow-orange-200";
      case "user_registered":
        return "bg-linear-to-br from-indigo-50 via-indigo-100 to-blue-50 border-l-4 border-indigo-500 hover:shadow-lg hover:shadow-indigo-200";
      case "document_verification":
        return "bg-linear-to-br from-rose-50 via-pink-100 to-red-50 border-l-4 border-rose-500 hover:shadow-lg hover:shadow-rose-200";
      default:
        return "bg-linear-to-br from-slate-50 via-slate-100 to-gray-50 border-l-4 border-slate-500 hover:shadow-lg hover:shadow-slate-200";
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case "payment":
        return "bg-linear-to-br from-blue-500 to-cyan-500";
      case "booking":
        return "bg-linear-to-br from-emerald-500 to-teal-500";
      case "pass":
        return "bg-linear-to-br from-purple-500 to-pink-500";
      case "wallet":
        return "bg-linear-to-br from-amber-500 to-orange-500";
      case "pickup":
      case "delivery":
        return "bg-linear-to-br from-orange-500 to-red-500";
      case "user_registered":
        return "bg-linear-to-br from-indigo-500 to-blue-500";
      case "document_verification":
        return "bg-linear-to-br from-rose-500 to-red-500";
      default:
        return "bg-linear-to-br from-slate-500 to-gray-500";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <FiBell className="text-blue-600" />
            🔔 Notifications
          </h1>
          <p className="text-slate-600">Manage all your notifications and updates</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-slate-600 mt-1">Total</p>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-red-600">{stats.unread}</p>
            <p className="text-xs text-slate-600 mt-1">Unread</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-blue-600">{stats.payment}</p>
            <p className="text-xs text-slate-600 mt-1">Payment</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-emerald-600">{stats.booking}</p>
            <p className="text-xs text-slate-600 mt-1">Booking</p>
          </div>
          <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-purple-600">{stats.pass}</p>
            <p className="text-xs text-slate-600 mt-1">Pass</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-orange-600">{stats.delivery}</p>
            <p className="text-xs text-slate-600 mt-1">Delivery</p>
          </div>
          <div className="bg-white border border-indigo-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-indigo-600">{stats.userRegistered}</p>
            <p className="text-xs text-slate-600 mt-1">New Users</p>
          </div>
          <div className="bg-white border border-rose-200 rounded-lg p-4 shadow-sm text-center hover:shadow-md transition">
            <p className="text-3xl font-bold text-rose-600">{stats.documentVerification}</p>
            <p className="text-xs text-slate-600 mt-1">Documents</p>
          </div>
        </div>

        {/* FILTER & ACTION BAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="booking">Booking</option>
              <option value="pass">Pass</option>
              <option value="wallet">Wallet</option>
              <option value="delivery">Delivery/Pickup</option>
              <option value="user_registered">New User</option>
              <option value="document_verification">Document Verification</option>
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <FiCheck size={16} />
                Mark All as Read
              </button>
            )}
            {stats.total > 0 && (
              <button
                onClick={() => {
                  sortedNotifications.forEach(notif => deleteNotification(notif.id));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                <FiTrash2 size={16} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        {sortedNotifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-md">
            <FiBell className="text-6xl text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-600">
              {notifications.length === 0 
                ? "You don't have any notifications yet" 
                : "No notifications match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white border border-slate-200 rounded-xl p-5 shadow-md transition duration-300 ${
                  notif.read ? "opacity-75" : ""
                } ${getNotificationColor(notif.type)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon Container with Gradient */}
                  <div className={`w-14 h-14 rounded-xl ${getNotificationBgColor(notif.type)} flex items-center justify-center text-2xl shrink-0 text-white shadow-md`}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="text-slate-900 font-bold text-base">{notif.title}</h3>
                        {notif.type && (
                          <span className={`inline-block mt-2 px-3 py-1 text-white text-xs font-semibold rounded-full ${getNotificationBgColor(notif.type)}`}>
                            {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                          </span>
                        )}
                      </div>
                      {!notif.read && (
                        <div className="w-3 h-3 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 mt-2 shrink-0 animate-pulse shadow-lg" />
                      )}
                    </div>

                    <p className="text-slate-700 text-sm mb-3 leading-relaxed">{notif.message}</p>

                    {/* Data display if exists */}
                    {notif.data && Object.keys(notif.data).length > 0 && (
                      <div className="bg-linear-to-r from-slate-50 to-slate-100 rounded-lg p-4 mb-3 text-xs border border-slate-200">
                        {Object.entries(notif.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-slate-700 py-1.5 border-b border-slate-200 last:border-b-0">
                            <span className="font-semibold capitalize text-slate-600">{key.replace(/_/g, " ")}:</span>
                            <span className="font-medium text-slate-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <FiCalendar size={12} />
                        {formatDate(notif.created_at)}
                      </span>
                      <div className="flex gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-semibold transition px-3 py-1 rounded-lg flex items-center gap-1"
                          >
                            <FiCheckCircle size={14} />
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-semibold transition px-3 py-1 rounded-lg flex items-center gap-1"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION INFO */}
        {sortedNotifications.length > 0 && (
          <div className="mt-8 text-center text-slate-600 text-sm">
            Showing {sortedNotifications.length} of {notifications.length} notifications
          </div>
        )}
      </main>
    </div>
  );
}
