import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin, FiPhone, FiClock, FiLoader } from "react-icons/fi";

export default function CustomerEmergencyWashLiveTracking() {
  const [request, setRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [washerInfo, setWasherInfo] = useState(null);

  const requestId = new URLSearchParams(window.location.search).get("requestId");
  const realtimeChannelRef = useRef(null);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

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

        // Subscribe to real-time updates using Supabase Realtime
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
      console.log("📍 Tracking data:", data);
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

  // Subscribe to real-time tracking updates using Supabase Realtime
  const subscribeToLiveTracking = (trackingId) => {
    // Unsubscribe from previous channel if exists
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }

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

          // If status changed to 'reached', show notification
          if (payload.new.status === "reached") {
            showNotification("Washer has arrived! 🎉");
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);
      });
  };

  const showNotification = (message) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("CarWash+", { body: message });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Request not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Status Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Emergency Wash Service</h1>

          {/* Status Badge */}
          {!tracking ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⏳ <strong>Waiting for Washer</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-1">Your washer will start tracking soon...</p>
            </div>
          ) : tracking.status === "on_the_way" ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                🚗 <strong>Washer is on the way</strong>
              </p>
              {tracking.updated_at && (
                <p className="text-xs text-blue-700 mt-1">
                  Last updated: {new Date(tracking.updated_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : tracking.status === "reached" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                ✅ <strong>Washer has arrived!</strong>
              </p>
              <p className="text-xs text-green-700 mt-1">Reached at {new Date(tracking.reached_at).toLocaleTimeString()}</p>
            </div>
          ) : null}

          {/* Washer Info Card */}
          {washerInfo && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-4 border border-indigo-200">
              <h2 className="font-semibold text-slate-900 mb-3">Your Washer</h2>
              <div className="space-y-2">
                <p className="text-sm text-slate-700">
                  <strong className="text-indigo-600">{washerInfo.name}</strong>
                </p>
                <p className="text-sm text-slate-600">
                  <FiPhone className="inline mr-2 text-indigo-600" />
                  {washerInfo.phone}
                </p>
                {washerInfo.taluko && (
                  <p className="text-sm text-slate-600">
                    <FiMapPin className="inline mr-2 text-indigo-600" />
                    {washerInfo.taluko}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Car Details */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-slate-900 mb-2">Your Car</h3>
            <p className="text-sm text-slate-700 mb-1">
              <strong>{request.car_model}</strong> ({request.car_plate})
            </p>
            {request.car_color && (
              <p className="text-sm text-slate-600">Color: {request.car_color}</p>
            )}
          </div>

          {/* Location Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Service Location</h3>
            <p className="text-sm text-slate-700 flex items-start gap-2">
              <FiMapPin className="text-slate-600 mt-0.5 shrink-0" />
              {request.address}
            </p>
          </div>
        </div>

        {/* Live Tracking Data */}
        {tracking && tracking.status === "on_the_way" && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-4">📍 Washer Location</h2>

            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Coordinates</p>
                <p className="text-sm font-mono text-slate-900">
                  {tracking.latitude.toFixed(6)}, {tracking.longitude.toFixed(6)}
                </p>
              </div>

              {tracking.accuracy && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Accuracy</p>
                  <p className="text-sm text-slate-900">{tracking.accuracy.toFixed(1)}m</p>
                </div>
              )}

              {tracking.speed !== null && tracking.speed !== undefined && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Current Speed</p>
                  <p className="text-sm text-slate-900">{(tracking.speed * 3.6).toFixed(1)} km/h</p>
                </div>
              )}

              {tracking.updated_at && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Last Update</p>
                  <p className="text-sm text-slate-900">
                    {new Date(tracking.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        <div
          className="bg-white rounded-xl shadow-lg p-6 h-96 flex items-center justify-center border-2 border-dashed border-blue-300"
        >
          <div className="text-center text-slate-500">
            <FiMapPin className="text-5xl mx-auto mb-2 text-blue-600" />
            <p className="text-lg font-semibold">Live Map</p>
            <p className="text-sm text-slate-400 mt-2">
              {tracking?.status === "on_the_way"
                ? "Washer location will appear here (updated in real-time)"
                : "Map will display when washer starts tracking"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
