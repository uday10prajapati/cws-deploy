import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin, FiPhone, FiUser, FiCheck, FiClock, FiSearch } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import NavbarNew from "../components/NavbarNew";

export default function HREmergencyWashRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userTaluko, setUserTaluko] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch HR's assigned taluko and requests
  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const userId = JSON.parse(localStorage.getItem("userDetails"))?.id;

      if (!userId) {
        alert("User not logged in");
        return;
      }

      // Get HR's profile to find their assigned taluko
      const { data: hrProfile } = await supabase
        .from("profiles")
        .select("taluko, assigned_talukas")
        .eq("id", userId)
        .single();

      if (hrProfile) {
        const taluko = hrProfile.taluko || (hrProfile.assigned_talukas?.[0] || "");
        setUserTaluko(taluko);

        if (taluko) {
          // Fetch emergency wash requests for this taluko
          const { data: requestsData } = await supabase
            .from("emergency_wash_requests")
            .select("*")
            .ilike("taluko", `%${taluko}%`)
            .order("created_at", { ascending: false });

          setRequests(requestsData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching HR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from("emergency_wash_requests")
        .update({
          status: newStatus,
          updated_at: new Date(),
        })
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }

      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch = searchTerm === "" ||
      req.car_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.car_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      "Assigned": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      "In Progress": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
      "Completed": "bg-green-500/20 text-green-400 border border-green-500/30",
      "Cancelled": "bg-red-500/20 text-red-400 border border-red-500/30",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900 items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <NavbarNew />

      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">🚗 Emergency Wash Requests - {userTaluko}</h1>
            <p className="text-gray-400 mt-2">View and manage emergency wash requests in your assigned area</p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <FiSearch className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, plate, address, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", count: requests.length, color: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
              { label: "Pending", count: requests.filter(r => r.status === "Pending").length, color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" },
              { label: "In Progress", count: requests.filter(r => r.status === "In Progress").length, color: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
              { label: "Completed", count: requests.filter(r => r.status === "Completed").length, color: "bg-green-500/20 border-green-500/30 text-green-400" },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} border rounded-lg p-4 text-center shadow-sm`}>
                <p className="text-3xl font-bold">{stat.count}</p>
                <p className="text-sm font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Requests List */}
          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700 shadow-sm">
                <p className="text-gray-400 text-lg">No emergency wash requests in your area</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-gray-700 hover:border-blue-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {request.car_model || request.car_plate || "Car Wash"}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                        <FiMapPin size={14} /> {request.address}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        <span className="font-medium">Customer:</span> {request.customer_name || "N/A"} | 
                        <span className="font-medium ml-2">Phone:</span> {request.customer_phone || "N/A"}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.description && (
                    <p className="text-gray-400 text-sm mb-4">{request.description}</p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                    <span>
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </span>
                    {request.status === "Pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRequestStatus(request.id, "In Progress");
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-gray-700 shadow-xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Customer Information</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 font-medium">Name</p>
                    <p className="text-white">{selectedRequest.customer_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Phone</p>
                    <p className="text-white">{selectedRequest.customer_phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Car & Address */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 font-medium">Car Model</p>
                  <p className="font-semibold text-white">{selectedRequest.car_model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Plate Number</p>
                  <p className="font-semibold text-white">{selectedRequest.car_plate}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 font-medium">Address</p>
                  <p className="font-semibold text-white flex items-center gap-2">
                    <FiMapPin className="text-blue-400" /> {selectedRequest.address}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-2">Description</p>
                  <p className="text-gray-300 bg-gray-700 p-3 rounded-lg">{selectedRequest.description}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-gray-400 font-medium mb-3">Current Status</p>
                <div className="flex flex-wrap gap-2">
                  {["Pending", "In Progress", "Completed", "Cancelled"].map(status => (
                    <button
                      key={status}
                      onClick={() => updateRequestStatus(selectedRequest.id, status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedRequest.status === status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t border-gray-700 pt-4 text-xs text-gray-400 space-y-1">
                <p>Created: {new Date(selectedRequest.created_at).toLocaleString()}</p>
                {selectedRequest.completed_at && (
                  <p>Completed: {new Date(selectedRequest.completed_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
