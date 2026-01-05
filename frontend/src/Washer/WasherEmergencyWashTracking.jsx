import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin, FiPhone, FiNavigation, FiCheck, FiX, FiLoader } from "react-icons/fi";

export default function WasherEmergencyWashTracking() {
  const [request, setRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startingTracking, setStartingTracking] = useState(false);
  const [reachingDestination, setReachingDestination] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Get request ID from URL or props
  const requestId = new URLSearchParams(window.location.search).get('requestId');

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        console.log("🔍 Washer ID:", data.user.id);
      }
    };
    getCurrentUser();
  }, []);

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

      // If there's existing tracking, fetch it
      if (data.tracking_id) {
        fetchTracking(data.tracking_id);
      }
    } catch (err) {
      console.error("❌ Error fetching request:", err);
      setError(err.message);
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
    } catch (err) {
      console.error("❌ Error fetching tracking:", err);
    }
  };

  // Get current location using browser's geolocation API
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, heading, speed } = position.coords;
          resolve({ latitude, longitude, accuracy, heading, speed });
        },
        (err) => {
          console.error("❌ Geolocation error:", err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // Start live tracking
  const handleStartTracking = async () => {
    try {
      setStartingTracking(true);
      setError(null);

      // Get current location
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      console.log("📍 Current location:", location);

      // Call backend to start tracking
      const response = await fetch("/api/live-tracking/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customerId: request.user_id,
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
      setTracking({ id: data.trackingId, status: "on_the_way" });
      setIsTracking(true);

      // Start watching location continuously
      startLocationTracking(data.trackingId);
    } catch (err) {
      console.error("❌ Error starting tracking:", err);
      setError(err.message);
    } finally {
      setStartingTracking(false);
    }
  };

  // Watch location and send updates
  const startLocationTracking = (trackingId) => {
    // Watch position in real-time
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        setCurrentLocation({ latitude, longitude, accuracy, heading, speed });

        // Send location update to backend every 5 seconds
        if (!locationIntervalRef.current) {
          locationIntervalRef.current = setInterval(async () => {
            try {
              const response = await fetch("/api/live-tracking/update-location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  trackingId,
                  latitude,
                  longitude,
                  accuracy,
                  heading,
                  speed,
                }),
              });

              if (!response.ok) {
                console.error("❌ Failed to update location");
              }
            } catch (err) {
              console.error("❌ Error sending location:", err);
            }
          }, 5000);
        }
      },
      (err) => {
        console.error("❌ Watch position error:", err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    console.log("👀 Started watching location, Watch ID:", watchIdRef.current);
  };

  // Washer reached destination
  const handleReached = async () => {
    try {
      setReachingDestination(true);
      setError(null);

      const response = await fetch("/api/live-tracking/reached", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: tracking.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark as reached");
      }

      console.log("✅ Marked as reached:", data);

      // Stop location tracking
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      setIsTracking(false);
      setTracking({ ...tracking, status: "reached" });
    } catch (err) {
      console.error("❌ Error marking as reached:", err);
      setError(err.message);
    } finally {
      setReachingDestination(false);
    }
  };

  // Stop tracking (if user cancels)
  const handleStopTracking = async () => {
    try {
      const response = await fetch("/api/live-tracking/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: tracking.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to stop tracking");
      }

      // Stop location watching
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      setIsTracking(false);
      setTracking(null);
      console.log("🛑 Tracking stopped");
    } catch (err) {
      console.error("❌ Error stopping tracking:", err);
      setError(err.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  if (!request) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Request Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Emergency Wash Request</h1>

          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-slate-900 mb-3">Customer Details</h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <FiMapPin className="inline mr-2 text-blue-600" />
                {request.address}
              </p>
              <p className="text-slate-600">
                <FiPhone className="inline mr-2 text-blue-600" />
                {request.customer_phone || "N/A"}
              </p>
              <p className="text-slate-600">
                City: <span className="font-semibold">{request.customer_city}</span>
              </p>
            </div>
          </div>

          {/* Car Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-slate-900 mb-2">Car Details</h3>
            <p className="text-sm text-slate-700">
              {request.car_model} ({request.car_plate})
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          {/* Status & Actions */}
          {!isTracking ? (
            <button
              onClick={handleStartTracking}
              disabled={startingTracking}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {startingTracking ? (
                <>
                  <FiLoader className="animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <FiNavigation />
                  I am starting to reach you
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              {/* Current Location Info */}
              {currentLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-700 mb-2">📍 Live Tracking Active</p>
                  <p className="text-xs text-green-600">
                    Lat: {currentLocation.latitude.toFixed(6)} | Lon: {currentLocation.longitude.toFixed(6)}
                  </p>
                  {currentLocation.speed !== null && (
                    <p className="text-xs text-green-600">
                      Speed: {currentLocation.speed.toFixed(2)} m/s | Accuracy: {currentLocation.accuracy.toFixed(1)}m
                    </p>
                  )}
                </div>
              )}

              {/* Reached Button */}
              <button
                onClick={handleReached}
                disabled={reachingDestination}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {reachingDestination ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    I have reached
                  </>
                )}
              </button>

              {/* Cancel Tracking Button */}
              <button
                onClick={handleStopTracking}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiX />
                Stop Tracking
              </button>
            </div>
          )}
        </div>

        {/* Map Placeholder */}
        <div
          ref={mapRef}
          className="bg-white rounded-xl shadow-lg p-6 h-80 flex items-center justify-center border-2 border-dashed border-blue-300"
        >
          <div className="text-center text-slate-500">
            <FiMapPin className="text-4xl mx-auto mb-2 text-blue-600" />
            <p className="text-sm">Map will be integrated here</p>
            <p className="text-xs text-slate-400">
              Show: Customer location (fixed pin) & Washer location (moving marker)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
