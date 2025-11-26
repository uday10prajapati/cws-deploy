import { useEffect, useState } from "react";
import { useNavigate, useLocation as useLocationHook, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useNotifications } from "../context/NotificationContext";

import {
  FiMapPin,
  FiPhone,
  FiMessageSquare,
  FiArrowLeft,
  FiTruck,
  FiHome,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiNavigation,
  FiMenu,
  FiBell,
  FiLogOut,
  FiChevronLeft,
  FiClipboard,
  FiUser,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function Location() {
  const navigate = useNavigate();
  const locationHook = useLocationHook();
  const { addNotification } = useNotifications();

  // State
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [status, setStatus] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [trackingActive, setTrackingActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  // Menu items
  const customerMenu = [
    { name: "Home", icon: <FiHome />, link: "/customer-dashboard" },
    { name: "My Bookings", icon: <FiClipboard />, link: "/bookings" },
    { name: "My Cars", icon: <FaCar />, link: "/my-cars" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  // Get booking ID from state or URL
  const bookingId = locationHook.state?.bookingId;

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);
    };
    loadUser();
  }, []);

  // Monitor status changes and send notifications
  useEffect(() => {
    if (!booking) return;

    const checkStatusUpdates = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("status")
        .eq("id", booking.id)
        .single();

      if (data && data.status !== status) {
        const newStatus = data.status;
        setStatus(newStatus);

        // Send appropriate notifications based on new status
        if (newStatus === "pickup_in_progress") {
          await addNotification(
            "pickup",
            "🚗 Pickup Started!",
            "Your car pickup is on the way. Driver is heading to your location.",
            { bookingId: booking.id }
          );
        } else if (newStatus === "in_wash") {
          await addNotification(
            "booking",
            "🧼 Car in Wash",
            "Your car has arrived at our wash center and cleaning has started.",
            { bookingId: booking.id }
          );
        } else if (newStatus === "delivery_in_progress") {
          await addNotification(
            "delivery",
            "📦 Delivery Started!",
            "Your car is on the way back to you. Driver will arrive soon!",
            { bookingId: booking.id }
          );
        } else if (newStatus === "completed") {
          await addNotification(
            "booking",
            "✓ Delivery Complete!",
            "Your car has been successfully delivered. Thank you for using CarWash+!",
            { bookingId: booking.id }
          );
        }
      }
    };

    // Check for status updates every 5 seconds
    const interval = setInterval(checkStatusUpdates, 5000);
    return () => clearInterval(interval);
  }, [booking, status, addNotification]);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      LOAD BOOKING DATA
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  useEffect(() => {
    const loadBooking = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          navigate("/login");
          return;
        }

        // If no bookingId, try to get latest booking for this customer
        let booking_id = bookingId;
        
        if (!booking_id) {
          console.warn("No bookingId passed. Fetching latest booking...");
          const { data: latestBooking } = await supabase
            .from("bookings")
            .select("*")
            .eq("customer_id", auth.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (!latestBooking) {
            console.error("No bookings found");
            setLoading(false);
            return;
          }
          booking_id = latestBooking.id;
        }

        // Get booking details
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", booking_id)
          .eq("customer_id", auth.user.id)
          .single();

        if (error || !data) {
          console.error("Booking not found:", error);
          setLoading(false);
          return;
        }

        console.log("✅ Booking loaded:", data);
        setBooking(data);
        setStatus(data.status);

        // Simulate driver location for tracking
        // Show tracking for: pending, confirmed, pickup, wash, delivery statuses
        const trackableStatuses = ["Pending", "Confirmed", "pickup_in_progress", "in_wash", "delivery_in_progress"];
        if (trackableStatuses.includes(data.status)) {
          setTrackingActive(true);
          simulateDriverLocation(data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading booking:", err);
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, navigate]);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      GET USER LOCATION
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      // Use default location (Delhi)
      setUserLocation({ lat: 28.7041, lng: 77.1025 });
      return;
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Initial location:", { latitude, longitude });
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Location error:", error);
        // Fallback to Delhi location
        setUserLocation({ lat: 28.7041, lng: 77.1025 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    // Watch location for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error("Watch location error:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      SIMULATE DRIVER LOCATION
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const simulateDriverLocation = (bookingData) => {
    // Simulate driver moving towards user
    let currentLat = 28.7041 + Math.random() * 0.01;
    let currentLng = 77.1025 + Math.random() * 0.01;

    const interval = setInterval(() => {
      if (userLocation) {
        // Move driver towards user
        currentLat += (userLocation.lat - currentLat) * 0.01;
        currentLng += (userLocation.lng - currentLng) * 0.01;

        setDriverLocation({ lat: currentLat, lng: currentLng });

        // Calculate distance
        const dist = calculateDistance(
          currentLat,
          currentLng,
          userLocation.lat,
          userLocation.lng
        );
        setDistance(dist);

        // Estimate time
        const estimatedTime = Math.ceil(dist * 2); // ~2 min per km
        setEta(estimatedTime);

        // Stop when close enough
        if (dist < 0.1) {
          clearInterval(interval);
          setTrackingActive(false);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      CALCULATE DISTANCE
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      GET STATUS BADGE
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: "bg-yellow-600", text: "Pending" },
      confirmed: { color: "bg-blue-600", text: "Confirmed" },
      pickup_in_progress: { color: "bg-orange-600", text: "Picking Up" },
      in_wash: { color: "bg-purple-600", text: "In Wash" },
      delivery_in_progress: { color: "bg-indigo-600", text: "Delivering" },
      completed: { color: "bg-green-600", text: "Completed" },
      cancelled: { color: "bg-red-600", text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return config;
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      SIMPLE MAP DISPLAY
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const MapDisplay = () => (
    <div className="relative w-full h-96 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mb-6">
      {/* Map placeholder using iframe - you can replace with Google Maps, Mapbox, etc */}
      <iframe
        title="Live Location Map"
        width="100%"
        height="100%"
        frameBorder="0"
        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDZHoNZGVhk5LL0qhMp-WKrM8W1GhT48eE&q=${
          userLocation?.lat || 28.7041
        },${userLocation?.lng || 77.1025}`}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-white text-sm font-semibold">LIVE</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading location...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <FiAlertCircle className="text-5xl text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
          <p className="text-slate-400">Unable to load booking details</p>
          <button
            onClick={() => navigate("/bookings")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusBadge();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo Row */}
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>

          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {customerMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg 
                mb-2 font-medium transition-all
                ${
                  locationHook.pathname === item.link
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.name : ""}
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
            text-white px-4 py-2 font-semibold rounded-lg cursor-pointer 
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div
        className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-56"
        }`}
      >
        {/* NAVBAR */}
        <header
          className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
          items-center justify-between px-8 sticky top-0 z-20 shadow-lg"
        >
          <h1 className="text-2xl font-bold">Live Tracking</h1>

          <div className="flex items-center gap-8">
            <button className="text-xl text-slate-300 hover:text-blue-400 transition">
              <FiBell />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 md:p-8 space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate("/bookings")}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <FiArrowLeft className="text-xl" />
              <span>Back to Bookings</span>
            </button>
          </div>

          {/* STATUS BADGE */}
          <div className="mb-6">
            <div className={`${statusConfig.color} text-white px-6 py-3 rounded-xl inline-block font-semibold`}>
              {statusConfig.text}
            </div>
          </div>

          {/* MAP DISPLAY */}
          {showMap && <MapDisplay />}

          {/* TRACKING INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* DISTANCE & ETA */}
        {trackingActive && (
          <>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FiNavigation className="text-2xl text-blue-400" />
                <h3 className="text-lg font-semibold">Distance</h3>
              </div>
              <p className="text-4xl font-bold text-blue-300">
                {distance ? distance.toFixed(1) : "---"} km
              </p>
              <p className="text-slate-400 text-sm">Current distance to your location</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FiClock className="text-2xl text-orange-400" />
                <h3 className="text-lg font-semibold">ETA</h3>
              </div>
              <p className="text-4xl font-bold text-orange-300">
                {eta ? `${eta}` : "---"} min
              </p>
              <p className="text-slate-400 text-sm">Estimated arrival time</p>
            </div>
          </>
        )}
      </div>

      {/* CAR DETAILS */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <FaCar className="text-2xl text-blue-400" />
          <h3 className="text-lg font-semibold">Vehicle Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-sm">Car Name</p>
            <p className="text-white font-semibold">{booking?.car_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Service Type</p>
            <p className="text-white font-semibold capitalize">
              {booking?.services && booking.services.length > 0
                ? booking.services.join(", ")
                : "Standard"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Booking Date</p>
            <p className="text-white font-semibold">
              {booking?.date || new Date(booking?.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Booking Time</p>
            <p className="text-white font-semibold">{booking?.time || "N/A"}</p>
          </div>
        </div>

        {/* Add-ons Display */}
        {booking?.addons && Object.keys(booking.addons).length > 0 && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <p className="text-slate-400 text-sm mb-2">Add-ons</p>
            <div className="space-y-2">
              {Object.entries(booking.addons).map(([service, addonIds]) => (
                <div key={service} className="text-slate-300 text-sm">
                  <p className="font-semibold text-blue-300">{service}:</p>
                  <p className="text-slate-400 ml-2">{Array.isArray(addonIds) ? addonIds.join(", ") : "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amount Display */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <p className="text-slate-400 text-sm">Total Amount</p>
          <p className="text-2xl font-bold text-green-400">₹{booking?.amount || "0"}</p>
        </div>
      </div>

      {/* LOCATION INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* PICKUP LOCATION */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FiTruck className="text-2xl text-orange-400" />
            <h3 className="text-lg font-semibold">Pickup Details</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-slate-400 text-sm">Location</p>
              <p className="text-white font-semibold">{booking?.location || "Main Outlet"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Date & Time</p>
              <p className="text-white font-semibold">
                {booking?.date} at {booking?.time}
              </p>
            </div>
            {booking?.pickup && (
              <div className="bg-orange-600/20 border border-orange-500/30 rounded p-2">
                <p className="text-orange-300 text-sm">✓ Pickup & Delivery Included</p>
              </div>
            )}
          </div>
        </div>

        {/* DELIVERY LOCATION */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FiHome className="text-2xl text-green-400" />
            <h3 className="text-lg font-semibold">Special Notes</h3>
          </div>
          <div className="space-y-2">
            {booking?.notes ? (
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-slate-300 text-sm">{booking.notes}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No special notes added</p>
            )}
            <div>
              <p className="text-slate-400 text-sm">Booking Status</p>
              <p className="text-white font-semibold capitalize">{booking?.status || "Pending"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER CONTACT */}
      {(status === "pickup_in_progress" || status === "delivery_in_progress") && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-lg font-semibold">Contact Driver</h3>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              <FiPhone className="text-lg" />
              <span>Call Driver</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              <FiMessageSquare className="text-lg" />
              <span>Message</span>
            </button>
          </div>
        </div>
      )}

      {/* BOOKING COMPLETED */}
      {status === "completed" && (
        <div className="bg-green-600/20 border border-green-500/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-2xl text-green-400" />
            <h3 className="text-lg font-semibold text-green-300">Booking Completed!</h3>
          </div>
          <p className="text-slate-300">Your car has been successfully delivered. Thank you for using CarWash+!</p>
          <button
            onClick={() => navigate("/bookings")}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            View Bookings
          </button>
        </div>
      )}

      {/* TOGGLE MAP */}
      <button
        onClick={() => setShowMap(!showMap)}
        className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-lg font-semibold transition"
      >
        {showMap ? "Hide Map" : "Show Map"}
      </button>
        </main>
      </div>
    </div>
  );
}
