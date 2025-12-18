import { useEffect, useState } from "react";
import { useNavigate, useLocation as useLocationHook, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useNotifications } from "../context/NotificationContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  FiMapPin,
  FiPhone,
  FiMessageSquare,
  FiArrowLeft,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiNavigation,
  FiLogOut,
  FiX,
  FiHome 
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const userMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Location() {
  const navigate = useNavigate();
  const locationHook = useLocationHook();
  const { addNotification } = useNotifications();

  useRoleBasedRedirect("customer");
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
  const [user, setUser] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

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
          const { data: latestBooking } = await supabase
            .from("bookings")
            .select("*")
            .eq("customer_id", auth.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (!latestBooking) {
            setLoading(false);
            return;
          }
          booking_id = latestBooking.id;
        }

        // Get booking details from Supabase
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", booking_id)
          .eq("customer_id", auth.user.id)
          .single();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setBooking(data);
        setStatus(data.status);

        // Generate timeline from booking status
        generateTimeline(data);

        // Fetch tracking history for today
        fetchTrackingHistory(booking_id, selectedDate);

        // Fetch live location if tracking is active
        const trackableStatuses = ["Pending", "Confirmed", "pickup_in_progress", "in_wash", "delivery_in_progress"];
        if (trackableStatuses.includes(data.status)) {
          setTrackingActive(true);
          fetchLiveLocation(booking_id);
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
        setUserLocation({ latitude, longitude });
      },
      (error) => {
        console.error("Location error:", error);
        // Fallback to Nagpur location
        setUserLocation({ latitude: 21.6372, longitude: 72.9956 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    // Watch location for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
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
      GENERATE TIMELINE
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const generateTimeline = (bookingData) => {
    const timelineEvents = [
      {
        status: "pending",
        label: "Booking Confirmed",
        time: new Date(bookingData.created_at),
        icon: "📋",
        completed: true,
      },
      {
        status: "Confirmed",
        label: "Assigned to Driver",
        time: bookingData.assigned_to ? new Date(bookingData.created_at) : null,
        icon: "👤",
        completed: !!bookingData.assigned_to,
      },
      {
        status: "pickup_in_progress",
        label: "Pickup in Progress",
        time: bookingData.status === "pickup_in_progress" ? new Date() : null,
        icon: "🚗",
        completed: ["pickup_in_progress", "in_wash", "delivery_in_progress", "completed"].includes(bookingData.status),
      },
      {
        status: "in_wash",
        label: "Car in Wash",
        time: bookingData.status === "in_wash" ? new Date() : null,
        icon: "🧼",
        completed: ["in_wash", "delivery_in_progress", "completed"].includes(bookingData.status),
      },
      {
        status: "delivery_in_progress",
        label: "Delivery in Progress",
        time: bookingData.status === "delivery_in_progress" ? new Date() : null,
        icon: "📦",
        completed: ["delivery_in_progress", "completed"].includes(bookingData.status),
      },
      {
        status: "completed",
        label: "Delivered",
        time: bookingData.status === "completed" ? new Date() : null,
        icon: "✅",
        completed: bookingData.status === "completed",
      },
    ];

    setTimeline(timelineEvents);
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      FETCH TRACKING HISTORY
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const fetchTrackingHistory = async (bookingId, date) => {
    try {
      console.log(`📡 Fetching tracking for booking: ${bookingId}, date: ${date}`);
      
      const res = await fetch(
        `http://localhost:5000/api/car-locations/tracking-history/${bookingId}?date=${date}`
      );
      
      console.log(`📊 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`⚠️ Tracking data not available (${res.status})`, errorText);
        setTrackingHistory({ data: null });
        return;
      }

      const data = await res.json();

      if (data.success) {
        console.log(`✅ Retrieved ${data.data.summary.total_points} tracking points`);
        setTrackingHistory({ data: data.data });
        console.log("📍 Tracking data loaded:", data.data);
        
        // Update map with all coordinates if available
        if (data.data?.all_tracking && data.data.all_tracking.length > 0) {
          const lastPoint = data.data.all_tracking[data.data.all_tracking.length - 1];
          setDriverLocation({
            lat: lastPoint.latitude,
            lng: lastPoint.longitude
          });
          console.log(`🗺️ Updated driver location to: ${lastPoint.latitude}, ${lastPoint.longitude}`);
        }
      } else {
        console.warn("⚠️ Response success is false");
        setTrackingHistory({ data: null });
      }
    } catch (err) {
      console.error("❌ Error fetching tracking history:", err);
      setTrackingHistory({ data: null });
    }
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      FETCH LIVE LOCATION
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const fetchLiveLocation = async (bookingId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/car-locations/live/${bookingId}`);
      
      if (!res.ok) {
        console.warn("⚠️ Live location not available yet");
        return;
      }

      const data = await res.json();

      if (data.success && data.data.location) {
        setDriverLocation({
          lat: data.data.location.latitude,
          lng: data.data.location.longitude
        });
      }
    } catch (err) {
      console.error("Error fetching live location:", err);
    }
  };
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
      LEAFLET MAP DISPLAY
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const MapDisplay = () => {
    // Get all tracking points from live_tracking table
    const allTrackingPoints = trackingHistory?.data?.all_tracking || [];
    
    console.log("🎯 All tracking points:", allTrackingPoints.length, allTrackingPoints);
    console.log("🎯 All tracking points statuses:", allTrackingPoints.map(p => ({ status: p.status, lat: p.latitude, lng: p.longitude })));
    
    // Find the 4 key points - exact status matching
    const pickupStarted = allTrackingPoints.find(p => p.status === "pickup_started");
    const pickupEnded = allTrackingPoints.find(p => p.status === "pickup_ended");
    const deliveryStarted = allTrackingPoints.find(p => p.status === "delivery_started");
    const deliveryEnded = allTrackingPoints.find(p => p.status === "delivery_ended");
    
    console.log("🗺️ Key points found:", { pickupStarted: !!pickupStarted, pickupEnded: !!pickupEnded, deliveryStarted: !!deliveryStarted, deliveryEnded: !!deliveryEnded });
    console.log("🟠 Pickup Started:", pickupStarted);
    console.log("🟠 Pickup Ended:", pickupEnded);
    console.log("🟢 Delivery Started:", deliveryStarted);
    console.log("🟢 Delivery Ended:", deliveryEnded);

    // Use the latest point for center, or user location, or default
    const lastTrackingPoint = allTrackingPoints.length > 0 
      ? allTrackingPoints[allTrackingPoints.length - 1]
      : null;

    const mapCenter = lastTrackingPoint 
      ? { lat: lastTrackingPoint.latitude, lng: lastTrackingPoint.longitude }
      : userLocation 
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : { lat: 21.6372, lng: 72.9956 };

    // Create polylines for each segment
    const pickupSegment = pickupStarted && pickupEnded
      ? [[pickupStarted.latitude, pickupStarted.longitude], [pickupEnded.latitude, pickupEnded.longitude]]
      : null;

    const deliverySegment = deliveryStarted && deliveryEnded
      ? [[deliveryStarted.latitude, deliveryStarted.longitude], [deliveryEnded.latitude, deliveryEnded.longitude]]
      : null;

    // Connecting line between all 4 points
    const timelinePath = [
      pickupStarted && [pickupStarted.latitude, pickupStarted.longitude],
      pickupEnded && [pickupEnded.latitude, pickupEnded.longitude],
      deliveryStarted && [deliveryStarted.latitude, deliveryStarted.longitude],
      deliveryEnded && [deliveryEnded.latitude, deliveryEnded.longitude],
    ].filter(Boolean);

    // Icon for each point type
    const pickupStartedIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const deliveryStartedIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    return (
      <div className="relative w-full h-96 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mb-6 shadow-lg">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userMarkerIcon}>
              <Popup>
                <div className="text-sm font-semibold">📍 Your Location</div>
              </Popup>
            </Marker>
          )}

          {/* Timeline connecting all 4 points */}
          {timelinePath.length > 1 && (
            <Polyline
              positions={timelinePath}
              color="#6366f1"
              weight={3}
              opacity={0.7}
            />
          )}

          {/* 1. PICKUP STARTED (Orange) */}
          {pickupStarted && (
            <Marker position={[pickupStarted.latitude, pickupStarted.longitude]} icon={pickupStartedIcon}>
              <Popup>
                <div className="text-sm font-semibold">🟠 Pickup Started</div>
                <div className="text-xs text-slate-600 mt-1">
                  {new Date(pickupStarted.updated_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600">
                  Lat: {pickupStarted.latitude.toFixed(6)}<br/>
                  Lng: {pickupStarted.longitude.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 2. PICKUP ENDED (Orange) */}
          {pickupEnded && (
            <Marker position={[pickupEnded.latitude, pickupEnded.longitude]} icon={pickupStartedIcon}>
              <Popup>
                <div className="text-sm font-semibold">🟠 Pickup Ended</div>
                <div className="text-xs text-slate-600 mt-1">
                  {new Date(pickupEnded.updated_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600">
                  Lat: {pickupEnded.latitude.toFixed(6)}<br/>
                  Lng: {pickupEnded.longitude.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 3. DELIVERY STARTED (Green) */}
          {deliveryStarted && (
            <Marker position={[deliveryStarted.latitude, deliveryStarted.longitude]} icon={deliveryStartedIcon}>
              <Popup>
                <div className="text-sm font-semibold">🟢 Delivery Started</div>
                <div className="text-xs text-slate-600 mt-1">
                  {new Date(deliveryStarted.updated_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600">
                  Lat: {deliveryStarted.latitude.toFixed(6)}<br/>
                  Lng: {deliveryStarted.longitude.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 4. DELIVERY ENDED (Green) */}
          {deliveryEnded && (
            <Marker position={[deliveryEnded.latitude, deliveryEnded.longitude]} icon={deliveryStartedIcon}>
              <Popup>
                <div className="text-sm font-semibold">🟢 Delivery Ended</div>
                <div className="text-xs text-slate-600 mt-1">
                  {new Date(deliveryEnded.updated_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600">
                  Lat: {deliveryEnded.latitude.toFixed(6)}<br/>
                  Lng: {deliveryEnded.longitude.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pickup segment line (Orange) */}
          {pickupSegment && (
            <Polyline
              positions={pickupSegment}
              color="#ff8000"
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Delivery segment line (Green) */}
          {deliverySegment && (
            <Polyline
              positions={deliverySegment}
              color="#22c55e"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Live indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full z-10 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-semibold">LIVE</span>
        </div>

        {/* Tracking Info */}
        {allTrackingPoints.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 px-4 py-3 rounded-lg text-white text-sm border border-slate-700 z-10 space-y-1">
            <div>📍 <span className="font-semibold">{allTrackingPoints.length} tracking points</span></div>
            <div>🟠 <span className="text-orange-400">Pickup</span>: {pickupStarted ? '✓' : '○'} Started • {pickupEnded ? '✓' : '○'} Ended</div>
            <div>🟢 <span className="text-green-400">Delivery</span>: {deliveryStarted ? '✓' : '○'} Started • {deliveryEnded ? '✓' : '○'} Ended</div>
            {lastTrackingPoint && (
              <div className="text-xs text-slate-300">Last: {new Date(lastTrackingPoint.updated_at).toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      TIMELINE DISPLAY
  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ */
  const TimelineDisplay = () => {
    // Separate pickup and delivery timelines
    const pickupTimeline = timeline.filter(e => 
      e.status === "pending" || e.status === "Confirmed" || e.status === "pickup_in_progress"
    );
    const washTimeline = timeline.filter(e => e.status === "in_wash");
    const deliveryTimeline = timeline.filter(e => 
      e.status === "delivery_in_progress" || e.status === "completed"
    );

    return (
      <div className="w-full space-y-6">
        {/* PICKUP TIMELINE */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiTruck className="text-orange-400" />
            Pickup Timeline
          </h3>
          
          <div className="relative">
            <div className="absolute left-7 top-0 bottom-0 w-1 bg-linear-to-b from-orange-500 to-orange-600" />
            <div className="space-y-4">
              {pickupTimeline.map((event, index) => (
                <div key={index} className="flex gap-6 relative">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg relative z-10 ${
                    event.completed
                      ? "bg-linear-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50"
                      : "bg-slate-700 border-2 border-slate-600"
                  }`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-semibold ${event.completed ? "text-orange-400" : "text-slate-300"}`}>
                      {event.label}
                    </p>
                    {event.time && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WASH TIMELINE */}
        {washTimeline.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FiClock className="text-purple-400" />
              Wash Timeline
            </h3>
            
            <div className="relative">
              <div className="absolute left-7 top-0 bottom-0 w-1 bg-linear-to-b from-purple-500 to-purple-600" />
              <div className="space-y-4">
                {washTimeline.map((event, index) => (
                  <div key={index} className="flex gap-6 relative">
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg relative z-10 ${
                      event.completed
                        ? "bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"
                        : "bg-slate-700 border-2 border-slate-600"
                    }`}>
                      {event.icon}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold ${event.completed ? "text-purple-400" : "text-slate-300"}`}>
                        {event.label}
                      </p>
                      {event.time && (
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY TIMELINE */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiHome className="text-green-400" />
            Delivery Timeline
          </h3>
          
          <div className="relative">
            <div className="absolute left-7 top-0 bottom-0 w-1 bg-linear-to-b from-green-500 to-green-600" />
            <div className="space-y-4">
              {deliveryTimeline.map((event, index) => (
                <div key={index} className="flex gap-6 relative">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg relative z-10 ${
                    event.completed
                      ? "bg-linear-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50"
                      : "bg-slate-700 border-2 border-slate-600"
                  }`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-semibold ${event.completed ? "text-green-400" : "text-slate-300"}`}>
                      {event.label}
                    </p>
                    {event.time && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRACKING DATA BY DATE */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FiMapPin className="text-blue-400" />
            Live Tracking Coordinates
          </h3>
          
          {/* DATE SELECTOR - ANY DATE PAST/FUTURE */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="text-slate-400 text-sm font-semibold block mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    console.log(`📅 Date selected: ${newDate}`);
                    setSelectedDate(newDate);
                    if (booking) {
                      console.log(`🔄 Fetching tracking data for date: ${newDate}`);
                      fetchTrackingHistory(booking.id, newDate);
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm hover:border-slate-500 focus:border-blue-500 transition"
                />
                <p className="text-slate-500 text-xs mt-1">📅 Choose any date to view tracking data</p>
              </div>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                  if (booking) fetchTrackingHistory(booking.id, today);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Today
              </button>
            </div>
          </div>

          {trackingHistory?.data?.all_tracking && trackingHistory.data.all_tracking.length > 0 ? (
            <div className="space-y-3">
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-orange-600/20 border border-orange-500/30 rounded p-3">
                  <p className="text-orange-300 text-sm font-semibold">Pickup Points</p>
                  <p className="text-2xl font-bold text-orange-400">{trackingHistory.data?.summary?.pickup_points || 0}</p>
                </div>
                <div className="bg-purple-600/20 border border-purple-500/30 rounded p-3">
                  <p className="text-purple-300 text-sm font-semibold">Wash Points</p>
                  <p className="text-2xl font-bold text-purple-400">{trackingHistory.data?.summary?.wash_points || 0}</p>
                </div>
                <div className="bg-green-600/20 border border-green-500/30 rounded p-3">
                  <p className="text-green-300 text-sm font-semibold">Delivery Points</p>
                  <p className="text-2xl font-bold text-green-400">{trackingHistory.data?.summary?.delivery_points || 0}</p>
                </div>
                <div className="bg-blue-600/20 border border-blue-500/30 rounded p-3">
                  <p className="text-blue-300 text-sm font-semibold">Total Points</p>
                  <p className="text-2xl font-bold text-blue-400">{trackingHistory.data?.summary?.total_points || 0}</p>
                </div>
              </div>

              {/* TRACKING POINTS TABLE */}
              <div className="bg-slate-800/50 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-slate-300">#</th>
                      <th className="px-4 py-2 text-left text-slate-300">Time</th>
                      <th className="px-4 py-2 text-left text-slate-300">Latitude</th>
                      <th className="px-4 py-2 text-left text-slate-300">Longitude</th>
                      <th className="px-4 py-2 text-left text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingHistory.data?.all_tracking.map((point, idx) => (
                      <tr key={idx} className="border-t border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="px-4 py-2 text-slate-300 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-2 text-slate-300 text-xs whitespace-nowrap">
                          {new Date(point.updated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-4 py-2 text-blue-300 font-mono text-xs">{point.latitude.toFixed(6)}</td>
                        <td className="px-4 py-2 text-blue-300 font-mono text-xs">{point.longitude.toFixed(6)}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${
                            point.status === "pickup_in_progress" ? "bg-orange-600/30 text-orange-300" :
                            point.status === "in_wash" ? "bg-purple-600/30 text-purple-300" :
                            point.status === "delivery_in_progress" ? "bg-green-600/30 text-green-300" :
                            "bg-blue-600/30 text-blue-300"
                          }`}>
                            {point.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* COORDINATE RANGE */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-300 text-sm font-semibold mb-2">📍 Coverage Area</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Min Latitude</p>
                    <p className="text-blue-400 font-mono">{Math.min(...trackingHistory.data.all_tracking.map(p => p.latitude)).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Max Latitude</p>
                    <p className="text-blue-400 font-mono">{Math.max(...trackingHistory.data.all_tracking.map(p => p.latitude)).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Min Longitude</p>
                    <p className="text-blue-400 font-mono">{Math.min(...trackingHistory.data.all_tracking.map(p => p.longitude)).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Max Longitude</p>
                    <p className="text-blue-400 font-mono">{Math.max(...trackingHistory.data.all_tracking.map(p => p.longitude)).toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-6 text-center border border-slate-700 space-y-4">
              <FiMapPin className="text-4xl text-slate-600 mx-auto" />
              <div>
                <p className="text-slate-300 text-sm font-semibold">📍 No Tracking Data Found</p>
                <p className="text-slate-400 text-xs mt-2">
                  No tracking coordinates available for {selectedDate}
                </p>
              </div>
              
              {/* HELPFUL DEBUGGING INFO */}
              <div className="bg-slate-900/70 border border-slate-600 rounded p-4 text-left text-xs space-y-2">
                <p className="text-slate-300 font-semibold">💡 Tips:</p>
                <ul className="text-slate-400 space-y-1 list-disc list-inside">
                  <li>Tracking starts when driver begins pickup</li>
                  <li>Try selecting today's date if booking is in progress</li>
                  <li>Check browser console for API debug logs</li>
                  <li>Booking ID: <span className="text-blue-400">{booking?.id}</span></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading location...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <FiAlertCircle className="text-5xl text-red-600 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Booking Not Found</h2>
          <p className="text-slate-600">Unable to load booking details</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      {/* Main Content */}
      <main className="pt-4">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Button */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate("/bookings")}
              className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition"
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

          {/* TIMELINE DISPLAY */}
          <TimelineDisplay />

          {/* TRACKING INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* DISTANCE & ETA */}
            {trackingActive && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <FiNavigation className="text-2xl text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Distance</h3>
                  </div>
                  <p className="text-4xl font-bold text-blue-600">
                    {distance ? distance.toFixed(1) : "---"} km
                  </p>
                  <p className="text-slate-600 text-sm">Current distance to your location</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <FiClock className="text-2xl text-amber-600" />
                    <h3 className="text-lg font-semibold text-slate-900">ETA</h3>
                  </div>
                  <p className="text-4xl font-bold text-amber-600">
                    {eta ? `${eta}` : "---"} min
                  </p>
                  <p className="text-slate-600 text-sm">Estimated arrival time</p>
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
        </div>
      </main>
    </div>
  );
}
