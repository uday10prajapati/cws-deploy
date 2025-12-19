import React, { useEffect, useState } from "react";
import { FiCheck, FiX, FiAlertCircle, FiLoader } from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";

export default function ApprovalPanel() {
  const [pendingRequests, setpendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/pending-approvals");
      const data = await response.json();

      if (data.success) {
        setpendingRequests(data.approvals || []);
        console.log("✅ Loaded approvals:", data.approvals);
      } else {
        console.error("Error loading approvals:", data.error);
        setMessage("Failed to load pending requests");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error loading requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId) => {
    setActionLoading(requestId);
    try {
      const response = await fetch("http://localhost:5000/admin/approve-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: requestId, userId: userId }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("✅ Employee approved successfully!");
        setpendingRequests(pendingRequests.filter((req) => req.id !== requestId));
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Failed to approve request: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error processing approval");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId, userId) => {
    setActionLoading(requestId);
    try {
      const response = await fetch("http://localhost:5000/admin/reject-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: requestId, userId: userId }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("❌ Employee request rejected");
        setpendingRequests(pendingRequests.filter((req) => req.id !== requestId));
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Failed to reject request: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error processing rejection");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      employee_washer: "🧹 Car Washer",
      employee_rider: "🏍️ Rider",
      employee_sales: "💰 Sales Executive",
      customer: "👤 Customer",
    };
    return roleMap[role] || role;
  };

  const getRegistrationDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FiAlertCircle className="text-amber-500" />
          Employee Approval Requests
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Review and approve new employee signup requests
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="p-4 bg-blue-100 border border-blue-300 rounded-xl text-blue-800 font-medium">
          {message}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FiLoader className="text-3xl text-blue-600 animate-spin" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="p-8 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-center">
          <p className="text-slate-900 font-medium">✅ No pending requests</p>
          <p className="text-slate-600 text-sm mt-1">
            All employee signup requests have been processed
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg rounded-xl p-6 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* LEFT SIDE - USER INFO */}
                <div>
                  <div className="mb-4">
                    <p className="text-xs text-slate-600 uppercase font-semibold">Name</p>
                    <p className="text-slate-900 font-semibold">{request.name}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-600 uppercase font-semibold">Email</p>
                    <p className="text-blue-600 font-mono text-sm">{request.email}</p>
                  </div>

                  {request.phone && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 uppercase font-semibold">Phone</p>
                      <p className="text-slate-900 font-mono text-sm">{request.phone}</p>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE - ROLE & DATE */}
                <div>
                  <div className="mb-4">
                    <p className="text-xs text-slate-600 uppercase font-semibold">Requested Role</p>
                    <p className="text-slate-900 font-semibold text-lg">
                      {getRoleDisplay(request.requested_role)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-600 uppercase font-semibold">Registration Date</p>
                    <p className="text-slate-700 text-sm">
                      {getRegistrationDate(request.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleApprove(request.id, request.user_id)}
                  disabled={actionLoading === request.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {actionLoading === request.id ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiCheck />
                  )}
                  Approve
                </button>

                <button
                  onClick={() => handleReject(request.id, request.user_id)}
                  disabled={actionLoading === request.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {actionLoading === request.id ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiX />
                  )}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
