import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import { FiBell } from "react-icons/fi";

const WMyjob = () => {
  const navigate = useNavigate();

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState(null);

  const employeeId = localStorage.getItem("userId");

  // Status colors - Light Theme
  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Confirmed: "bg-blue-100 text-blue-700 border-blue-300",
    "In Progress": "bg-purple-100 text-purple-700 border-purple-300",
    Completed: "bg-green-100 text-green-700 border-green-300",
    Cancelled: "bg-red-100 text-red-700 border-red-300",
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <NavbarNew />

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">💼 My Jobs</h1>
            <p className="text-slate-600">Manage your work and track job status</p>
          </div>

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
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
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
              <p className="text-slate-600 mt-4">Loading jobs...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-100 rounded-lg border border-slate-300">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <p className="text-slate-700">No jobs available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white border border-slate-300 rounded-lg overflow-hidden hover:border-blue-400 transition-all shadow-sm"
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() =>
                      setExpandedBooking(
                        expandedBooking === booking.id ? null : booking.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {booking.car_name || "Unknown Car"}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            {booking.time || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
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
                    <div className="border-t border-slate-300 bg-slate-50 p-4 space-y-4">
                      {/* Booking Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Date</p>
                          <p className="text-slate-900 font-medium">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Amount</p>
                          <p className="text-slate-900 font-medium">
                            ₹{booking.amount || "0"}
                          </p>
                        </div>
                      </div>

                      {/* Services */}
                      {booking.services && (
                        <div>
                          <p className="text-slate-600 text-sm mb-2">Services</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(booking.services)
                              ? booking.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
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
                          <p className="text-slate-600 text-sm mb-1">Notes</p>
                          <p className="text-slate-700 text-sm bg-white p-2 rounded border border-slate-300">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-300">
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
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 rounded-lg transition-colors border border-red-300"
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
      </div>
    </div>
  );
};

export default WMyjob;
