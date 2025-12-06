import React, { useEffect, useState } from "react";
import { MapPin, Users, TrendingUp, Clock, Phone, Mail, Check, AlertCircle, Zap } from "lucide-react";

export default function AdminEmployeeTracking() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ total_washers: 0, total_riders: 0 });
  const [riders, setRiders] = useState([]);
  const [washers, setWashers] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [riderBookings, setRiderBookings] = useState([]);
  const [selectedWasher, setSelectedWasher] = useState(null);
  const [washerDetails, setWasherDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const API_URL = "http://localhost:5000";

  // Fetch employee counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin-stats/employee-count`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch all riders
  const fetchRiders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin-stats/all-riders`);
      const data = await res.json();
      if (data.success) {
        setRiders(data.riders || []);
      }
    } catch (err) {
      console.error("Error fetching riders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all washers
  const fetchWashers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin-stats/all-washers`);
      const data = await res.json();
      if (data.success) {
        setWashers(data.washers || []);
      }
    } catch (err) {
      console.error("Error fetching washers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rider location
  const fetchRiderLocation = async (riderId) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`${API_URL}/admin-stats/rider/${riderId}/location`);
      const data = await res.json();
      if (data.success) {
        setRiderLocation(data);
        // Also fetch bookings
        fetchRiderBookings(riderId);
      }
    } catch (err) {
      console.error("Error fetching rider location:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Fetch rider bookings
  const fetchRiderBookings = async (riderId) => {
    try {
      const res = await fetch(`${API_URL}/admin-stats/rider/${riderId}/bookings?limit=10`);
      const data = await res.json();
      if (data.success) {
        setRiderBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching rider bookings:", err);
    }
  };

  // Fetch washer details
  const fetchWasherDetails = async (washerId) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`${API_URL}/admin-stats/washer/${washerId}/details`);
      const data = await res.json();
      if (data.success) {
        setWasherDetails(data);
      }
    } catch (err) {
      console.error("Error fetching washer details:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (activeTab === "riders") fetchRiders();
    else if (activeTab === "washers") fetchWashers();
  }, [activeTab]);

  // Handle rider click
  const handleRiderClick = (rider) => {
    setSelectedRider(rider);
    setActiveTab("rider-detail");
    fetchRiderLocation(rider.id);
  };

  // Handle washer click
  const handleWasherClick = (washer) => {
    setSelectedWasher(washer);
    setActiveTab("washer-detail");
    fetchWasherDetails(washer.id);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Employee Management & Live Tracking
          </h1>
          <p className="text-gray-300">Monitor your washer and rider network in real-time</p>
        </div>

        {/* Overview Cards */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Washers */}
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Washers</p>
                  <h3 className="text-4xl font-bold">{stats.total_washers}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab("washers")}
                className="text-sm font-medium hover:underline text-blue-100"
              >
                View all washers →
              </button>
            </div>

            {/* Total Riders */}
            <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Riders</p>
                  <h3 className="text-4xl font-bold">{stats.total_riders}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab("riders")}
                className="text-sm font-medium hover:underline text-green-100"
              >
                View all riders →
              </button>
            </div>

            {/* Total Employees */}
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Team Members</p>
                  <h3 className="text-4xl font-bold">{stats.total_employees}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-purple-100">
                {stats.total_washers} washers + {stats.total_riders} riders
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-blue-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("riders")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "riders" || activeTab === "rider-detail"
                ? "bg-green-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            Riders ({stats.total_riders})
          </button>
          <button
            onClick={() => setActiveTab("washers")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "washers" || activeTab === "washer-detail"
                ? "bg-blue-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            Washers ({stats.total_washers})
          </button>
        </div>

        {/* RIDERS TAB */}
        {activeTab === "riders" && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              All Riders
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <Clock className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-300 mt-2">Loading riders...</p>
              </div>
            ) : riders.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">No riders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => handleRiderClick(rider)}
                    className="bg-linear-to-br from-green-900/20 to-green-800/10 border border-green-700/30 rounded-lg p-4 hover:border-green-500 cursor-pointer transition group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white group-hover:text-green-400 transition">
                          {rider.name}
                        </h3>
                        <p className="text-sm text-gray-400">{rider.email}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rider.is_online
                            ? "bg-green-500/20 text-green-300"
                            : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {rider.is_online ? "Online" : "Offline"}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        {rider.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">
                          {rider.todays_bookings_count} bookings today
                        </span>
                      </div>
                    </div>

                    {rider.current_location && (
                      <div className="mt-3 pt-3 border-t border-green-700/30">
                        <p className="text-xs text-gray-400">
                          📍 Last seen: {formatDate(rider.current_location.last_updated)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WASHERS TAB */}
        {activeTab === "washers" && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              All Washers
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-300 mt-2">Loading washers...</p>
              </div>
            ) : washers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">No washers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {washers.map((washer) => (
                  <div
                    key={washer.id}
                    onClick={() => handleWasherClick(washer)}
                    className="bg-linear-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white group-hover:text-blue-400 transition">
                          {washer.name}
                        </h3>
                        <p className="text-sm text-gray-400">{washer.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        {washer.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">
                          {washer.todays_washes} washes today
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">
                          {washer.washes_completed} completed, {washer.washes_pending} pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RIDER DETAIL TAB */}
        {activeTab === "rider-detail" && riderLocation && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab("riders")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              ← Back to Riders
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rider Info */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Rider Profile</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-medium">{riderLocation.rider.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {riderLocation.rider.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {riderLocation.rider.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p
                      className={`font-medium ${
                        riderLocation.is_online ? "text-green-400" : "text-gray-400"
                      }`}
                    >
                      {riderLocation.is_online ? "🟢 Online" : "🔴 Offline"}
                    </p>
                  </div>
                </div>

                {/* Current Booking */}
                {riderLocation.current_booking && (
                  <div className="mt-6 pt-6 border-t border-slate-600">
                    <h3 className="text-lg font-bold text-white mb-3">Current Booking</h3>
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Car</p>
                        <p className="text-white font-medium">{riderLocation.current_booking.car_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Pickup</p>
                        <p className="text-white font-medium">
                          {riderLocation.current_booking.pickup_location}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Dropoff</p>
                        <p className="text-white font-medium">
                          {riderLocation.current_booking.dropoff_location}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <p className="text-white font-medium capitalize">
                          {riderLocation.current_booking.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Location */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-red-400" />
                  Current Location
                </h2>

                {riderLocation.current_location ? (
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Latitude</p>
                        <p className="text-white font-mono font-medium">
                          {riderLocation.current_location.latitude.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Longitude</p>
                        <p className="text-white font-mono font-medium">
                          {riderLocation.current_location.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <p className="text-white font-medium capitalize">
                          {riderLocation.current_location.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Last Updated</p>
                        <p className="text-white font-medium">
                          {formatDate(riderLocation.current_location.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Google Maps Link */}
                    <a
                      href={`https://www.google.com/maps/search/${riderLocation.current_location.latitude},${riderLocation.current_location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition text-center flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      View on Google Maps
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No location data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location History */}
            {riderLocation.location_history && riderLocation.location_history.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Location History</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {riderLocation.location_history.map((loc, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-300">
                            📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {formatDate(loc.created_at)}
                          </p>
                        </div>
                        <span className="text-gray-400 capitalize text-xs bg-slate-600 px-2 py-1 rounded">
                          {loc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rider Bookings */}
            {riderBookings && riderBookings.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Bookings</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {riderBookings.map((booking) => (
                    <div key={booking.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">{booking.car_name}</p>
                          <p className="text-gray-400 text-sm">
                            {booking.customer?.name} • {booking.customer?.phone}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            booking.status === "completed"
                              ? "bg-green-500/20 text-green-300"
                              : booking.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>📍 From: {booking.pickup_location}</p>
                        <p>📍 To: {booking.dropoff_location}</p>
                        <p className="text-xs">
                          {formatDate(booking.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WASHER DETAIL TAB */}
        {activeTab === "washer-detail" && washerDetails && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab("washers")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              ← Back to Washers
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Washer Info */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Washer Profile</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-medium">{washerDetails.washer.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {washerDetails.washer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {washerDetails.washer.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Member Since</p>
                    <p className="text-white font-medium">
                      {formatDate(washerDetails.washer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Summary */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Today's Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-white">
                      {washerDetails.today_summary.total_washes}
                    </p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-green-300 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-300">
                      {washerDetails.today_summary.completed}
                    </p>
                  </div>
                  <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                    <p className="text-yellow-300 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-300">
                      {washerDetails.today_summary.pending}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Overall Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">Total Washes All Time</p>
                  <p className="text-3xl font-bold text-blue-300">
                    {washerDetails.overall_stats.total_washes_all_time}
                  </p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-4">
                  <p className="text-green-300 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-green-300">
                    {washerDetails.overall_stats.total_completed}
                  </p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4">
                  <p className="text-purple-300 text-sm">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-300">
                    {washerDetails.overall_stats.completion_rate}
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Washes */}
            {washerDetails.today_summary.washes && washerDetails.today_summary.washes.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Today's Washes</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {washerDetails.today_summary.washes.map((wash) => (
                    <div key={wash.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">Car: {wash.car_number}</p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(wash.created_at)}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            wash.status === "washed"
                              ? "bg-green-500/20 text-green-300"
                              : wash.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {wash.status}
                        </span>
                      </div>
                      {wash.notes && (
                        <p className="text-gray-400 text-sm">📝 {wash.notes}</p>
                      )}
                      {wash.wash_completed_at && (
                        <p className="text-green-400 text-xs mt-2">
                          ✅ Completed: {formatDate(wash.wash_completed_at)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
