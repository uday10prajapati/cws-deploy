import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiHome,
  FiBell,
  FiMenu,
  FiChevronLeft,
  FiLogOut,
  FiClipboard,
  FiUser,
} from "react-icons/fi";

const WMyjob = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState(null);

  const employeeId = localStorage.getItem("userId");

  // Status colors
  const statusColors = {
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "In Progress": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Completed: "bg-green-500/20 text-green-400 border-green-500/30",
    Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusIcons = {
    Pending: <Clock className="w-4 h-4" />,
    Confirmed: <CheckCircle className="w-4 h-4" />,
    "In Progress": <AlertCircle className="w-4 h-4" />,
    Completed: <CheckCircle className="w-4 h-4" />,
    Cancelled: <XCircle className="w-4 h-4" />,
  };

  // Load bookings
  useEffect(() => {
    if (employeeId) {
      loadUser();
      fetchBookings();
    }
  }, [employeeId]);

  // Filter bookings
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === activeFilter));
    }
  }, [bookings, activeFilter]);

  const loadUser = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch all pending bookings that can be assigned to a washer
      const response = await fetch("http://localhost:5000/bookings/");
      if (response.ok) {
        const result = await response.json();
        // Filter for pending bookings only
        const pending = result.bookings?.filter(
          (b) => b.status === "Pending" || b.status === "Confirmed"
        ) || [];
        setBookings(pending);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes: "" }),
        }
      );

      if (response.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: newStatus } : b
          )
        );
      }
    } catch (err) {
      console.error("Error updating booking:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  /* WASHER MENU */
  const washerMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/carwash", active: location.pathname === "/carwash" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/washer/jobs", active: location.pathname === "/washer/jobs" },
    { name: "Profile", icon: <FiUser />, link: "/profile", active: location.pathname === "/profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓ MOBILE TOP BAR ▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
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
        className={`fixed lg:static top-16 lg:top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            {collapsed ? "C+" : "CarWash+"}
          </h1>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {washerMenu.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                navigate(item.link);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? "bg-blue-600/30 text-blue-400 border-l-2 border-blue-600"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
          >
            <FiLogOut className="text-xl" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-blue-600 p-1 rounded-full shadow-lg hover:bg-blue-700"
        >
          <FiChevronLeft
            className={`text-white transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </aside>

      {/* ▓▓ MAIN CONTENT ▓▓ */}
      <main className="flex-1 flex flex-col mt-16 lg:mt-0">
        {/* Navbar */}
        <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 shadow-lg sticky top-16 lg:top-0 z-30 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white hidden lg:block">My Jobs</h2>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-white relative">
              <FiBell className="text-2xl" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {bookings.length}
              </span>
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Pending", "Confirmed", "In Progress", "Completed"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                    activeFilter === filter
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {filter}
                </button>
              )
            )}
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-400 mt-4">Loading jobs...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <p className="text-slate-400">No jobs available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-600/50 transition-all"
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-800/70 transition-colors"
                    onClick={() =>
                      setExpandedBooking(
                        expandedBooking === booking.id ? null : booking.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {booking.car_name || "Unknown Car"}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-400" />
                            {booking.time || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {booking.location || "Main Outlet"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            statusColors[booking.status]
                          }`}
                        >
                          {statusIcons[booking.status]}
                          <span className="text-sm font-medium">
                            {booking.status}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            expandedBooking === booking.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedBooking === booking.id && (
                    <div className="border-t border-slate-700 bg-slate-900/50 p-4 space-y-4">
                      {/* Booking Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Date</p>
                          <p className="text-white font-medium">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Amount</p>
                          <p className="text-white font-medium">
                            ₹{booking.amount || "0"}
                          </p>
                        </div>
                      </div>

                      {/* Services */}
                      {booking.services && (
                        <div>
                          <p className="text-slate-400 text-sm mb-2">Services</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(booking.services)
                              ? booking.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs"
                                  >
                                    {service}
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {booking.notes && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Notes</p>
                          <p className="text-slate-300 text-sm bg-slate-800/50 p-2 rounded">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-700">
                        {booking.status === "Pending" && (
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "Confirmed")
                            }
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                          >
                            Accept Job
                          </button>
                        )}
                        {booking.status === "Confirmed" && (
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "In Progress")
                            }
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-colors"
                          >
                            Start Job
                          </button>
                        )}
                        {booking.status === "In Progress" && (
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "Completed")
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                          >
                            Complete Job
                          </button>
                        )}
                        <button
                          onClick={() =>
                            updateBookingStatus(booking.id, "Cancelled")
                          }
                          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-2 rounded-lg transition-colors border border-red-600/50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WMyjob;
