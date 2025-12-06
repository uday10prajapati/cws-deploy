import React, { useState, useEffect } from "react";
import { Check, Clock, X, AlertCircle, Eye } from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const BookingWashStatus = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const customerId = localStorage.getItem("userId");

  useEffect(() => {
    // Load user data
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();

    if (customerId) {
      fetchBookingsWithStatus();
    }
  }, [customerId]);

  const fetchBookingsWithStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/bookings/customer/${customerId}`
      );
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    
    await supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    navigate("/login");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "washed":
        return <Check className="text-green-500" size={24} />;
      case "pending":
        return <Clock className="text-yellow-500" size={24} />;
      case "cancelled":
        return <X className="text-red-500" size={24} />;
      default:
        return <AlertCircle className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "washed":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "washed":
        return "✅ Car Washed";
      case "pending":
        return "🔄 Washing in Progress";
      case "cancelled":
        return "❌ Cancelled";
      default:
        return "⏳ Not Started";
    }
  };

  const filteredBookings =
    filterStatus === "all"
      ? bookings
      : bookings.filter((b) => b.wash_status === filterStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 mt-20 lg:mt-0 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Your Bookings & Wash Status
          </h1>
          <p className="text-slate-400">
            Track the status of your car wash bookings in real-time
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { value: "all", label: "All", count: bookings.length },
            {
              value: "not_started",
              label: "Not Started",
              count: bookings.filter((b) => b.wash_status === "not_started").length,
            },
            {
              value: "pending",
              label: "In Progress",
              count: bookings.filter((b) => b.wash_status === "pending").length,
            },
            {
              value: "washed",
              label: "Completed",
              count: bookings.filter((b) => b.wash_status === "washed").length,
            },
            {
              value: "cancelled",
              label: "Cancelled",
              count: bookings.filter((b) => b.wash_status === "cancelled").length,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
              >
                {/* Main Row */}
                <div
                  onClick={() =>
                    setExpandedId(
                      expandedId === booking.id ? null : booking.id
                    )
                  }
                  className="p-6 cursor-pointer hover:bg-slate-700/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {getStatusIcon(booking.wash_status)}
                    </div>

                    {/* Booking Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {booking.car_name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Booked: {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Wash Status Badge */}
                    <div
                      className={`px-4 py-2 rounded-lg font-semibold text-center border-2 ${getStatusColor(
                        booking.wash_status
                      )}`}
                    >
                      {getStatusLabel(booking.wash_status)}
                    </div>

                    {/* View Details Button */}
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                      <Eye size={20} className="text-slate-300" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === booking.id && (
                  <div className="border-t border-white/10 bg-slate-900/50 p-6 space-y-4">
                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Booking Date</p>
                        <p className="text-white font-semibold">
                          {new Date(booking.created_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Appointment Time</p>
                        <p className="text-white font-semibold">{booking.time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Services</p>
                        <p className="text-white font-semibold">
                          {Array.isArray(booking.services)
                            ? booking.services.join(", ")
                            : booking.services}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Amount</p>
                        <p className="text-white font-semibold">₹{booking.amount}</p>
                      </div>
                    </div>

                    {/* Wash Status Details */}
                    {booking.wash_details ? (
                      <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          {getStatusIcon(booking.wash_status)}
                          Wash Status Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-400">Status</p>
                            <p className={`font-semibold capitalize ${
                              booking.wash_status === "washed"
                                ? "text-green-400"
                                : booking.wash_status === "pending"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}>
                              {booking.wash_status}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Started</p>
                            <p className="text-white font-semibold">
                              {new Date(
                                booking.wash_details.created_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {booking.wash_details.wash_completed_at && (
                            <div>
                              <p className="text-slate-400">Completed</p>
                              <p className="text-white font-semibold">
                                {new Date(
                                  booking.wash_details.wash_completed_at
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {booking.wash_details.notes && (
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Notes</p>
                            <p className="text-slate-300">{booking.wash_details.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                        <p className="text-slate-400">
                          ⏳ Your wash will start soon. Check back for updates.
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Special Requests</p>
                        <p className="text-white">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BookingWashStatus;
