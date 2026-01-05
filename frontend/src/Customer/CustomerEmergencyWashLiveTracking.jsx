import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiTruck,
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
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function CustomerEmergencyWashLiveTracking() {
  const [request, setRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [washerInfo, setWasherInfo] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fallbackPolling, setFallbackPolling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // For updating time elapsed every second

  const requestId = new URLSearchParams(window.location.search).get("requestId");
  const realtimeChannelRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // ============ LIFECYCLE HOOKS ============

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (tracking?.tracking_started_at && tracking?.status === "on_the_way") {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [tracking?.tracking_started_at, tracking?.status]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ============ HELPER FUNCTIONS ============

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

  const showNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("CarWash+", { body: message, icon: "🚗" });
    }
  };

  const calculateDuration = (startTime, endTime) => {
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins === 0) {
      return `${diffSecs}s`;
    } else if (diffMins < 60) {
      return `${diffMins}m ${diffSecs}s`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // ============ FETCH & SUBSCRIBE ============

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch emergency wash request
      const { data: requestData, error: requestError } = await supabase
        .from("emergency_wash_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;

      setRequest(requestData);
      console.log("📋 Emergency wash request:", requestData);

      // If tracking exists, fetch it
      if (requestData.tracking_id) {
        fetchTracking(requestData.tracking_id);

        // Subscribe to real-time updates
        subscribeToLiveTracking(requestData.tracking_id);

        // Fetch washer info
        if (requestData.assigned_to) {
          fetchWasherInfo(requestData.assigned_to);
        }
      } else {
        console.log("⏳ Waiting for washer to start tracking...");
      }
    } catch (err) {
      console.error("❌ Error fetching request:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
      lastUpdateRef.current = new Date(data.updated_at);
      console.log("📍 Tracking data:", data);

      // Calculate distance if we have customer location
      if (request?.latitude && request?.longitude && data.latitude && data.longitude) {
        const dist = calculateDistance(
          parseFloat(request.latitude),
          parseFloat(request.longitude),
          data.latitude,
          data.longitude
        );
        setDistance(dist);
      }
    } catch (err) {
      console.error("❌ Error fetching tracking:", err);
    }
  };

  const fetchWasherInfo = async (washerId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, phone, city, taluko")
        .eq("id", washerId)
        .single();

      if (error) throw error;

      setWasherInfo(data);
      console.log("👤 Washer info:", data);
    } catch (err) {
      console.error("❌ Error fetching washer info:", err);
    }
  };

  // Subscribe to real-time tracking updates
  const subscribeToLiveTracking = (trackingId) => {
    // Unsubscribe from previous channel if exists
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }

    console.log("📡 Subscribing to live tracking updates...");

    // Subscribe to updates on live_tracking table
    realtimeChannelRef.current = supabase
      .channel(`tracking:${trackingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_tracking",
          filter: `id=eq.${trackingId}`,
        },
        (payload) => {
          console.log("🔄 Real-time update received:", payload.new);
          setTracking(payload.new);
          lastUpdateRef.current = new Date(payload.new.updated_at);

          // Calculate distance
          if (request?.latitude && request?.longitude && payload.new.latitude && payload.new.longitude) {
            const dist = calculateDistance(
              parseFloat(request.latitude),
              parseFloat(request.longitude),
              payload.new.latitude,
              payload.new.longitude
            );
            setDistance(dist);
          }

          // If status changed to 'reached', show notification
          if (payload.new.status === "reached") {
            showNotification("Washer has arrived! 🎉");
            // Stop polling if it was active
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setFallbackPolling(false);
            }
          }

          // Turn off fallback polling if realtime is working
          setFallbackPolling(false);
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);

        // If realtime fails, fall back to polling
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn("⚠️ Realtime connection failed, switching to polling...");
          setFallbackPolling(true);
          startPollingTracking(trackingId);
        }
      });
  };

  // Fallback polling if Realtime fails
  const startPollingTracking = (trackingId) => {
    // Stop existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("live_tracking")
          .select("*")
          .eq("id", trackingId)
          .single();

        if (error) throw error;

        setTracking(data);
        console.log("📊 Polling update:", data);

        // Calculate distance
        if (request?.latitude && request?.longitude && data.latitude && data.longitude) {
          const dist = calculateDistance(
            parseFloat(request.latitude),
            parseFloat(request.longitude),
            data.latitude,
            data.longitude
          );
          setDistance(dist);
        }
      } catch (err) {
        console.error("❌ Polling error:", err);
      }
    }, 3000);
  };

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiAlertCircle className="text-4xl text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold">Request not found</p>
        </div>
      </div>
    );
  }

  const mapCenter =
    request?.latitude && request?.longitude
      ? [parseFloat(request.latitude), parseFloat(request.longitude)]
      : tracking?.latitude && tracking?.longitude
      ? [tracking.latitude, tracking.longitude]
      : [20, 73]; // Default to India

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">🚗 Track Your Washer</h1>
          <p className="text-slate-600 mt-1">
            {!tracking
              ? "⏳ Waiting for washer to start tracking..."
              : tracking.status === "on_the_way"
              ? "🟢 Washer is on the way to you"
              : "✅ Washer has arrived"}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Status Badge */}
            {!tracking ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-lg">
                <p className="flex items-center gap-2 text-sm font-bold text-yellow-900">
                  <FiClock className="text-lg" />
                  Waiting for Washer
                </p>
                <p className="text-xs text-yellow-700 mt-2">Your washer will start tracking soon...</p>
              </div>
            ) : tracking.status === "on_the_way" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-lg">
                <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
                  <FiTruck className="text-lg animate-pulse" />
                  Washer is on the way
                </p>
                {tracking.updated_at && (
                  <p className="text-xs text-blue-700 mt-2">
                    Last updated: {new Date(tracking.updated_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : tracking.status === "reached" ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-lg">
                <p className="flex items-center gap-2 text-sm font-bold text-green-900">
                  <FiCheckCircle className="text-lg" />
                  Washer has arrived!
                </p>
                {tracking.reached_at && (
                  <p className="text-xs text-green-700 mt-2">
                    Reached at {new Date(tracking.reached_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ) : null}

            {/* Washer Info Card */}
            {washerInfo && (
              <div className="bg-white rounded-xl shadow-lg p-5 border border-indigo-100">
                <h2 className="font-bold text-slate-900 mb-4 text-lg">👤 Your Washer</h2>
                <div className="space-y-3">
                  <p className="text-slate-700">
                    <span className="font-bold text-indigo-600">{washerInfo.name}</span>
                  </p>
                  <p className="text-slate-600 text-sm flex items-center gap-2">
                    <FiPhone className="text-indigo-600" />
                    {washerInfo.phone}
                  </p>
                  {washerInfo.taluko && (
                    <p className="text-slate-600 text-sm flex items-start gap-2">
                      <FiMapPin className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      {washerInfo.taluko}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Car Details */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="font-bold text-slate-900 mb-3">🚙 Your Car</h3>
              <p className="text-slate-700 font-semibold">
                {request.car_model} <span className="text-slate-600 font-normal">({request.car_plate})</span>
              </p>
              {request.car_color && (
                <p className="text-sm text-slate-600 mt-2">Color: {request.car_color}</p>
              )}
            </div>

            {/* Distance Card */}
            {distance !== null && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-5 border border-purple-200">
                <h2 className="font-bold text-slate-900 mb-2">📍 Distance</h2>
                <p className="text-3xl font-bold text-purple-600">
                  {distance < 0.1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {distance < 0.05 ? "✅ Washer is very close!" : distance < 0.5 ? "⏱️ Almost here..." : "🛣️ On the way"}
                </p>
              </div>
            )}

            {/* Location Info */}
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h3 className="font-bold text-slate-900 mb-3">📍 Service Location</h3>
              <p className="text-slate-700 text-sm flex items-start gap-2">
                <FiMapPin className="text-slate-600 mt-0.5 flex-shrink-0" />
                {request.address}
              </p>
            </div>

            {/* Fallback Polling Indicator */}
            {fallbackPolling && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="text-xs text-orange-700">
                  📡 <strong>Using polling mode</strong> - Real-time unavailable
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Map & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map Container */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {mapCenter && mapCenter[0] !== 20 ? (
                <MapContainer center={mapCenter} zoom={15} style={{ height: "500px", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {/* Customer Location (Fixed Blue Pin) */}
                  {request?.latitude && request?.longitude && (
                    <Marker
                      position={[parseFloat(request.latitude), parseFloat(request.longitude)]}
                      icon={customerMarkerIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-bold">📍 Your Location</p>
                          <p className="text-xs text-slate-600">{request.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Washer Location (Moving Red Marker) */}
                  {tracking?.latitude && tracking?.longitude && (
                    <>
                      <Marker position={[tracking.latitude, tracking.longitude]} icon={washerMarkerIcon}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">🚗 Washer Location</p>
                            <p className="text-xs text-slate-600">
                              {tracking.status === "reached" ? "✅ Arrived" : "🟢 On the way"}
                            </p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Accuracy Circle */}
                      {tracking.accuracy && (
                        <CircleMarker
                          center={[tracking.latitude, tracking.longitude]}
                          radius={tracking.accuracy / 1000}
                          fillColor="#ef4444"
                          color="#dc2626"
                          weight={2}
                          opacity={0.3}
                          fillOpacity={0.1}
                        />
                      )}
                    </>
                  )}
                </MapContainer>
              ) : (
                <div className="h-96 flex items-center justify-center bg-slate-100">
                  <p className="text-slate-500">Loading map...</p>
                </div>
              )}
            </div>

            {/* Timeline Display */}
            {tracking && (
              <div className="bg-white rounded-xl shadow-lg p-5">
                <h2 className="font-bold text-slate-900 mb-6">⏱️ Journey Timeline</h2>

                <div className="space-y-6">
                  {/* Tracking Started */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                      <div className="w-1 h-16 bg-blue-200 my-2"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-slate-900">🚗 Washer Started Tracking</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {tracking.tracking_started_at
                          ? new Date(tracking.tracking_started_at).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "Just started"}
                      </p>
                      {tracking.tracking_started_at && (
                        <p className="text-xs text-blue-600 mt-2">
                          ✅ On the way to your location
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Current Status - On the Way */}
                  {tracking.status === "on_the_way" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg animate-pulse">
                          2
                        </div>
                        <div className="w-1 h-16 bg-slate-300 my-2"></div>
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-slate-900">📍 Currently Traveling</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Started: {new Date(tracking.tracking_started_at || tracking.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                        {distance !== null && (
                          <p className="text-xs text-amber-600 mt-2 font-semibold">
                            📏 {distance < 0.1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(2)}km away`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reached Destination */}
                  {tracking.status === "reached" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          2
                        </div>
                        <div className="w-1 h-16 bg-green-200 my-2"></div>
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-slate-900">✅ Washer Reached</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {tracking.reached_at
                            ? new Date(tracking.reached_at).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "Reached location"}
                        </p>
                        {tracking.tracking_started_at && tracking.reached_at && (
                          <p className="text-xs text-green-600 mt-2">
                            ⏱️ Journey time: {calculateDuration(
                              new Date(tracking.tracking_started_at),
                              new Date(tracking.reached_at)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Journey Summary */}
                  {tracking && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <p className="text-xs font-semibold text-slate-600 mb-3">📊 JOURNEY SUMMARY</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-600 font-semibold">Status</p>
                          <p className="text-slate-900 text-lg font-bold">
                            {tracking.status === "on_the_way" ? "🟢 On the Way" : tracking.status === "reached" ? "✅ Arrived" : "⏳ Pending"}
                          </p>
                        </div>
                        {distance !== null && (
                          <div>
                            <p className="text-slate-600 font-semibold">Distance</p>
                            <p className="text-slate-900 text-lg font-bold">
                              {distance < 0.1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                            </p>
                          </div>
                        )}
                        {tracking.tracking_started_at && (
                          <div>
                            <p className="text-slate-600 font-semibold">Time Elapsed</p>
                            <p className="text-slate-900 text-lg font-bold">
                              {calculateDuration(new Date(tracking.tracking_started_at), new Date())}
                            </p>
                          </div>
                        )}
                        {tracking.speed !== null && tracking.speed !== undefined && (
                          <div>
                            <p className="text-slate-600 font-semibold">Current Speed</p>
                            <p className="text-slate-900 text-lg font-bold">
                              {(tracking.speed * 3.6).toFixed(1)} km/h
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Tracking Data */}
            {tracking && tracking.status === "on_the_way" && (
              <div className="bg-white rounded-xl shadow-lg p-5">
                <h2 className="font-bold text-slate-900 mb-4">📊 Washer Details</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Latitude</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">{tracking.latitude.toFixed(6)}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-semibold">Longitude</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">{tracking.longitude.toFixed(6)}</p>
                  </div>

                  {tracking.accuracy && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 font-semibold">Accuracy</p>
                      <p className="text-sm text-slate-900 mt-1">±{tracking.accuracy.toFixed(1)}m</p>
                    </div>
                  )}

                  {tracking.speed !== null && tracking.speed !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 font-semibold">Speed</p>
                      <p className="text-sm text-slate-900 mt-1">{(tracking.speed * 3.6).toFixed(1)} km/h</p>
                    </div>
                  )}

                  {distance !== null && (
                    <div className="bg-green-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-slate-600 font-semibold">Distance to You</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {distance < 0.1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`}
                      </p>
                    </div>
                  )}

                  {tracking.updated_at && (
                    <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-slate-600 font-semibold">Last Update</p>
                      <p className="text-sm text-slate-900 mt-1">{new Date(tracking.updated_at).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
