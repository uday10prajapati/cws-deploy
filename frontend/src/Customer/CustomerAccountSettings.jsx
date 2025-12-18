import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarNew from "../components/NavbarNew";
import { FiLogOut, FiAlertCircle, FiCheck, FiToggleLeft, FiRefreshCw, FiX } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function CustomerAccountSettings() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(null);
  const [accountStatus, setAccountStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reactivationReason, setReactivationReason] = useState("");
  const [user, setUser] = useState(null);

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          setCustomerId(auth.user.id);
          setUser(auth.user);
          
          // Get account status from profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("account_status")
            .eq("id", auth.user.id)
            .single();

          if (profile) {
            setAccountStatus(profile.account_status || "active");
          }
        }
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    
    await supabase.auth.signOut().catch(err => console.error("Supabase signout error:", err));
    navigate("/login");
  };

  const handleRequestDeactivation = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/request-deactivate`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("deactivate_requested");
        setSuccessMessage(
          "✅ Your deactivation request has been submitted. Admin will review it soon."
        );
        setShowDeactivateModal(false);
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to request deactivation");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeactivateRequest = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/cancel-deactivate`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("active");
        setSuccessMessage("✅ Deactivation request cancelled.");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to cancel request");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}/request-reactivate`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reactivationReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setAccountStatus("reactivate_requested");
        setSuccessMessage(
          "✅ Your reactivation request has been submitted. Admin will review it soon."
        );
        setShowReactivateModal(false);
        setReactivationReason("");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(data.error || "Failed to request reactivation");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <FiLogOut className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      {/* Main Content */}
      <main className="pt-4">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <FiToggleLeft className="w-8 h-8 text-blue-600" />
              Account Settings
            </h1>
          <p className="text-gray-300">Manage your account status and privacy</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-3 animate-in">
            <FiCheck className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
            <FiAlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Account Status Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiToggleLeft className="w-6 h-6 text-blue-600" />
            Account Status
          </h2>

          <div className="space-y-4">
            {/* Current Status */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-600 text-sm mb-3 font-medium">Current Status</p>
              <div className="flex items-center gap-3">
                {accountStatus === "active" && (
                  <>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-700">✅ Account Active</p>
                      <p className="text-sm text-emerald-600">You can access all features</p>
                    </div>
                  </>
                )}
                {accountStatus === "inactive" && (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-lg font-semibold text-red-700">❌ Account Inactive</p>
                      <p className="text-sm text-red-600">Your account has been deactivated</p>
                    </div>
                  </>
                )}
                {accountStatus === "deactivate_requested" && (
                  <>
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-amber-700">⏳ Deactivation Pending</p>
                      <p className="text-sm text-amber-600">Awaiting admin approval</p>
                    </div>
                  </>
                )}
                {accountStatus === "reactivate_requested" && (
                  <>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-blue-700">🔄 Reactivation Pending</p>
                      <p className="text-sm text-blue-600">Awaiting admin approval</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Information */}
            {accountStatus === "active" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-700 text-sm">
                  Your account is active and fully functional. You can make bookings, manage your profile, and access all platform features.
                </p>
              </div>
            )}

            {accountStatus === "inactive" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-red-800 text-sm font-medium">
                  Your account has been deactivated.
                </p>
                <p className="text-red-700 text-sm">
                  You cannot make new bookings or access your account. Send a reactivation request to the admin team to restore your account access.
                </p>
              </div>
            )}

            {accountStatus === "deactivate_requested" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="text-amber-800 text-sm font-medium">
                  Deactivation Request Pending
                </p>
                <p className="text-amber-700 text-sm">
                  Your account will remain active until the admin approves your deactivation request. You can cancel this request anytime.
                </p>
              </div>
            )}

            {accountStatus === "reactivate_requested" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-blue-800 text-sm font-medium">
                  Reactivation Request Pending
                </p>
                <p className="text-blue-700 text-sm">
                  Your reactivation request is under review by the admin team. You'll be notified once it's processed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-blue-600" />
            Account Actions
          </h3>

          <div className="space-y-3">
            {accountStatus === "active" && (
              <>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <FiLogOut className="w-5 h-5" />
                  Request Account Deactivation
                </button>
                <p className="text-slate-600 text-xs text-center">
                  Your account will remain active until admin approves the request
                </p>
              </>
            )}

            {accountStatus === "inactive" && (
              <>
                <button
                  onClick={() => setShowReactivateModal(true)}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  Request Account Reactivation
                </button>
                <p className="text-slate-600 text-xs text-center">
                  Send a request to admin team to restore your account
                </p>
              </>
            )}

            {accountStatus === "deactivate_requested" && (
              <>
                <button
                  onClick={handleCancelDeactivateRequest}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiX className="w-5 h-5" />
                  {actionLoading ? "Cancelling..." : "Cancel Deactivation Request"}
                </button>
                <p className="text-slate-600 text-xs text-center">
                  Cancel your pending deactivation request and keep your account active
                </p>
              </>
            )}

            {accountStatus === "reactivate_requested" && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-700 text-sm text-center">
                  ⏳ Your reactivation request is pending. We'll notify you once the admin has reviewed it.
                </p>
              </div>
            )}

            <Link
              to="/profile"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200 rounded-lg transition font-medium text-center text-slate-800 hover:text-slate-900"
            >
              View Full Profile
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>
              <strong>How it works:</strong> You can deactivate your account anytime. Once deactivated, contact the admin team to reactivate it. 
              All your data will be preserved during deactivation.
            </span>
          </p>
        </div>
        </div>
      </main>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deactivate Account?</h3>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to request account deactivation? Your account will remain active until the admin approves the request.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDeactivation}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reactivate Account?</h3>
            <p className="text-slate-600 text-sm mb-4">
              Please tell us why you want to reactivate your account (optional):
            </p>
            <textarea
              value={reactivationReason}
              onChange={(e) => setReactivationReason(e.target.value)}
              placeholder="Your reason..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReactivateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReactivation}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Submitting..." : "Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
