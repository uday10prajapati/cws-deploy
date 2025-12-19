import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MapPin, Users, TrendingUp, Clock, Phone, Mail, Check, AlertCircle, Zap, Menu, X, LogOut, ChevronDown, Home } from "lucide-react";
import { FiHome, FiClipboard, FiAlertCircle, FiDollarSign, FiUser, FiLogOut, FiChevronDown, FiMenu, FiX, FiUsers, FiWind } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function AdminEmployeeTracking() {
  const navigate = useNavigate();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationsDropdown, setOperationsDropdown] = useState(false);
  const [financeDropdown, setFinanceDropdown] = useState(false);
  const [adminAccountDropdown, setAdminAccountDropdown] = useState(false);

  const API_URL = "http://localhost:5000";

  const handleLogout = () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    navigate("/login");
  };

  const operationsMenu = [
    { label: "Approvals", link: "/admin/approvals", icon: <FiAlertCircle /> },
    { label: "Users", link: "/admin/users", icon: <FiUsers /> },
    { label: "Riders", link: "/admin/riders", icon: <FiAlertCircle /> },
    { label: "Customer Accounts", link: "/admin/customer-accounts", icon: <FiUsers /> },
    { label: "Cars", link: "/admin/cars", icon: <FaCar /> },
    { label: "WasherDocuments", link: "/admin/washer-documents", icon: <FiAlertCircle /> },
    { label: "Emergency Wash", link: "/admin/emergency-wash", icon: <FiWind /> },
  ];

  const financeMenu = [
    { label: "Revenue", link: "/admin/AllRevenue", icon: <FiAlertCircle /> },
    { label: "Earnings", link: "/admin/earnings", icon: <FiAlertCircle /> },
    { label: "Bank Account", link: "/admin/bank-account", icon: <FiAlertCircle /> },
  ];

  const adminAccountMenu = [
    { label: "Settings", link: "/admin/settings", icon: <FiAlertCircle /> },
    { label: "Profile", link: "/admin/profile", icon: <FiUser /> },
  ];

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
    <>
      {/* PROFESSIONAL LIGHT NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-blue-200 shadow-sm z-50">
        <div className="w-full mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link
            to="/admin/dashboard"
            className="text-2xl font-extrabold text-slate-900 flex items-center gap-1 shrink-0"
          >
            <span className="bg-linear-to-r from-blue-700 to-blue-600 text-transparent bg-clip-text">CarWash</span>
            <span className="text-blue-600">+</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Dashboard */}
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-100"
            >
              <FiHome size={18} />
              Dashboard
            </Link>

            {/* Bookings */}
            <Link
              to="/admin/bookings"
              className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-100"
            >
              <FiClipboard size={18} />
              Bookings
            </Link>

            {/* Operations Dropdown */}
            <div className="relative group">
              <button
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                onMouseEnter={() => setOperationsDropdown(true)}
                onMouseLeave={() => setOperationsDropdown(false)}
              >
                Operations
                <FiChevronDown className={`transition-transform ${operationsDropdown ? "rotate-180" : ""}`} size={16} />
              </button>
              <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${operationsDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onMouseEnter={() => setOperationsDropdown(true)}
                onMouseLeave={() => setOperationsDropdown(false)}
              >
                <div className="py-2">
                  {operationsMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Finance Dropdown */}
            <div className="relative group">
              <button
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                onMouseEnter={() => setFinanceDropdown(true)}
                onMouseLeave={() => setFinanceDropdown(false)}
              >
                Finance
                <FiChevronDown className={`transition-transform ${financeDropdown ? "rotate-180" : ""}`} size={16} />
              </button>
              <div className={`absolute top-full left-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${financeDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onMouseEnter={() => setFinanceDropdown(true)}
                onMouseLeave={() => setFinanceDropdown(false)}
              >
                <div className="py-2">
                  {financeMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Dropdown */}
            <div className="relative group">
              <button
                className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 group-hover:bg-slate-100"
                onMouseEnter={() => setAdminAccountDropdown(true)}
                onMouseLeave={() => setAdminAccountDropdown(false)}
              >
                <FiUser size={18} />
                <FiChevronDown className={`transition-transform ${adminAccountDropdown ? "rotate-180" : ""}`} size={16} />
              </button>
              <div className={`absolute top-full right-0 mt-0 w-56 bg-white border border-blue-200 rounded-lg shadow-lg z-50 transition-all duration-200 ${adminAccountDropdown ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onMouseEnter={() => setAdminAccountDropdown(true)}
                onMouseLeave={() => setAdminAccountDropdown(false)}
              >
                <div className="py-2">
                  {adminAccountMenu.map((item) => (
                    <Link
                      key={item.label}
                      to={item.link}
                      className="px-4 py-2.5 flex items-center gap-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-base text-blue-600">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                  <div className="border-t border-blue-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-slate-700 hover:text-blue-600"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-blue-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link to="/admin/dashboard" className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg">
                Dashboard
              </Link>
              <Link to="/admin/bookings" className="block px-4 py-2 text-slate-700 hover:bg-blue-50 rounded-lg">
                Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className="pt-20">
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            👥 Employee Management & Live Tracking
          </h1>
          <p className="text-slate-600">Monitor your washer and rider network in real-time</p>
        </div>

        {/* Overview Cards */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Washers */}
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Washers</p>
                  <h3 className="text-4xl font-bold text-slate-900">{stats.total_washers}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab("washers")}
                className="text-sm font-medium hover:text-blue-700 text-blue-600"
              >
                View all washers →
              </button>
            </div>

            {/* Total Riders */}
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Riders</p>
                  <h3 className="text-4xl font-bold text-slate-900">{stats.total_riders}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab("riders")}
                className="text-sm font-medium hover:text-green-700 text-green-600"
              >
                View all riders →
              </button>
            </div>

            {/* Total Employees */}
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Team Members</p>
                  <h3 className="text-4xl font-bold text-slate-900">{stats.total_employees}</h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600">
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
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-blue-200 hover:bg-slate-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("riders")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "riders" || activeTab === "rider-detail"
                ? "bg-green-600 text-white"
                : "bg-white text-slate-700 border border-blue-200 hover:bg-slate-50"
            }`}
          >
            Riders ({stats.total_riders})
          </button>
          <button
            onClick={() => setActiveTab("washers")}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === "washers" || activeTab === "washer-detail"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-blue-200 hover:bg-slate-50"
            }`}
          >
            Washers ({stats.total_washers})
          </button>
        </div>

        {/* RIDERS TAB */}
        {activeTab === "riders" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              All Riders
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-slate-600 mt-2">Loading riders...</p>
              </div>
            ) : riders.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No riders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => handleRiderClick(rider)}
                    className="bg-linear-to-br from-green-50 to-white border border-green-200 rounded-lg p-4 hover:border-green-400 hover:shadow-md cursor-pointer transition group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-green-600 transition">
                          {rider.name}
                        </h3>
                        <p className="text-sm text-slate-600">{rider.email}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rider.is_online
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rider.is_online ? "Online" : "Offline"}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-4 h-4" />
                        {rider.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-slate-700">
                          {rider.todays_bookings_count} bookings today
                        </span>
                      </div>
                    </div>

                    {rider.current_location && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-slate-600">
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              All Washers
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-slate-600 mt-2">Loading washers...</p>
              </div>
            ) : washers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No washers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {washers.map((washer) => (
                  <div
                    key={washer.id}
                    onClick={() => handleWasherClick(washer)}
                    className="bg-linear-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {washer.name}
                        </h3>
                        <p className="text-sm text-slate-600">{washer.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-4 h-4" />
                        {washer.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-700">
                          {washer.todays_washes} washes today
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-slate-700">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              ← Back to Riders
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rider Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Rider Profile
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Name</p>
                    <p className="text-slate-900 font-medium mt-1">{riderLocation.rider.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Email</p>
                    <p className="text-slate-700 font-medium flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {riderLocation.rider.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Phone</p>
                    <p className="text-slate-700 font-medium flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {riderLocation.rider.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Status</p>
                    <p
                      className={`font-medium mt-1 ${
                        riderLocation.is_online ? "text-green-600" : "text-slate-500"
                      }`}
                    >
                      {riderLocation.is_online ? "🟢 Online" : "🔴 Offline"}
                    </p>
                  </div>
                </div>

                {/* Current Booking */}
                {riderLocation.current_booking && (
                  <div className="mt-6 pt-6 border-t border-blue-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Current Booking</h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Car</p>
                        <p className="text-slate-900 font-medium mt-1">{riderLocation.current_booking.car_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Pickup</p>
                        <p className="text-slate-700 font-medium mt-1">
                          {riderLocation.current_booking.pickup_location}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Dropoff</p>
                        <p className="text-slate-700 font-medium mt-1">
                          {riderLocation.current_booking.dropoff_location}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Status</p>
                        <p className="text-slate-700 font-medium capitalize mt-1">
                          {riderLocation.current_booking.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Location */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Current Location
                </h2>

                {riderLocation.current_location ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-100">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Latitude</p>
                        <p className="text-slate-900 font-mono font-medium mt-1">
                          {riderLocation.current_location.latitude.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Longitude</p>
                        <p className="text-slate-900 font-mono font-medium mt-1">
                          {riderLocation.current_location.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Status</p>
                        <p className="text-slate-700 font-medium capitalize mt-1">
                          {riderLocation.current_location.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Last Updated</p>
                        <p className="text-slate-700 font-medium mt-1">
                          {formatDate(riderLocation.current_location.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Google Maps Link */}
                    <a
                      href={`https://www.google.com/maps/search/${riderLocation.current_location.latitude},${riderLocation.current_location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-center flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      View on Google Maps
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">No location data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location History */}
            {riderLocation.location_history && riderLocation.location_history.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Location History</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {riderLocation.location_history.map((loc, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-3 text-sm border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-700">
                            📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                          <p className="text-slate-600 text-xs mt-1">
                            {formatDate(loc.created_at)}
                          </p>
                        </div>
                        <span className="text-slate-600 capitalize text-xs bg-blue-100 px-2 py-1 rounded border border-blue-200">
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
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Recent Bookings</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {riderBookings.map((booking) => (
                    <div key={booking.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-slate-900 font-medium">{booking.car_name}</p>
                          <p className="text-slate-600 text-sm">
                            {booking.customer?.name} • {booking.customer?.phone}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 space-y-1">
                        <p>📍 From: {booking.pickup_location}</p>
                        <p>📍 To: {booking.dropoff_location}</p>
                        <p className="text-xs text-slate-600">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              ← Back to Washers
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Washer Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Washer Profile
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Name</p>
                    <p className="text-slate-900 font-medium mt-1">{washerDetails.washer.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Email</p>
                    <p className="text-slate-700 font-medium flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {washerDetails.washer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Phone</p>
                    <p className="text-slate-700 font-medium flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {washerDetails.washer.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Member Since</p>
                    <p className="text-slate-700 font-medium mt-1">
                      {formatDate(washerDetails.washer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Today's Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-slate-600 text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {washerDetails.today_summary.total_washes}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-green-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {washerDetails.today_summary.completed}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                    <p className="text-yellow-600 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {washerDetails.today_summary.pending}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Overall Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Washes All Time</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {washerDetails.overall_stats.total_washes_all_time}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {washerDetails.overall_stats.total_completed}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-purple-600 text-sm font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {washerDetails.overall_stats.completion_rate}
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Washes */}
            {washerDetails.today_summary.washes && washerDetails.today_summary.washes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Today's Washes</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {washerDetails.today_summary.washes.map((wash) => (
                    <div key={wash.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-slate-900 font-medium">Car: {wash.car_number}</p>
                          <p className="text-slate-600 text-sm">
                            {formatDate(wash.created_at)}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            wash.status === "washed"
                              ? "bg-green-100 text-green-700"
                              : wash.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {wash.status}
                        </span>
                      </div>
                      {wash.notes && (
                        <p className="text-slate-700 text-sm">📝 {wash.notes}</p>
                      )}
                      {wash.wash_completed_at && (
                        <p className="text-green-600 text-xs mt-2">
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
      </main>
    </>
  );
}
