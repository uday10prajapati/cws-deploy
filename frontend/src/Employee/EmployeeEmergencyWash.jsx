import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FiCamera, FiX, FiCheck, FiClock, FiSearch, FiMapPin } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";


export default function EmployeeEmergencyWash() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState({
    after_img_1: null,
    after_img_2: null,
    after_img_3: null,
    after_img_4: null,
  });

  // Fetch assigned emergency wash requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("emergency_wash_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
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
          ...(newStatus === "Completed" && { completed_at: new Date() }),
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

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    const newImages = {};

    Array.from(files).forEach((file, index) => {
      const key = `after_img_${index + 1}`;
      newImages[key] = file;
    });

    setImages(prev => ({ ...prev, ...newImages }));
  };

  const uploadImages = async () => {
    if (!selectedRequest) return;

    try {
      setUploadingImages(true);
      const uploadedUrls = { ...selectedRequest };
      let hasImages = false;

      for (const [key, file] of Object.entries(images)) {
        if (file) {
          hasImages = true;
          const fileName = `${selectedRequest.id}/${key}-${Date.now()}`;
          const { data, error } = await supabase.storage
            .from("emergency-wash-images")
            .upload(fileName, file, { upsert: true });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("emergency-wash-images")
            .getPublicUrl(fileName);

          uploadedUrls[key] = urlData.publicUrl;
        }
      }

      if (hasImages) {
        const { error } = await supabase
          .from("emergency_wash_requests")
          .update(uploadedUrls)
          .eq("id", selectedRequest.id);

        if (error) throw error;

        setSelectedRequest(uploadedUrls);
        setRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id ? uploadedUrls : req
          )
        );

        setImages({
          after_img_1: null,
          after_img_2: null,
          after_img_3: null,
          after_img_4: null,
        });
        setShowImageUpload(false);
        alert("Images uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch = searchTerm === "" ||
      req.car_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.car_model?.toLowerCase().includes(searchTerm.toLowerCase());

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
      <div className="flex min-h-screen bg-gray-900">
      
        <div className="flex-1 flex justify-center items-center">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
    
    

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Emergency Wash Requests</h1>
            <p className="text-gray-400 mt-2">View and manage all emergency wash service requests</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by plate, address, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", count: requests.length, color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
              { label: "Pending", count: requests.filter(r => r.status === "Pending").length, color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
              { label: "In Progress", count: requests.filter(r => r.status === "In Progress").length, color: "bg-purple-500/20 text-purple-400 border border-purple-500/30" },
              { label: "Completed", count: requests.filter(r => r.status === "Completed").length, color: "bg-green-500/20 text-green-400 border border-green-500/30" },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-lg p-4 text-center`}>
                <p className="text-3xl font-bold">{stat.count}</p>
                <p className="text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Requests Grid */}
          <div className="grid gap-6">
            {filteredRequests.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                <p className="text-gray-400 text-lg">No assigned emergency wash requests</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {request.car_model || request.car_plate || "Car Wash"}
                      </h3>
                      <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                        <FiMapPin className="w-4 h-4" /> {request.address}
                      </p>
                    </div>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status === "Completed" ? <FiCheck className="w-5 h-5" /> : <FiClock className="w-5 h-5" />}
                      {request.status}
                    </span>
                  </div>

                  {request.description && (
                    <p className="text-gray-400 text-sm mb-4">{request.description}</p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                    <span>
                      Assigned: {new Date(request.created_at).toLocaleDateString()}
                    </span>
                    {request.status === "Completed" && request.after_img_1 && (
                      <span className="flex items-center gap-1 text-green-400">
                        <FiCamera /> Photos uploaded
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Modal */}
          {selectedRequest && (
            <DetailModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onStatusChange={updateRequestStatus}
              onUploadClick={() => setShowImageUpload(true)}
            />
          )}

          {/* Image Upload Modal */}
          {showImageUpload && selectedRequest && (
            <ImageUploadModal
              request={selectedRequest}
              onClose={() => setShowImageUpload(false)}
              onUpload={handleImageUpload}
              onSubmit={uploadImages}
              uploading={uploadingImages}
              images={images}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Detail Modal
function DetailModal({ request, onClose, onStatusChange, onUploadClick }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Request Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Car Model</p>
              <p className="font-semibold text-white">{request.car_model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Plate Number</p>
              <p className="font-semibold text-white">{request.car_plate}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-400">Address</p>
              <p className="font-semibold text-white flex items-center gap-2">
                <FiMapPin /> {request.address}
              </p>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Description</p>
              <p className="text-gray-300 bg-gray-700 p-3 rounded-lg">{request.description}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-3">Current Status</p>
            <div className="flex flex-wrap gap-2">
              {["Assigned", "In Progress", "Completed"].map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(request.id, status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    request.status === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Images Section */}
          {(request.before_img_1 || request.after_img_1) && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-white mb-4">Service Images</h3>
              
              {/* Before Images */}
              {(request.before_img_1 || request.before_img_2 || request.before_img_3 || request.before_img_4) && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3 font-medium">Before Photos</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {request.before_img_1 && (
                      <img src={request.before_img_1} alt="Before 1" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.before_img_2 && (
                      <img src={request.before_img_2} alt="Before 2" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.before_img_3 && (
                      <img src={request.before_img_3} alt="Before 3" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.before_img_4 && (
                      <img src={request.before_img_4} alt="Before 4" className="w-full h-40 object-cover rounded-lg" />
                    )}
                  </div>
                </div>
              )}

              {/* After Images */}
              {request.status === "Completed" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-400 font-medium">After Photos</p>
                    <button
                      onClick={onUploadClick}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-semibold"
                    >
                      <FiCamera /> Upload
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {request.after_img_1 && (
                      <img src={request.after_img_1} alt="After 1" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.after_img_2 && (
                      <img src={request.after_img_2} alt="After 2" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.after_img_3 && (
                      <img src={request.after_img_3} alt="After 3" className="w-full h-40 object-cover rounded-lg" />
                    )}
                    {request.after_img_4 && (
                      <img src={request.after_img_4} alt="After 4" className="w-full h-40 object-cover rounded-lg" />
                    )}
                  </div>
                  {!request.after_img_1 && (
                    <button
                      onClick={onUploadClick}
                      className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
                    >
                      <FiCamera className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <p className="text-gray-400">Click to upload after photos</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-700 pt-4 text-xs text-gray-500 space-y-1">
            <p>Assigned: {new Date(request.created_at).toLocaleString()}</p>
            {request.completed_at && (
              <p>Completed: {new Date(request.completed_at).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Upload Modal
function ImageUploadModal({ request, onClose, onUpload, onSubmit, uploading, images }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Upload Service Photos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Select up to 4 photos of completed work
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUpload}
            className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors text-gray-400"
          />

          <div className="flex gap-4 mt-6">
            <button
              onClick={onSubmit}
              disabled={uploading || Object.values(images).every(img => !img)}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Photos"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
