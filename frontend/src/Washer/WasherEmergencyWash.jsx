import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { FiCheckCircle, FiClock, FiUser, FiPhone, FiMapPin, FiCamera, FiX, FiCheck, FiNavigation } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

export default function WasherEmergencyWash() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingRequest, setCompletingRequest] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState({
    after_img_1: null,
    after_img_2: null,
    after_img_3: null,
    after_img_4: null,
  });
  const [filterStatus, setFilterStatus] = useState("all");

  // Get current user and fetch requests
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAssignedRequests();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        // Fetch profile to get washer info
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        
        console.log("🔍 Current User ID:", data.user.id);
        console.log("📋 Current User Profile:", profile);
        
        setCurrentUser(profile || { id: data.user.id });
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedRequests = async () => {
    try {
      setLoading(true);
      
      console.log("🔎 Current Washer ID:", currentUser?.id);
      console.log("🔎 Current User Object:", currentUser);
      
      // Fetch all emergency wash requests assigned to current washer
      const { data, error } = await supabase
        .from("emergency_wash_requests")
        .select("*")
        .eq("assigned_to", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Query Error:", error);
        throw error;
      }

      console.log("✅ Found requests:", data?.length || 0);
      console.log("📋 Request data:", data);
      
      // Log each request's assigned_to value for debugging
      if (data && data.length > 0) {
        data.forEach(req => {
          console.log(`Request ${req.id}: assigned_to = ${req.assigned_to}, type = ${typeof req.assigned_to}`);
        });
      }

      // Fetch customer profile data for each request
      const requestsWithCustomerData = await Promise.all(
        (data || []).map(async (request) => {
          try {
            const { data: customerProfile } = await supabase
              .from("profiles")
              .select("name, phone, email, city, taluko, area")
              .eq("id", request.user_id)
              .single();
            
            return {
              ...request,
              customer_name: customerProfile?.name,
              customer_phone: customerProfile?.phone,
              customer_email: customerProfile?.email,
              customer_city: customerProfile?.city,
              customer_taluko: customerProfile?.taluko,
              customer_area: customerProfile?.area,
            };
          } catch (err) {
            console.warn("Error fetching customer profile:", err);
            return request;
          }
        })
      );

      setRequests(requestsWithCustomerData);
    } catch (error) {
      console.error("Error fetching assigned requests:", error);
      alert("Failed to load assigned requests");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageKey, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages({
          ...images,
          [imageKey]: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImagesToSupabase = async (requestId) => {
    try {
      setUploadingImages(true);
      const uploadedUrls = {};

      for (const [key, imageData] of Object.entries(images)) {
        if (imageData && imageData.startsWith("data:")) {
          // Convert base64 to blob
          const response = await fetch(imageData);
          const blob = await response.blob();

          // Upload to Supabase Storage
          const timestamp = Date.now();
          const filePath = `emergency-wash/${requestId}/${key}_${timestamp}.jpg`;

          const { data, error } = await supabase.storage
            .from("emergency-wash-photos")
            .upload(filePath, blob);

          if (error) throw error;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("emergency-wash-photos")
            .getPublicUrl(filePath);

          uploadedUrls[key] = urlData.publicUrl;
        }
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest) return;

    try {
      setCompletingRequest(true);

      // Upload images if any
      const uploadedUrls = await uploadImagesToSupabase(selectedRequest.id);

      // Update request status
      const { error: updateError } = await supabase
        .from("emergency_wash_requests")
        .update({
          status: "Completed",
          after_img_1: uploadedUrls.after_img_1 || selectedRequest.after_img_1,
          after_img_2: uploadedUrls.after_img_2 || selectedRequest.after_img_2,
          after_img_3: uploadedUrls.after_img_3 || selectedRequest.after_img_3,
          after_img_4: uploadedUrls.after_img_4 || selectedRequest.after_img_4,
          completed_at: new Date(),
          updated_at: new Date(),
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? { 
                ...req, 
                status: "Completed",
                after_img_1: uploadedUrls.after_img_1 || req.after_img_1,
                after_img_2: uploadedUrls.after_img_2 || req.after_img_2,
                after_img_3: uploadedUrls.after_img_3 || req.after_img_3,
                after_img_4: uploadedUrls.after_img_4 || req.after_img_4,
              }
            : req
        )
      );

      alert("Wash completed successfully!");
      setShowCompleteModal(false);
      setShowDetailModal(false);
      setSelectedRequest(null);
      setImages({
        after_img_1: null,
        after_img_2: null,
        after_img_3: null,
        after_img_4: null,
      });
    } catch (error) {
      console.error("Error completing request:", error);
      alert("Failed to complete wash request");
    } finally {
      setCompletingRequest(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from("emergency_wash_requests")
        .update({
          status: newStatus,
          updated_at: new Date(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );

      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }

      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredRequests = requests.filter(req => {
    return filterStatus === "all" || req.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
        <NavbarNew />
        <div className="flex justify-center items-center h-screen">
          <FaSpinner className="text-4xl text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
      <NavbarNew />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Emergency Wash Requests</h1>
          <p className="text-gray-600">View and manage your assigned emergency wash requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
          {["all", "Assigned", "In Progress", "Completed"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === status
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All Requests" : status}
            </button>
          ))}
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiCheckCircle className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filterStatus === "all" 
                ? "No emergency wash requests assigned yet"
                : `No ${filterStatus.toLowerCase()} requests`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer border-l-4 border-indigo-600"
                onClick={() => {
                  setSelectedRequest(request);
                  setShowDetailModal(true);
                }}
              >
                {/* Status Badge */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      request.status === "Completed"
                        ? "bg-green-500"
                        : request.status === "In Progress"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}>
                      {request.status}
                    </span>
                    {request.status === "Assigned" && <FiClock className="text-lg" />}
                  </div>
                  <h3 className="text-xl font-bold">{request.car_model}</h3>
                  <p className="text-indigo-100">{request.car_plate}</p>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  {/* Customer Info */}
                  <div className="mb-3 pb-3 border-b">
                    <div className="flex items-start gap-2 mb-2">
                      <FiUser className="text-indigo-600 mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800">{request.customer_name || "Customer"}</p>
                        <p className="text-sm text-gray-600">{request.customer_taluko}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiPhone className="text-indigo-600" />
                      <span>{request.customer_phone}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3">
                    <FiMapPin className="text-indigo-600 mt-1 shrink-0" />
                    <p className="text-sm text-gray-600">{request.address}</p>
                  </div>

                  {/* Time Info */}
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Requested: {new Date(request.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* View Details Button */}
                  <button
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedRequest.car_model}</h2>
                  <p className="text-indigo-100">{selectedRequest.car_plate}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-2xl hover:text-indigo-200"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Current Status</h3>
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold text-white ${
                    selectedRequest.status === "Completed"
                      ? "bg-green-500"
                      : selectedRequest.status === "In Progress"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>

                {/* Status Update Buttons */}
                {selectedRequest.status !== "Completed" && (
  <>
    <div className="flex gap-3">
      {selectedRequest.status === "Assigned" && (
        <button
          onClick={() => handleUpdateStatus(selectedRequest.id, "In Progress")}
          className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
        >
          Start Wash
        </button>
      )}
      {selectedRequest.status === "In Progress" && (
        <button
          onClick={() => setShowCompleteModal(true)}
          className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <FiCheckCircle /> Complete & Upload Photos
        </button>
      )}
    </div>

    {/* Start Tracking Button */}
    {selectedRequest.status === "In Progress" && (
      <button
        onClick={() => {
          navigate(`/washer/emergency-wash/track?requestId=${selectedRequest.id}`);
        }}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mt-3 shadow-md hover:shadow-lg"
      >
        <FiNavigation className="text-lg" />
        Start Live Tracking
      </button>
    )}
  </>
)}

              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Area/Taluko</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.customer_taluko || selectedRequest.customer_area}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Car Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Car Details</h3>
                <div className="space-y-2">
                  <div><span className="text-sm text-gray-600">Model:</span> <span className="font-semibold">{selectedRequest.car_model}</span></div>
                  <div><span className="text-sm text-gray-600">Plate:</span> <span className="font-semibold">{selectedRequest.car_plate}</span></div>
                  <div><span className="text-sm text-gray-600">Color:</span> <span className="font-semibold">{selectedRequest.car_color}</span></div>
                  <div><span className="text-sm text-gray-600">Type:</span> <span className="font-semibold">{selectedRequest.car_type || "Not specified"}</span></div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Wash Location</h3>
                <p className="text-gray-700">{selectedRequest.address}</p>
              </div>

              {/* Request Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Request Details</h3>
                <div className="space-y-2">
                  <div><span className="text-sm text-gray-600">Type:</span> <span className="font-semibold">{selectedRequest.wash_type || "Emergency"}</span></div>
                  <div><span className="text-sm text-gray-600">Requested:</span> <span className="font-semibold">{new Date(selectedRequest.created_at).toLocaleString()}</span></div>
                  {selectedRequest.special_requests && (
                    <div><span className="text-sm text-gray-600">Special Requests:</span> <span className="font-semibold">{selectedRequest.special_requests}</span></div>
                  )}
                </div>
              </div>

              {/* After Photos */}
              {selectedRequest.after_img_1 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Completion Photos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => {
                      const imgKey = `after_img_${i}`;
                      const imgUrl = selectedRequest[imgKey];
                      return imgUrl ? (
                        <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                          <img src={imgUrl} alt={`After ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 p-4 sticky bottom-0 border-t">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Request Modal */}
      {showCompleteModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Complete Wash & Upload Photos</h2>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="text-2xl hover:text-green-200"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 mb-4">Upload at least one photo to confirm the wash is complete</p>

              {/* Image Upload Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => {
                  const imageKey = `after_img_${i}`;
                  return (
                    <div key={i} className="aspect-square">
                      <label className="block w-full h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(imageKey, e.target.files?.[0])}
                          className="hidden"
                        />
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          {images[imageKey] ? (
                            <img
                              src={images[imageKey]}
                              alt={`Photo ${i}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-center">
                              <FiCamera className="text-3xl text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Photo {i}</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Warning */}
              {!Object.values(images).some(img => img) && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg">
                  <p className="text-sm">Please upload at least one photo before completing.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 p-4 border-t flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteRequest}
                disabled={completingRequest || uploadingImages || !Object.values(images).some(img => img)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {completingRequest || uploadingImages ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Complete & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
