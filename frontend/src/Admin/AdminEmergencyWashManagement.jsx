import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiClock, FiUser, FiPhone, FiMapPin, FiCamera, FiEdit2, FiSearch } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import NavbarNew from "../components/NavbarNew";

export default function AdminEmergencyWashManagement() {
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
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [villageInput, setVillageInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [villageOptions, setVillageOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  // Fetch emergency wash requests and location options
  useEffect(() => {
    fetchRequests();
    fetchLocationOptions();
  }, []);

  const fetchLocationOptions = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("village, city, state");

      if (profiles) {
        const villages = [...new Set(profiles.map(p => p.village).filter(Boolean))];
        const cities = [...new Set(profiles.map(p => p.city).filter(Boolean))];
        const states = [...new Set(profiles.map(p => p.state).filter(Boolean))];
        
        setVillageOptions(villages.sort());
        setCityOptions(cities.sort());
        setStateOptions(states.sort());
      }
    } catch (err) {
      console.error("Error fetching location options:", err);
    }
  };

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
    
    const matchesVillage = selectedVillage === "" || req.village === selectedVillage;
    const matchesCity = selectedCity === "" || req.city === selectedCity;
    const matchesState = selectedState === "" || req.state === selectedState;

    return matchesStatus && matchesSearch && matchesVillage && matchesCity && matchesState;
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
      <div className="flex min-h-screen bg-linear-to-br from-slate-50 to-blue-50 items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const operationsMenu = [
    { label: "Approvals", link: "/admin/approvals", icon: <FiCheckCircle /> },
    { label: "Users", link: "/admin/users", icon: <FiUser /> },
    { label: "Riders", link: "/admin/riders", icon: <FiCheckCircle /> },
    { label: "Customer Accounts", link: "/admin/customer-accounts", icon: <FiUser /> },
    { label: "Cars", link: "/admin/cars", icon: <FiCheckCircle /> },
    { label: "WasherDocuments", link: "/admin/washer-documents", icon: <FiCheckCircle /> },
    { label: "Emergency Wash", link: "/admin/emergency-wash", icon: <FiCheckCircle /> },
  ];

  const financeMenu = [
    { label: "Revenue", link: "/admin/AllRevenue", icon: <FiCheckCircle /> },
    { label: "Earnings", link: "/admin/earnings", icon: <FiCheckCircle /> },
    { label: "Bank Account", link: "/admin/bank-account", icon: <FiCheckCircle /> },
  ];

  const adminAccountMenu = [
    { label: "Settings", link: "/admin/settings", icon: <FiCheckCircle /> },
    { label: "Profile", link: "/admin/profile", icon: <FiUser /> },
  ];

  return (
    <>
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main >
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900">🚗 Emergency Wash Requests</h1>
              <p className="text-slate-600 mt-2">View and manage all customer emergency wash requests</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-blue-100">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Search */}
                <div className="relative md:col-span-2">
                  <FiSearch className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by plate, address, or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-blue-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-blue-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Location Filters */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Village Filter */}
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Village</label>
                  <input
                    type="text"
                    placeholder="Type village name..."
                    value={villageInput}
                    onChange={(e) => {
                      setVillageInput(e.target.value);
                      setShowVillageSuggestions(true);
                    }}
                    onFocus={() => setShowVillageSuggestions(true)}
                    className="w-full px-3 py-2 bg-slate-50 border border-blue-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showVillageSuggestions && villageInput && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                      {villageOptions
                        .filter(v => v.toLowerCase().startsWith(villageInput.toLowerCase()))
                        .map((village) => (
                          <button
                            key={village}
                            onClick={() => {
                              setSelectedVillage(village);
                              setVillageInput(village);
                              setShowVillageSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                          >
                            {village}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedVillage && (
                    <button
                      onClick={() => {
                        setSelectedVillage("");
                        setVillageInput("");
                      }}
                      className="absolute right-2 top-8 text-slate-400 hover:text-slate-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {/* City Filter */}
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Type city name..."
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      setShowCitySuggestions(true);
                    }}
                    onFocus={() => setShowCitySuggestions(true)}
                    className="w-full px-3 py-2 bg-slate-50 border border-blue-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showCitySuggestions && cityInput && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                      {cityOptions
                        .filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase()))
                        .map((city) => (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedCity(city);
                              setCityInput(city);
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                          >
                            {city}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedCity && (
                    <button
                      onClick={() => {
                        setSelectedCity("");
                        setCityInput("");
                      }}
                      className="absolute right-2 top-8 text-slate-400 hover:text-slate-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {/* State Filter */}
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Type state name..."
                    value={stateInput}
                    onChange={(e) => {
                      setStateInput(e.target.value);
                      setShowStateSuggestions(true);
                    }}
                    onFocus={() => setShowStateSuggestions(true)}
                    className="w-full px-3 py-2 bg-slate-50 border border-blue-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showStateSuggestions && stateInput && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                      {stateOptions
                        .filter(s => s.toLowerCase().startsWith(stateInput.toLowerCase()))
                        .map((state) => (
                          <button
                            key={state}
                            onClick={() => {
                              setSelectedState(state);
                              setStateInput(state);
                              setShowStateSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                          >
                            {state}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedState && (
                    <button
                      onClick={() => {
                        setSelectedState("");
                        setStateInput("");
                      }}
                      className="absolute right-2 top-8 text-slate-400 hover:text-slate-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total", count: requests.length, color: "bg-blue-50 border-blue-200 text-blue-700" },
                { label: "Pending", count: requests.filter(r => r.status === "Pending").length, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                { label: "In Progress", count: requests.filter(r => r.status === "In Progress").length, color: "bg-purple-50 border-purple-200 text-purple-700" },
                { label: "Completed", count: requests.filter(r => r.status === "Completed").length, color: "bg-green-50 border-green-200 text-green-700" },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.color} border rounded-xl p-4 text-center shadow-sm`}>
                  <p className="text-3xl font-bold">{stat.count}</p>
                  <p className="text-sm font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Requests Grid */}
            <div className="grid gap-4">
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-blue-100 shadow-sm">
                  <p className="text-slate-500 text-lg">No emergency wash requests found</p>
                </div>
              ) : (
                filteredRequests.map(request => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-blue-100 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {request.car_model || request.car_plate || "Car Wash"}
                        </h3>
                        <p className="text-slate-600 text-sm mt-1 flex items-center gap-1">
                          <FiMapPin size={14} /> {request.address}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        request.status === "Assigned" ? "bg-blue-100 text-blue-800" :
                        request.status === "In Progress" ? "bg-purple-100 text-purple-800" :
                        request.status === "Completed" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {request.status}
                      </span>
                    </div>

                    {request.description && (
                      <p className="text-slate-600 text-sm mb-4">{request.description}</p>
                    )}

                    <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-blue-100">
                      <span>
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.status === "Completed" && request.after_img_1 && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <FiCamera size={14} /> Photos uploaded
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Detail Modal
function DetailModal({ request, onClose, onStatusChange, onUploadClick }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-blue-200 shadow-xl">
        <div className="sticky top-0 bg-linear-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Request Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 font-medium">Car Model</p>
              <p className="font-semibold text-slate-900">{request.car_model}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Plate Number</p>
              <p className="font-semibold text-slate-900">{request.car_plate}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-600 font-medium">Address</p>
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <FiMapPin className="text-blue-600" /> {request.address}
              </p>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-sm text-slate-600 font-medium mb-2">Description</p>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-blue-100">{request.description}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-blue-100 pt-4">
            <p className="text-sm text-slate-600 font-medium mb-3">Current Status</p>
            <div className="flex flex-wrap gap-2">
              {["Pending", "Assigned", "In Progress", "Completed"].map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(request.id, status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    request.status === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Images Section */}
          {(request.before_img_1 || request.after_img_1) && (
            <div className="border-t border-blue-100 pt-4">
              <h3 className="font-semibold text-slate-900 mb-4">Service Images</h3>
              
              {/* Before Images */}
              {(request.before_img_1 || request.before_img_2 || request.before_img_3 || request.before_img_4) && (
                <div className="mb-6">
                  <p className="text-sm text-slate-600 font-medium mb-3">Before Photos</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {request.before_img_1 && (
                      <img src={request.before_img_1} alt="Before 1" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.before_img_2 && (
                      <img src={request.before_img_2} alt="Before 2" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.before_img_3 && (
                      <img src={request.before_img_3} alt="Before 3" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.before_img_4 && (
                      <img src={request.before_img_4} alt="Before 4" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                  </div>
                </div>
              )}

              {/* After Images */}
              {request.status === "Completed" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-slate-600 font-medium">After Photos</p>
                    <button
                      onClick={onUploadClick}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                    >
                      <FiCamera /> Upload
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {request.after_img_1 && (
                      <img src={request.after_img_1} alt="After 1" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.after_img_2 && (
                      <img src={request.after_img_2} alt="After 2" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.after_img_3 && (
                      <img src={request.after_img_3} alt="After 3" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                    {request.after_img_4 && (
                      <img src={request.after_img_4} alt="After 4" className="w-full h-40 object-cover rounded-lg border border-blue-100" />
                    )}
                  </div>
                  {!request.after_img_1 && (
                    <button
                      onClick={onUploadClick}
                      className="w-full border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors mt-3"
                    >
                      <FiCamera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-600">Click to upload after photos</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-blue-100 pt-4 text-xs text-slate-500 space-y-1">
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

// Image Upload Modal
function ImageUploadModal({ request, onClose, onUpload, onSubmit, uploading, images }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-blue-200 shadow-xl">
        <div className="p-6 border-b border-blue-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Upload Service Photos</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Select up to 4 photos
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUpload}
            className="w-full border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors text-slate-600"
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
              className="px-6 py-3 border border-blue-200 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
