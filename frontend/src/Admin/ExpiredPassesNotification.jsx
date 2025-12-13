import React, { useEffect, useState } from "react";
import { FiAlertCircle, FiClock, FiX } from "react-icons/fi";

const ExpiredPassesNotification = () => {
  const [expiredPasses, expireingPasses] = useState([]);
  const [expiringPasses, setExpiringPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("expired"); // "expired" or "expiring"

  useEffect(() => {
    fetchPassData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPassData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPassData = async () => {
    setLoading(true);
    try {
      // Fetch expired passes
      const expiredRes = await fetch(
        "http://localhost:5000/pass-expiration/expired-passes"
      );
      const expiredData = await expiredRes.json();

      // Fetch expiring soon passes
      const expiringRes = await fetch(
        "http://localhost:5000/pass-expiration/expiring-soon"
      );
      const expiringData = await expiringRes.json();

      if (expiredData.success) {
        expireingPasses(expiredData.expiredPasses || []);
      }
      if (expiringData.success) {
        setExpiringPasses(expiringData.expiringPasses || []);
      }
    } catch (error) {
      console.error("Error fetching pass data:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotifications = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/pass-expiration/check-expired-passes",
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        alert(
          `✅ Notifications sent! ${data.notificationsSent} notifications created.`
        );
        fetchPassData();
      }
    } catch (error) {
      console.error("Error triggering notifications:", error);
      alert("❌ Failed to send notifications");
    }
  };

  const displayData = activeTab === "expired" ? expiredPasses : expiringPasses;
  const title = activeTab === "expired" ? "Expired Passes" : "Expiring Soon (7 days)";
  const icon = activeTab === "expired" ? "🔴" : "⏱️";

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-linear-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertCircle size={32} />
            <div>
              <h2 className="text-2xl font-bold">Pass Expiration Management</h2>
              <p className="text-red-100 text-sm">
                Monitor and manage customer monthly pass expirations
              </p>
            </div>
          </div>
          <button
            onClick={triggerNotifications}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
          >
            📢 Send Notifications
          </button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("expired")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "expired"
              ? "bg-red-600 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          <FiAlertCircle size={18} />
          Expired ({expiredPasses.length})
        </button>
        <button
          onClick={() => setActiveTab("expiring")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === "expiring"
              ? "bg-orange-600 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          <FiClock size={18} />
          Expiring Soon ({expiringPasses.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading pass data...</p>
        </div>
      ) : displayData.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
          <p className="text-slate-600 text-lg">
            {icon} No {title.toLowerCase()} found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayData.map((pass) => {
            const expiryDate = new Date(pass.valid_till);
            const daysOverdue = Math.floor(
              (new Date() - expiryDate) / (1000 * 60 * 60 * 24)
            );
            const daysUntilExpiry = Math.ceil(
              (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={pass.id}
                className={`rounded-lg p-5 border-l-4 ${
                  activeTab === "expired"
                    ? "bg-red-50 border-l-red-600 border border-red-200"
                    : "bg-orange-50 border-l-orange-600 border border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Customer Info */}
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-800">
                        👤 {pass.profiles?.full_name || "Unknown Customer"}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {pass.profiles?.email || "N/A"}
                      </p>
                    </div>

                    {/* Car Info */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-700">
                        🚗 {pass.cars?.brand} {pass.cars?.model}
                      </p>
                      <p className="text-sm text-slate-600">
                        Plate: <span className="font-mono">{pass.cars?.number_plate}</span>
                      </p>
                    </div>

                    {/* Pass Details */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-slate-600 font-semibold">
                          Total Washes
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {pass.total_washes}
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-slate-600 font-semibold">
                          Remaining
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {pass.remaining_washes}
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-xs text-slate-600 font-semibold">
                          {activeTab === "expired" ? "Expired" : "Expires In"}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            activeTab === "expired"
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {activeTab === "expired"
                            ? `${daysOverdue} days ago`
                            : `${daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">📅 Expiry Date:</span>{" "}
                      {expiryDate.toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      /* Handle contact/action */
                    }}
                    className={`ml-4 px-4 py-2 rounded-lg font-semibold text-white transition ${
                      activeTab === "expired"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {activeTab === "expired" ? "Contact" : "Remind"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpiredPassesNotification;
