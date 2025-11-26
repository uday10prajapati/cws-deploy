import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { FiBell, FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiClipboard, FiGift, FiDollarSign, FiTruck } from "react-icons/fi";
import { FaCreditCard } from "react-icons/fa";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment":
        return <FaCreditCard className="text-blue-400" />;
      case "booking":
        return <FiClipboard className="text-green-400" />;
      case "pass":
        return <FiGift className="text-purple-400" />;
      case "wallet":
        return <FiDollarSign className="text-yellow-400" />;
      case "pickup":
      case "delivery":
        return <FiTruck className="text-orange-400" />;
      default:
        return <FiInfo className="text-slate-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "payment":
        return "border-blue-500/30 bg-blue-600/10";
      case "booking":
        return "border-green-500/30 bg-green-600/10";
      case "pass":
        return "border-purple-500/30 bg-purple-600/10";
      case "wallet":
        return "border-yellow-500/30 bg-yellow-600/10";
      case "pickup":
      case "delivery":
        return "border-orange-500/30 bg-orange-600/10";
      default:
        return "border-slate-600/30 bg-slate-600/10";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-300 hover:text-blue-400 transition text-xl focus:outline-none"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-slate-400 text-xs">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-slate-700">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FiBell className="text-4xl text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition border-l-4 ${
                    notif.read
                      ? "border-slate-700 opacity-60"
                      : "border-blue-500 bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg mt-1">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{notif.title}</p>
                      <p className="text-slate-300 text-xs mt-1">{notif.message}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition mt-1 shrink-0"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-2 text-center">
              <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
