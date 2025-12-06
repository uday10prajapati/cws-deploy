import React, { useState, useEffect } from "react";
import {
  Check,
  Clock,
  X,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
} from "lucide-react";

const AdminWashDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total_washes: 0,
    washed: 0,
    pending: 0,
    cancelled: 0,
    total_bookings: 0,
    booked_but_not_washed: 0,
    wash_completion_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings with wash status
      const res = await fetch("http://localhost:5000/bookings/admin/all-with-status");
      const bookingsData = await res.json();

      // Fetch statistics
      const statsRes = await fetch(
        "http://localhost:5000/bookings/stats/wash-summary"
      );
      const statsData = await statsRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "washed":
        return <Check className="text-green-500" size={20} />;
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      case "cancelled":
        return <X className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "washed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "washed":
        return "✅ Washed";
      case "pending":
        return "🔄 Pending";
      case "cancelled":
        return "❌ Cancelled";
      default:
        return "⏳ Not Started";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    let statusMatch = true;
    let dateMatch = true;

    if (filterStatus !== "all") {
      statusMatch = booking.wash_status === filterStatus;
    }

    if (filterDate) {
      const bookingDate = new Date(booking.created_at)
        .toISOString()
        .split("T")[0];
      dateMatch = bookingDate === filterDate;
    }

    return statusMatch && dateMatch;
  });

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className={`${color} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon size={40} className="opacity-80" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Wash Status Dashboard
          </h1>
          <p className="text-slate-400">
            Real-time monitoring of all car wash bookings and their status
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Washes"
            value={stats.total_washes}
            icon={BarChart3}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <StatCard
            label="Completed"
            value={stats.washed}
            icon={Check}
            color="bg-gradient-to-br from-green-600 to-green-700"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-gradient-to-br from-yellow-600 to-yellow-700"
          />
          <StatCard
            label="Completion Rate"
            value={`${stats.wash_completion_rate}%`}
            icon={TrendingUp}
            color="bg-gradient-to-br from-purple-600 to-purple-700"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Total Bookings</p>
            <p className="text-3xl font-bold text-cyan-400">{stats.total_bookings}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Booked but Not Washed</p>
            <p className="text-3xl font-bold text-yellow-400">
              {stats.booked_but_not_washed}
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-sm mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-red-400">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="pending">Pending</option>
                <option value="washed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDate("");
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              All Bookings & Wash Status ({filteredBookings.length})
            </h2>
            <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-all">
              <Download size={18} />
              Export
            </button>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No bookings found with selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Booking ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Car
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Booking Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Wash Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Services
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-cyan-400">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-semibold">{booking.car_name}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {booking.customer_id.substring(0, 10)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.wash_status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBgColor(
                              booking.wash_status
                            )}`}
                          >
                            {getStatusLabel(booking.wash_status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {Array.isArray(booking.services)
                          ? booking.services.join(", ")
                          : booking.services}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === booking.id ? null : booking.id
                            )
                          }
                          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                          {expandedId === booking.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expandedId && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6">
            {(() => {
              const booking = filteredBookings.find((b) => b.id === expandedId);
              if (!booking) return null;

              return (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Booking Details: {booking.car_name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Booking Info */}
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-4">
                        Booking Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-slate-400 text-sm">Booking ID</p>
                          <p className="text-white font-mono">{booking.id}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Date</p>
                          <p className="text-white">
                            {new Date(booking.created_at).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Amount</p>
                          <p className="text-white">₹{booking.amount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Wash Status Info */}
                    <div>
                      <h4 className="font-semibold text-cyan-400 mb-4">
                        Wash Status Information
                      </h4>
                      {booking.wash_details ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-400 text-sm">Status</p>
                            <p className="text-white font-semibold capitalize">
                              {booking.wash_status}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">
                              Wash Started
                            </p>
                            <p className="text-white">
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
                              <p className="text-slate-400 text-sm">
                                Completed
                              </p>
                              <p className="text-white">
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
                      ) : (
                        <p className="text-slate-400">
                          No wash record created yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWashDashboard;
