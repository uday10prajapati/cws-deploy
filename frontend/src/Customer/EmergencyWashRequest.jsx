import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FiPlus, FiCamera, FiX, FiCheck, FiClock } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import NavbarNew from "../components/NavbarNew";

export default function EmergencyWashRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    car_id: "",
    car_plate: "",
    car_model: "",
    address: "",
    description: "",
  });

  const [userCars, setUserCars] = useState([]);

  // Fetch user's cars and emergency wash requests
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = JSON.parse(localStorage.getItem("userDetails"))?.id;

      if (!userId) return;

      // Fetch user's cars from backend API
      try {
        const carResponse = await fetch(
          `http://localhost:5000/cars/${userId}`
        );
        const carResult = await carResponse.json();
        setUserCars(carResult.success ? carResult.data || [] : []);
      } catch (err) {
        console.warn("⚠️ Could not fetch cars:", err);
        setUserCars([]);
      }

      // Fetch user's emergency wash requests
      const { data: requestsData } = await supabase
        .from("emergency_wash_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setRequests(requestsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address.trim()) {
      alert("Please enter an address");
      return;
    }

    try {
      setSubmitting(true);
      const userId = JSON.parse(localStorage.getItem("userDetails"))?.id;

      const { data, error } = await supabase
        .from("emergency_wash_requests")
        .insert([
          {
            user_id: userId,
            car_id: formData.car_id || null,
            car_plate: formData.car_plate,
            car_model: formData.car_model,
            address: formData.address,
            description: formData.description,
            status: "Pending",
          },
        ])
        .select();

      if (error) throw error;

      setRequests(prev => [data[0], ...prev]);
      setFormData({ car_id: "", car_plate: "", car_model: "", address: "", description: "" });
      setShowForm(false);
      alert("Quick wash request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <FiClock className="w-5 h-5" />;
      case "Completed":
        return <FiCheck className="w-5 h-5" />;
      default:
        return <FaSpinner className="w-5 h-5 animate-spin" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <div className="flex justify-center items-center py-32">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Navbar */}
      <NavbarNew />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Quick Wash Requests</h1>
            <p className="text-slate-600 mt-2">Request urgent car wash service whenever you need it</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow-md"
            >
              <FiPlus /> New Request
            </button>
          )}
        </div>

        {/* Request Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">New Quick Wash Request</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Car Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Select Car (Optional)
                  </label>
                  <select
                    name="car_id"
                    value={formData.car_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Choose a car...</option>
                    {userCars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.car_model} ({car.car_plate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Car Plate */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">
                    Car Plate Number
                  </label>
                  <input
                    type="text"
                    name="car_plate"
                    placeholder="ABC 1234"
                    value={formData.car_plate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Car Model */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Car Model
                </label>
                <input
                  type="text"
                  name="car_model"
                  placeholder="e.g., Toyota Camry 2022"
                  value={formData.car_model}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Wash Location Address *
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter the address where the wash should happen"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the condition of your car and any specific concerns..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-semibold text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-md">
              <p className="text-slate-600 text-lg">No quick wash requests yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Create your first request
              </button>
            </div>
          ) : (
            requests.map(request => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-slate-200 hover:border-blue-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {request.car_model || request.car_plate || "Car Wash"}
                    </h3>
                    <p className="text-slate-600 text-sm">{request.address}</p>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </span>
                </div>

                {request.description && (
                  <p className="text-slate-600 text-sm mb-3">{request.description}</p>
                )}

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  {request.status === "Completed" && request.after_img_1 && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <FiCamera /> Photos available
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </main>
    </div>
  );
}

// Detail Modal Component
function RequestDetailModal({ request, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-200 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-900">Request Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Car</p>
              <p className="font-semibold text-slate-900">{request.car_model || request.car_plate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-semibold text-slate-900">{request.status}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-semibold text-slate-900">{request.address}</p>
            </div>
            {request.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">Description</p>
                <p className="text-slate-700">{request.description}</p>
              </div>
            )}
          </div>

          {/* Images Section */}
          {request.status === "Completed" && (request.before_img_1 || request.after_img_1) && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-4">Service Images</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {request.before_img_1 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Before</p>
                    <img src={request.before_img_1} alt="Before" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                  </div>
                )}
                {request.after_img_1 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">After</p>
                    <img src={request.after_img_1} alt="After" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p>Created: {new Date(request.created_at).toLocaleString()}</p>
            {request.completed_at && (
              <p>Completed: {new Date(request.completed_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
