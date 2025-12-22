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
  const [transactionId, setTransactionId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("method");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(149);

  // Form state
  const [formData, setFormData] = useState({
    car_id: "",
    car_plate: "",
    car_model: "",
    address: "",
    description: "",
    latitude: null,
    longitude: null,
  });

  const [userCars, setUserCars] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

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

  const handleCarSelection = (e) => {
    const carId = e.target.value;
    setFormData(prev => ({ ...prev, car_id: carId }));

    // Auto-fill car details when a car is selected
    if (carId) {
      const selectedCar = userCars.find(car => car.id === carId);
      if (selectedCar) {
        setFormData(prev => ({
          ...prev,
          car_id: selectedCar.id,
          car_plate: selectedCar.number_plate || "",
          car_model: `${selectedCar.brand || ""} ${selectedCar.model || ""}`.trim(),
        }));
        console.log("✅ Car selected and auto-filled:", selectedCar);
      }
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Only update latitude and longitude, keep address as user wrote it
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude,
          }));
          console.log("✅ Current location obtained:", { latitude, longitude });
          alert("Location captured successfully! Latitude and longitude filled in.");
        },
        (error) => {
          console.error("❌ Geolocation error:", error);
          alert(`Failed to get location: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      console.error("❌ Error getting location:", error);
      alert("Error getting location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
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
            latitude: formData.latitude,
            longitude: formData.longitude,
            status: "Pending",
          },
        ])
        .select();

      if (error) throw error;

      setRequests(prev => [data[0], ...prev]);
      setFormData({ car_id: "", car_plate: "", car_model: "", address: "", description: "", latitude: null, longitude: null });
      setShowForm(false);
      
      // Show payment modal after successful request creation
      setPaymentAmount(149);
      setPaymentStep("method");
      setPaymentStatus(null);
      setPaymentVerified(false);
      setShowPayment(true);
      
      alert("Quick wash request submitted! Now proceed with payment.");
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
                    onChange={handleCarSelection}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Choose a car...</option>
                    {userCars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} - {car.number_plate}
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
                  placeholder="Enter the address where the wash should happen (e.g., 123 Main St, Ankleshwar)"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Get Current Location Button */}
              <div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locationLoading ? "📍 Getting Location..." : "📍 Get Current Location"}
                </button>
                <p className="text-xs text-slate-500 mt-1">Click to auto-fill latitude and longitude from your device</p>
              </div>

              {/* Latitude & Longitude Coordinates Input */}
              <div className="grid md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <label className="text-sm font-medium text-slate-800 block mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded text-slate-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g., 21.637381"
                  />
                  <p className="text-xs text-slate-500 mt-1">Decimal degrees (e.g., 21.637381)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800 block mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded text-slate-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g., 72.996128"
                  />
                  <p className="text-xs text-slate-500 mt-1">Decimal degrees (e.g., 72.996128)</p>
                </div>
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
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </span>
                </div>

                {/* Wash Location Address */}
                <div className="mb-3 pb-3 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Wash Location Address *</p>
                  <p className="text-slate-900 font-medium">{request.address}</p>
                  {(request.latitude || request.longitude) && (
                    <p className="text-xs text-blue-600 mt-1 font-mono">
                      📍 {parseFloat(request.latitude).toFixed(6)}, {parseFloat(request.longitude).toFixed(6)}
                    </p>
                  )}
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
  const [transactionId, setTransactionId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paying, setPaying] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("method");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const SERVICE_FEE = 149;
  const GST_RATE = 0.09;
  const GST_AMOUNT = SERVICE_FEE * GST_RATE;
  const TOTAL_AMOUNT = SERVICE_FEE + GST_AMOUNT;

  // Generate QR code URL (using QR server API)
  const generateQRCode = (upiLink) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    return qrUrl;
  };

  // Initiate payment with backend
  const initiatePayment = async (paymentMethod) => {
    try {
      // Get user from Supabase auth for proper metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        alert("User not authenticated");
        return null;
      }

      const payload = {
        amount: TOTAL_AMOUNT,
        customer_id: authUser.id,
        customer_email: authUser.email,
        customer_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "Customer",
        customer_phone: authUser.user_metadata?.phone || "9999999999",
        payment_method: paymentMethod,
        notes: `Emergency Wash Request for ${request.car_model || request.car_plate}`,
      };

      const response = await fetch("http://localhost:5000/alt-payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        alert(`Payment initiation failed: ${result.error}`);
        console.error("Payment error details:", result);
        return null;
      }

      console.log("✅ Payment initiated successfully:", result);
      setTransactionId(result.transaction_id);
      setPaymentDetails(result.paymentDetails || result.payment_details);
      return result;
    } catch (err) {
      console.error("Payment error:", err);
      alert(`Payment error: ${err.message}`);
      return null;
    }
  };

  // Verify payment after user completes payment
  const verifyPayment = async (txnId, paymentMethod, verificationData) => {
    try {
      let endpoint = "";
      let payload = { transaction_id: txnId, ...verificationData };

      switch (paymentMethod) {
        case "upi":
          endpoint = "/alt-payment/verify-upi";
          break;
        case "card":
          endpoint = "/alt-payment/verify-card";
          break;
        case "netbanking":
          endpoint = "/alt-payment/verify-net-banking";
          break;
        case "wallet":
          endpoint = "/alt-payment/verify-wallet";
          break;
        default:
          return false;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error("Verification error:", err);
      return false;
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelected = async (method) => {
    setSelectedPaymentMethod(method);
    setPaymentStep("processing");
    setPaymentStatus(null);
    setPaymentVerified(false);
    setPaying(true);

    const paymentData = await initiatePayment(method);
    if (!paymentData) {
      setPaying(false);
      setPaymentStep("method");
      return;
    }

    setPaymentStatus("processing");
    setPaying(false);
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      setShowPayment(true);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
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
              <p className="text-sm text-slate-600">Wash Location Address *</p>
              <p className="font-semibold text-slate-900">{request.address}</p>
            </div>
            {request.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">Description</p>
                <p className="text-slate-700">{request.description}</p>
              </div>
            )}
            {(request.latitude || request.longitude) && (
              <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600 font-semibold mb-2">Location Coordinates</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {request.latitude && (
                    <div>
                      <p className="text-xs text-slate-600">Latitude</p>
                      <p className="text-slate-900 font-mono text-sm">{parseFloat(request.latitude).toFixed(6)}</p>
                    </div>
                  )}
                  {request.longitude && (
                    <div>
                      <p className="text-xs text-slate-600">Longitude</p>
                      <p className="text-slate-900 font-mono text-sm">{parseFloat(request.longitude).toFixed(6)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location Coordinates - Removed (using area-based location) */}

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

          {/* Payment Section - Show when Completed */}
          {request.status === "Completed" && !showPayment && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-4 text-lg">Payment Summary</h3>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Service Fee</p>
                    <p className="text-xs text-slate-600">Emergency Wash Service</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">₹{SERVICE_FEE.toFixed(2)}</p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <p className="text-sm font-bold text-slate-900">Total Amount</p>
                  <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    ₹{TOTAL_AMOUNT.toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paying}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {paying ? "Processing..." : `Pay ₹${TOTAL_AMOUNT.toFixed(2)}`}
              </button>

              <p className="text-center text-xs text-slate-600 mt-3">
                Secure payment powered by trusted gateway
              </p>
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="border-t border-slate-200 pt-4 space-y-4">
              {paymentStep === "method" ? (
                <>
                  <h3 className="font-bold text-slate-900 text-lg">Select Payment Method</h3>
                  <div className="space-y-2">
                    {[
                      { id: "upi", label: "📱 UPI", desc: "Google Pay, PhonePe, PayTM" },
                      { id: "card", label: "💳 Card", desc: "Visa, MasterCard, Rupay" },
                      { id: "wallet", label: "👛 Wallet", desc: "CarWash+ Wallet Balance" },
                      { id: "netbanking", label: "🏦 Net Banking", desc: "All major Indian banks" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelected(method.id)}
                        className="w-full flex items-center justify-between gap-3 p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition text-left"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{method.label}</p>
                          <p className="text-xs text-slate-500">{method.desc}</p>
                        </div>
                        <span className="text-xl">→</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition text-slate-700"
                  >
                    Cancel
                  </button>
                </>
              ) : selectedPaymentMethod === "upi" ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">📱 Scan to Pay with UPI</h3>
                  
                  {paymentDetails?.upi_link ? (
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <img 
                        src={generateQRCode(paymentDetails.upi_link)} 
                        alt="UPI QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700 font-semibold">UPI Payment Details</p>
                      {paymentDetails?.upi_id && (
                        <p className="text-lg font-mono text-slate-900 mt-2">{paymentDetails.upi_id}</p>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-lg font-bold text-blue-700">Amount: ₹{TOTAL_AMOUNT.toFixed(2)}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-800">Enter UTR Number after payment:</label>
                    <input 
                      type="text" 
                      placeholder="UTR / Reference number"
                      id="emergency-upi-utr"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      const utr = document.getElementById("emergency-upi-utr")?.value?.trim();
                      if (!utr) {
                        alert("Please enter UTR number");
                        return;
                      }

                      const verified = await verifyPayment(
                        transactionId,
                        "upi",
                        { utr, payment_timestamp: new Date().toISOString() }
                      );

                      if (verified) {
                        setPaymentVerified(true);
                        setPaymentStatus("success");
                        alert("Payment verified successfully!");
                        setTimeout(() => onClose(), 2000);
                      } else {
                        alert("Payment verification failed. Please check UTR and try again.");
                      }
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition text-white"
                  >
                    ✓ Verify Payment
                  </button>

                  <button
                    onClick={() => setPaymentStep("method")}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                  >
                    Use Different Method
                  </button>
                </div>
              ) : selectedPaymentMethod === "card" ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">💳 Card Payment</h3>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Card Number"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                    />
                    <input 
                      type="text" 
                      placeholder="Cardholder Name"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      />
                      <input 
                        type="text" 
                        placeholder="CVV"
                        className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert("Payment processed successfully!");
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition text-white"
                  >
                    💳 Pay ₹{TOTAL_AMOUNT.toFixed(2)}
                  </button>

                  <button
                    onClick={() => setPaymentStep("method")}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                  >
                    Use Different Method
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Processing Payment...</h3>
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-slate-600">Please wait while we process your payment</span>
                  </div>
                  <button
                    onClick={() => setPaymentStep("method")}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
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
