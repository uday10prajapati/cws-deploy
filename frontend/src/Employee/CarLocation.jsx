import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useLocation } from "react-router-dom";
import { FiMapPin, FiNavigation, FiMap, FiClock, FiAlertCircle, FiCheckCircle, FiPhone, FiUser, FiTruck, FiArrowRight, FiRefreshCw, FiChevronDown, FiChevronUp, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiDollarSign, FiBell } from "react-icons/fi";
import { FaCar, FaRoute, FaStar } from "react-icons/fa";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function CarLocation() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [locationRoute, setLocationRoute] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // active, pending, route, history
  useRoleBasedRedirect("employee");
  // Real-time location updates
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        setUser(auth.user);

        // Fetch active bookings
        const activeRes = await fetch(`http://localhost:5000/api/car-locations/active/${auth.user.id}`);
        const activeData = await activeRes.json();

        if (activeData.success) {
          setActiveBookings(activeData.active || []);
          setPendingBookings(activeData.pending || []);
        }

        // Fetch location stats
        const statsRes = await fetch(`http://localhost:5000/api/car-locations/stats/today/${auth.user.id}`);
        const statsData = await statsRes.json();

        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Fetch optimized route
        const routeRes = await fetch(`http://localhost:5000/api/car-locations/route/${auth.user.id}`);
        const routeData = await routeRes.json();

        if (routeData.success) {
          setLocationRoute(routeData.route || []);
        }
      } catch (err) {
        console.error("Error loading location data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /* EMPLOYEE MENU */
  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/employee-dashboard" },
    { name: "My Jobs", icon: <FiClipboard />, link: "/employee/jobs" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/employee/earnings" },
    { name: "Ratings", icon: <FaStar />, link: "/employee/ratings" },
    { name: "Cars", icon: <FaCar />, link: "/employee/cars" },
    { name: "Locations", icon: <FiMapPin />, link: "/employee/location" },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    try {
      const activeRes = await fetch(`http://localhost:5000/api/car-locations/active/${auth.user.id}`);
      const activeData = await activeRes.json();

      if (activeData.success) {
        setActiveBookings(activeData.active || []);
        setPendingBookings(activeData.pending || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/car-locations/update-status/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const BookingCard = ({ booking, isActive = false }) => (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/10 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
          <h3 className="font-semibold text-white">{booking.car_name}</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          booking.status === "In Progress" ? "bg-green-600/30 text-green-300 border border-green-500/30" :
          booking.status === "Confirmed" ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" :
          "bg-yellow-600/30 text-yellow-300 border border-yellow-500/30"
        }`}>
          {booking.status}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-3">
        {/* Customer Info */}
        {booking.customer && (
          <div className="flex items-center gap-2 text-slate-300">
            <FiUser size={16} className="text-blue-400" />
            <span>{booking.customer.full_name}</span>
            {booking.customer.phone && (
              <a href={`tel:${booking.customer.phone}`} className="ml-auto text-blue-400 hover:text-blue-300">
                <FiPhone size={16} />
              </a>
            )}
          </div>
        )}

        {/* Time Info */}
        <div className="flex items-center gap-2 text-slate-300">
          <FiClock size={16} className="text-orange-400" />
          <span>{booking.date} at {booking.time}</span>
        </div>

        {/* Car & Plate */}
        {booking.car && (
          <div className="flex items-center gap-2 text-slate-300">
            <FaCar size={16} className="text-purple-400" />
            <span>{booking.car.brand} {booking.car.model} · {booking.car.number_plate}</span>
          </div>
        )}

        {/* Service Location */}
        <div className="flex items-center gap-2 text-slate-200 bg-blue-600/20 p-2 rounded border border-blue-500/30">
          <FiMapPin size={16} className="text-blue-400 shrink-0" />
          <span className="font-medium">{booking.service_location}</span>
        </div>

        {/* Services */}
        {booking.services && Array.isArray(booking.services) && (
          <div className="flex flex-wrap gap-1">
            {booking.services.map((service, idx) => (
              <span key={idx} className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600">
                {service}
              </span>
            ))}
          </div>
        )}

        {/* Pickup Status */}
        <div className={`flex items-center gap-2 p-2 rounded border ${booking.pickup_required ? "bg-orange-600/20 border-orange-500/30" : "bg-green-600/20 border-green-500/30"}`}>
          <FiTruck size={16} className={booking.pickup_required ? "text-orange-400" : "text-green-400"} />
          <span className={booking.pickup_required ? "text-orange-300 font-medium" : "text-green-300"}>
            {booking.pickup_required ? "📍 Pickup Required" : "✓ Self Delivery"}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between bg-slate-700/50 p-2 rounded border border-slate-600">
          <span className="text-slate-400">Amount</span>
          <span className="font-bold text-green-400">₹{booking.amount}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {isActive && booking.status !== "Completed" && (
        <div className="flex gap-2">
          {booking.status === "Pending" || booking.status === "Confirmed" ? (
            <button
              onClick={() => updateBookingStatus(booking.id, "In Progress")}
              className="flex-1 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-3 rounded text-sm transition shadow-lg"
            >
              Start Delivery
            </button>
          ) : (
            <button
              onClick={() => updateBookingStatus(booking.id, "Completed")}
              className="flex-1 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-2 px-3 rounded text-sm transition shadow-lg"
            >
              Mark Completed
            </button>
          )}
        </div>
      )}
    </div>
  );

  const LocationRouteCard = ({ locationGroup, index }) => {
    const isExpanded = expandedLocation === index;

    return (
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition">
        <button
          onClick={() => setExpandedLocation(isExpanded ? null : index)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600/30 rounded-full border border-blue-500/30">
              <FiMapPin className="text-blue-400" size={18} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">{index + 1}. {locationGroup.location}</h3>
              <p className="text-sm text-slate-400">{locationGroup.total_jobs} job(s) · {locationGroup.pickup_count} pickups</p>
            </div>
          </div>
          {isExpanded ? <FiChevronUp size={20} className="text-slate-400" /> : <FiChevronDown size={20} className="text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="bg-slate-700/30 p-4 space-y-3 border-t border-slate-700">
            {locationGroup.bookings.map((booking) => (
              <div key={booking.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-white">{booking.car_name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {booking.time} · {booking.pickup ? "🚚 Pickup" : "✓ Self"}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                  booking.status === "In Progress" ? "bg-green-600/30 text-green-300 border-green-500/30" :
                  booking.status === "Confirmed" ? "bg-blue-600/30 text-blue-300 border-blue-500/30" :
                  "bg-yellow-600/30 text-yellow-300 border-yellow-500/30"
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-slate-300">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">

      {/* ▓▓ MOBILE TOP BAR ▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">CarWash+</h1>
        <FiMenu className="text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} />
      </div>

      {/* ▓▓ BACKDROP FOR MOBILE ▓▓ */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ▓▓ SIDEBAR ▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">{collapsed ? "CW" : "CarWash+"}</span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="mt-4 px-3 pb-24">
          {employeeMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
                ${
                  location.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓ MAIN CONTENT ▓▓ */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-56"} pt-16 lg:pt-0`}>
        {/* Header */}
        <div className="sticky top-16 lg:top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <FiMap className="text-blue-400" size={28} />
                </div>
                <h1 className="text-2xl font-bold text-white">Real-Time Locations</h1>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition shadow-lg hover:shadow-blue-500/50"
              >
                <FiRefreshCw size={18} />
                Refresh
              </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-linear-to-br from-blue-600/20 to-blue-600/10 rounded-lg p-3 text-center border border-blue-600/30">
                  <p className="text-xs text-blue-300 font-semibold">Today's Jobs</p>
                  <p className="text-2xl font-bold text-blue-200">{stats.total_today}</p>
                </div>
                <div className="bg-linear-to-br from-yellow-600/20 to-yellow-600/10 rounded-lg p-3 text-center border border-yellow-600/30">
                  <p className="text-xs text-yellow-300 font-semibold">Pending</p>
                  <p className="text-2xl font-bold text-yellow-200">{stats.pending}</p>
                </div>
                <div className="bg-linear-to-br from-green-600/20 to-green-600/10 rounded-lg p-3 text-center border border-green-600/30">
                  <p className="text-xs text-green-300 font-semibold">In Progress</p>
                  <p className="text-2xl font-bold text-green-200">{stats.in_progress}</p>
                </div>
                <div className="bg-linear-to-br from-purple-600/20 to-purple-600/10 rounded-lg p-3 text-center border border-purple-600/30">
                  <p className="text-xs text-purple-300 font-semibold">Completed</p>
                  <p className="text-2xl font-bold text-purple-200">{stats.completed}</p>
                </div>
                <div className="bg-linear-to-br from-orange-600/20 to-orange-600/10 rounded-lg p-3 text-center border border-orange-600/30">
                  <p className="text-xs text-orange-300 font-semibold">Pickups</p>
                  <p className="text-2xl font-bold text-orange-200">{stats.pickup_required}</p>
                </div>
                <div className="bg-linear-to-br from-teal-600/20 to-teal-600/10 rounded-lg p-3 text-center border border-teal-600/30">
                  <p className="text-xs text-teal-300 font-semibold">Self Delivery</p>
                  <p className="text-2xl font-bold text-teal-200">{stats.self_delivery}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-t border-slate-800 px-4 lg:px-8">
            <div className="flex gap-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab("active")}
                className={`py-3 px-4 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === "active"
                    ? "text-blue-400 border-blue-400"
                    : "text-slate-400 border-transparent hover:text-slate-300"
                }`}
              >
                Active ({activeBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-3 px-4 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === "pending"
                    ? "text-blue-400 border-blue-400"
                    : "text-slate-400 border-transparent hover:text-slate-300"
                }`}
              >
                Pending ({pendingBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("route")}
                className={`py-3 px-4 font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === "route"
                    ? "text-blue-400 border-blue-400"
                    : "text-slate-400 border-transparent hover:text-slate-300"
                }`}
              >
                Route ({locationRoute.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-8 py-6">
          {/* Active Deliveries Tab */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {activeBookings.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-12 text-center">
                  <FiCheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                  <p className="text-slate-300 font-semibold">No active deliveries</p>
                </div>
              ) : (
                activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isActive={true} />
                ))
              )}
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              {pendingBookings.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-12 text-center">
                  <FiAlertCircle className="mx-auto text-yellow-400 mb-4" size={48} />
                  <p className="text-slate-300 font-semibold">No pending deliveries</p>
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isActive={false} />
                ))
              )}
            </div>
          )}

          {/* Route Tab */}
          {activeTab === "route" && (
            <div className="space-y-4">
              {locationRoute.length === 0 ? (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-12 text-center">
                  <FaRoute className="mx-auto text-blue-400 mb-4" size={48} />
                  <p className="text-slate-300 font-semibold">No route for today</p>
                </div>
              ) : (
                <>
                  <div className="bg-linear-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur rounded-lg border border-blue-500/30 p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-600/30 rounded-lg">
                      <FaRoute className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-200">Optimized Route for Today</p>
                      <p className="text-sm text-slate-400">{locationRoute.length} locations · {locationRoute.reduce((sum, loc) => sum + loc.total_jobs, 0)} jobs</p>
                    </div>
                  </div>
                  {locationRoute.map((locationGroup, index) => (
                    <LocationRouteCard key={index} locationGroup={locationGroup} index={index} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
