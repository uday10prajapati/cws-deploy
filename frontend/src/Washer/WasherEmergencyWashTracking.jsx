import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiPhone,
  FiNavigation,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const customerMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const washerMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function WasherEmergencyWashTracking() {
  const [request, setRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startingTracking, setStartingTracking] = useState(false);
  const [reachingDestination, setReachingDestination] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [locationUpdating, setLocationUpdating] = useState(false);

  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);
  const requestId = new URLSearchParams(window.location.search).get("requestId");

  // ============ LIFECYCLE HOOKS ============

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      setUser(authData?.user || null);
      console.log("🔍 Washer ID:", authData?.user?.id);
    };
    getCurrentUser();
  }, []);

  // Load request details
  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  // Handle visibility change (background mode)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("⚠️ App in background - tracking will continue");
      } else {
        console.log("✅ App in foreground - resuming full tracking");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ============ FETCH DATA ============

  const fetchRequestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_wash_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error) throw error;

      setRequest(data);
      console.log("📋 Emergency wash request:", data);

      // Extract customer location from request
      if (data.latitude && data.longitude) {
        setCustomerLocation({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        });
        console.log("📍 Customer location:", {
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }

      // If tracking already exists, fetch it
      if (data.tracking_id) {
        fetchTracking(data.tracking_id);
      }
    } catch (err) {
      console.error("❌ Error fetching request:", err);
      setError("Failed to load request. Please try again.");
    }
  };

  const fetchTracking = async (trackingId) => {
    try {
      const { data, error } = await supabase
        .from("live_tracking")
        .select("*")
        .eq("id", trackingId)
        .single();

      if (error) throw error;

      setTracking(data);
      setIsTracking(data.status === "on_the_way");
      console.log("📍 Tracking data:", data);

      // If tracking is ongoing, start watching location
      if (data.status === "on_the_way") {
        startLocationTracking(trackingId);
      }
    } catch (err) {
      console.error("❌ Error fetching tracking:", err);
    }
  };

  // ============ LOCATION HANDLING ============

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, heading, speed } = position.coords;
          resolve({ latitude, longitude, accuracy, heading, speed });
        },
        (err) => {
          console.error("❌ Geolocation error:", err);
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("📍 Location permission denied. Please enable it in settings."));
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            reject(new Error("📍 Your location is currently unavailable."));
          } else {
            reject(new Error("📍 Unable to get your location. Please try again."));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // ============ TRACKING FUNCTIONS ============

  const handleStartTracking = async () => {
    try {
      setStartingTracking(true);
      setError(null);

      // Get current location with HIGH accuracy
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      lastLocationRef.current = location;

      console.log("📍 Current location:", location);

      // Call backend to start tracking
      const response = await fetch("/api/live-tracking/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          customer_id: request.user_id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start tracking");
      }

      console.log("✅ Tracking started:", data);
      setTracking({ id: data.tracking_id, status: "on_the_way" });
      setIsTracking(true);

      // Start watching location
      startLocationTracking(data.tracking_id);
    } catch (err) {
      console.error("❌ Error starting tracking:", err);
      setError(err.message);
    } finally {
      setStartingTracking(false);
    }
  };

  const startLocationTracking = (trackingId) => {
    console.log("👀 Starting location watch...");

    // Watch position in real-time
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const newLocation = { latitude, longitude, accuracy, heading, speed };

        setCurrentLocation(newLocation);
        lastLocationRef.current = newLocation;

        // Calculate distance to customer
        if (customerLocation) {
          const dist = calculateDistance(latitude, longitude, customerLocation.latitude, customerLocation.longitude);
          setDistance(dist);

          // Auto-mark as reached if within 50 meters
          if (dist < 0.05 && isTracking) {
            console.log("✅ Within 50m of customer - you can mark as reached");
          }
        }

        // Reset inactivity timeout
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }

        // Set timeout to stop tracking after 30 seconds of inactivity
        inactivityTimeoutRef.current = setTimeout(() => {
          console.warn("⚠️ No location update for 30 seconds - stopping tracking for safety");
          handleStopTracking();
        }, 30000);

        // Reset location update interval
        if (!locationIntervalRef.current) {
          locationIntervalRef.current = setInterval(() => {
            updateLocationToBackend(trackingId, lastLocationRef.current);
          }, 5000); // Send every 5 seconds
        }
      },
      (err) => {
        console.error("❌ Watch position error:", err);
        setError("Cannot access your location. Is it enabled?");
        handleStopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    console.log("👀 Location watch started, Watch ID:", watchIdRef.current);
  };

  const updateLocationToBackend = async (trackingId, location) => {
    if (!location) return;

    try {
      setLocationUpdating(true);
      const response = await fetch("/api/live-tracking/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: trackingId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("❌ Failed to update location:", data.error);
      }
    } catch (err) {
      console.error("❌ Error sending location:", err);
      // Continue trying despite error
    } finally {
      setLocationUpdating(false);
    }
  };

  const handleReached = async () => {
    try {
      setReachingDestination(true);
      setError(null);

      if (!tracking?.id) {
        throw new Error("Tracking ID not found");
      }

      const response = await fetch("/api/live-tracking/reached", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_id: tracking.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark as reached");
      }

      console.log("✅ Marked as reached:", data);

      // Stop location tracking
      stopLocationTracking();

      setIsTracking(false);
      setTracking({ ...tracking, status: "reached" });
      setError(null);
    } catch (err) {
      console.error("❌ Error marking as reached:", err);
      setError(err.message);
    } finally {
      setReachingDestination(false);
    }
  };

  const handleStopTracking = async () => {
    try {
      if (tracking?.id) {
        await fetch("/api/live-tracking/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracking_id: tracking.id }),
        });
      }

      stopLocationTracking();
      setIsTracking(false);
      setTracking(null);
      setCurrentLocation(null);
      console.log("🛑 Tracking stopped");
    } catch (err) {
      console.error("❌ Error stopping tracking:", err);
      setError(err.message);
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  // ============ RENDER ============

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">🚗 Emergency Wash Request</h1>
          <p className="text-slate-600 mt-1">
            {isTracking ? "🟢 Tracking Active" : "⚪ Ready to Start"}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h2 className="font-bold text-slate-900 mb-4 text-lg">👤 Customer Details</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">ADDRESS</p>
                    <p className="text-slate-900 font-medium">{request.address || "N/A"}</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-slate-500 text-xs">CITY</p>
                  <p className="text-slate-900 font-medium">{request.customer_city || "N/A"}</p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-slate-500 text-xs">PHONE</p>
                  <p className="text-slate-900 font-medium flex items-center gap-2">
                    <FiPhone className="text-blue-600" />
                    {request.customer_phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Car Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h2 className="font-bold text-slate-900 mb-4">🚙 Car Details</h2>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-900">{request.car_model}</span>
                </p>
                <p className="text-slate-600">
                  Plate: <span className="font-semibold">{request.car_plate}</span>
                </p>
              </div>
            </div>

            {/* Distance Card */}
            {distance !== null && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-5 border border-green-200">
                <h2 className="font-bold text-slate-900 mb-2">📍 Distance</h2>
                <p className="text-3xl font-bold text-green-600">
                  {distance < 0.1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {distance < 0.05 ? "✅ You're very close!" : ""}
                </p>
              </div>
            )}

            {/* Status Card */}
            {isTracking && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-5 border border-green-200">
                <h2 className="font-bold text-slate-900 mb-2">📍 Live Tracking</h2>
                {currentLocation && (
                  <>
                    <p className="text-xs text-slate-600 mb-2">Lat: {currentLocation.latitude.toFixed(6)}</p>
                    <p className="text-xs text-slate-600 mb-2">Lon: {currentLocation.longitude.toFixed(6)}</p>
                    {currentLocation.speed !== null && (
                      <p className="text-xs text-slate-600">Speed: {currentLocation.speed.toFixed(1)} m/s</p>
                    )}
                    {currentLocation.accuracy && (
                      <p className="text-xs text-slate-600">Accuracy: ±{currentLocation.accuracy.toFixed(1)}m</p>
                    )}
                  </>
                )}
                {locationUpdating && (
                  <p className="text-xs text-green-600 font-semibold mt-2">📤 Sending location...</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map Container */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {customerLocation ? (
                <MapContainer
                  center={[customerLocation.latitude, customerLocation.longitude]}
                  zoom={15}
                  style={{ height: "400px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {/* Customer Location (Fixed Blue Pin) */}
                  <Marker position={[customerLocation.latitude, customerLocation.longitude]} icon={customerMarkerIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">📍 Customer Location</p>
                        <p className="text-xs text-slate-600">{request.address}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Washer Location (Moving Green Marker) */}
                  {currentLocation && (
                    <>
                      <Marker
                        position={[currentLocation.latitude, currentLocation.longitude]}
                        icon={washerMarkerIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">🟢 Your Location</p>
                            <p className="text-xs text-slate-600">
                              Accuracy: ±{currentLocation.accuracy?.toFixed(1) || "?"}m
                            </p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Accuracy Circle */}
                      <CircleMarker
                        center={[currentLocation.latitude, currentLocation.longitude]}
                        radius={currentLocation.accuracy ? currentLocation.accuracy / 1000 : 0.01}
                        fillColor="#22c55e"
                        color="#16a34a"
                        weight={2}
                        opacity={0.3}
                        fillOpacity={0.1}
                      />
                    </>
                  )}
                </MapContainer>
              ) : (
                <div className="h-96 flex items-center justify-center bg-slate-100">
                  <p className="text-slate-500">Loading map...</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                disabled={startingTracking}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
              >
                {startingTracking ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <FiNavigation />
                    <span>I am starting to reach you</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleReached}
                  disabled={reachingDestination}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  {reachingDestination ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>I have reached</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleStopTracking}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                >
                  <FiX />
                  <span>Stop Tracking</span>
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-blue-700">✅ Live tracking active - sending location every 5 seconds</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
