import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiClock, FiUser, FiPhone, FiMapPin, FiCamera, FiEdit2, FiSearch, FiX, FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import NavbarNew from "../components/NavbarNew";

export default function AdminEmergencyWashManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState({
    after_img_1: null,
    after_img_2: null,
    after_img_3: null,
    after_img_4: null,
  });
  const [selectedTaluko, setSelectedTaluko] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [talukoInput, setTalukoInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [talukoOptions, setTalukoOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [showTalukoSuggestions, setShowTalukoSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  
  // Assignment state
  const [selectedRequestForAssignment, setSelectedRequestForAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableWashers, setAvailableWashers] = useState([]);
  const [assigningWasher, setAssigningWasher] = useState(false);

  // Fetch emergency wash requests and location options
  useEffect(() => {
    fetchRequests();
    fetchLocationOptions();
  }, []);

  const fetchLocationOptions = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("taluko, city, state");

      if (profiles) {
        const talukos = [...new Set(profiles.map(p => p.taluko).filter(Boolean))];
        const cities = [...new Set(profiles.map(p => p.city).filter(Boolean))];
        const states = [...new Set(profiles.map(p => p.state).filter(Boolean))];
        
        setTalukoOptions(talukos.sort());
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

      // Fetch customer profile data for each request to get city info
      const requestsWithUserData = await Promise.all(
        (data || []).map(async (request) => {
          try {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("city, area, taluko, state")
              .eq("id", request.user_id)
              .single();
            
            return {
              ...request,
              customer_city: userProfile?.city || request.city,
              customer_area: userProfile?.area,
              customer_taluko: userProfile?.taluko,
              customer_state: userProfile?.state,
            };
          } catch (err) {
            console.warn("Error fetching user profile:", err);
            return request;
          }
        })
      );

      setRequests(requestsWithUserData);
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

  // Fetch washers by matching customer taluko with washer taluko/area
  const fetchWashersByTaluko = async (taluko) => {
    try {
      console.log("🔍 Searching for washers with taluko:", taluko);
      
      const response = await fetch(
        `http://localhost:5000/washers/match-customer-city/${encodeURIComponent(taluko)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("📊 API Response:", data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        console.log("✅ Found washers:", data.length);
        setAvailableWashers(data);
        if (data.length === 0) {
          console.warn("⚠️ No washers found for taluko:", taluko);
          alert(`No washers found for taluko: "${taluko}"\n\nPlease ensure:\n1. Washers have their taluko field filled in their profile\n2. The washer's taluko matches: "${taluko}"\n3. Washer account is active`);
        }
      } else if (data && typeof data === 'object') {
        // Check if it's an error response
        if (data.success === false) {
          console.error("❌ API returned error:", data.error);
          setAvailableWashers([]);
          alert("Error fetching washers for taluko '" + taluko + "':\n" + (data.error || "Unknown error"));
        } else if (Array.isArray(data.data)) {
          // Handle wrapper response
          console.log("✅ Found washers (wrapped):", data.data.length);
          setAvailableWashers(data.data);
          if (data.data.length === 0) {
            alert(`No washers found for taluko: "${taluko}"`);
          }
        } else {
          console.warn("⚠️ Unexpected response format:", data);
          setAvailableWashers([]);
          alert(`No washers available for taluko: "${taluko}"`);
        }
      } else {
        console.warn("⚠️ Unexpected response type:", typeof data);
        setAvailableWashers([]);
        alert(`No washers available for taluko: "${taluko}"`);
      }
    } catch (error) {
      console.error("❌ Error fetching washers:", error);
      setAvailableWashers([]);
      alert("Failed to fetch washers for taluko '" + taluko + "':\n" + error.message);
    }
  };

  // Handle request selection for assignment
  const handleSelectRequest = async (request) => {
    setSelectedRequestForAssignment(request);
    // Use customer's taluko to find washers
    const talukoToSearch = request.customer_taluko || request.taluko;
    
    console.log("📍 Request taluko info:", {
      customer_taluko: request.customer_taluko,
      request_taluko: request.taluko,
      searching_for: talukoToSearch
    });
    
    if (talukoToSearch) {
      await fetchWashersByTaluko(talukoToSearch);
    } else {
      alert("❌ Unable to find taluko/area information for this request.\n\nRequest data:\n" + 
        "Customer Taluko: " + (request.customer_taluko || "N/A") + "\n" +
        "Request Taluko: " + (request.taluko || "N/A"));
    }
    setShowAssignmentModal(true);
  };

  // Assign wash to washer
  const assignWashToWasher = async (washer) => {
    if (!selectedRequestForAssignment) return;

    try {
      setAssigningWasher(true);
      
      console.log("🚀 Assigning request to washer:", {
        requestId: selectedRequestForAssignment.id,
        washerId: washer.id,
        washerName: washer.name
      });

      // Update request status in database
      const { error: updateError } = await supabase
        .from("emergency_wash_requests")
        .update({
          status: "Assigned",
          assigned_to: washer.id,
          updated_at: new Date(),
        })
        .eq("id", selectedRequestForAssignment.id);

      console.log("💾 Update response - Error:", updateError);
      
      if (updateError) {
        console.error("❌ Update failed:", updateError);
        throw updateError;
      }

      console.log("✅ Request updated successfully!");

      // Update local state - change status to "Assigned"
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequestForAssignment.id
            ? { ...req, status: "Assigned", assigned_to: washer.id }
            : req
        )
      );

      alert(`Wash assigned to ${washer.name} successfully!`);
      
      // Close modal and reset state
      setShowAssignmentModal(false);
      setSelectedRequestForAssignment(null);
      setAvailableWashers([]);
      
      // Refresh from database to verify the update worked
      setTimeout(() => {
        console.log("🔄 Refreshing requests from database to verify...");
        fetchRequests();
      }, 800);
      
    } catch (error) {
      console.error("❌ Error assigning wash:", error);
      alert(`Failed to assign wash: ${error.message}`);
    } finally {
      setAssigningWasher(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesSearch = searchTerm === "" ||
      req.car_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.car_model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTaluko = selectedTaluko === "" || req.taluko === selectedTaluko;
    const matchesCity = selectedCity === "" || req.city === selectedCity;
    const matchesState = selectedState === "" || req.state === selectedState;

    return matchesStatus && matchesSearch && matchesTaluko && matchesCity && matchesState;
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
                {/* Taluko Filter */}
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Taluko</label>
                  <input
                    type="text"
                    placeholder="Type taluko name..."
                    value={talukoInput}
                    onChange={(e) => {
                      setTalukoInput(e.target.value);
                      setShowTalukoSuggestions(true);
                    }}
                    onFocus={() => setShowTalukoSuggestions(true)}
                    className="w-full px-3 py-2 bg-slate-50 border border-blue-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showTalukoSuggestions && talukoInput && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                      {talukoOptions
                        .filter(t => t.toLowerCase().startsWith(talukoInput.toLowerCase()))
                        .map((taluko) => (
                          <button
                            key={taluko}
                            onClick={() => {
                              setSelectedTaluko(taluko);
                              setTalukoInput(taluko);
                              setShowTalukoSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                          >
                            {taluko}
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedTaluko && (
                    <button
                      onClick={() => {
                        setSelectedTaluko("");
                        setTalukoInput("");
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
                        <p className="text-slate-500 text-xs mt-2">
                          <span className="font-medium">Customer:</span> {request.customer_name || "N/A"} | <span className="font-medium">Taluko:</span> {request.customer_taluko || request.taluko || "N/A"}
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

                    {/* Assign Button */}
                    {request.status === "Pending" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRequest(request);
                        }}
                        className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <FiUser className="w-5 h-5" />
                        Assign to Washer
                      </button>
                    )}
                    {request.status === "Assigned" && (
                      <button disabled className="mt-4 w-full px-4 py-3 bg-gray-400 text-white rounded-lg font-semibold text-center">
                        Assigned
                      </button>
                    )}
                    {request.status === "In Progress" && (
                      <button disabled className="mt-4 w-full px-4 py-3 bg-purple-400 text-white rounded-lg font-semibold text-center">
                        In Progress
                      </button>
                    )}
                    {request.status === "Completed" && (
                      <button disabled className="mt-4 w-full px-4 py-3 bg-green-400 text-white rounded-lg font-semibold text-center">
                        Completed
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedRequestForAssignment && (
        <AssignmentModal
          request={selectedRequestForAssignment}
          washers={availableWashers}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedRequestForAssignment(null);
            setAvailableWashers([]);
          }}
          onAssign={assignWashToWasher}
          assigning={assigningWasher}
        />
      )}
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
          {/* Customer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Customer Information</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600 font-medium">Name</p>
                <p className="text-slate-900">{request.customer_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Phone</p>
                <p className="text-slate-900">{request.customer_phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Taluko/Area</p>
                <p className="text-slate-900 font-semibold text-blue-700">{request.customer_taluko || request.taluko || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Area</p>
                <p className="text-slate-900">{request.area || "N/A"}</p>
              </div>
            </div>
          </div>

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

// Assignment Modal Component
function AssignmentModal({ request, washers, onClose, onAssign, assigning }) {
  if (!washers || washers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full border border-blue-200 shadow-xl">
          <div className="p-6 border-b border-blue-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Select Washer</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl">✕</button>
          </div>
          <div className="p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">No washers available in this area</p>
            <p className="text-slate-500 text-sm mb-6">
              Location: {request.address}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-blue-200 shadow-xl">
        <div className="sticky top-0 bg-linear-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select Washer</h2>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-semibold">Request City:</span> {request.customer_city || request.city || "N/A"}
            </p>
            {request.customer_area && (
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-semibold">Area:</span> {request.customer_area}
              </p>
            )}
            {request.customer_taluko && (
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-semibold">Taluko:</span> {request.customer_taluko}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-semibold">Address:</span> {request.address}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {washers.map(washer => (
            <div
              key={washer.id}
              className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{washer.name}</h3>
                  <p className="text-slate-600 text-sm flex items-center gap-1 mt-1">
                    <FiPhone size={14} /> {washer.phone}
                  </p>
                  <p className="text-slate-600 text-sm flex items-center gap-1 mt-1">
                    <FiMapPin size={14} /> {washer.address}
                  </p>
                  {washer.taluko && (
                    <p className="text-slate-600 text-sm mt-1">
                      <span className="font-medium">Taluko:</span> {washer.taluko}
                    </p>
                  )}
                  {washer.area && (
                    <p className="text-slate-600 text-sm mt-1">
                      <span className="font-medium">Area:</span> {washer.area}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-yellow-500 font-semibold text-lg">★ {washer.rating || "N/A"}</div>
                  <p className="text-slate-600 text-xs">Rating</p>
                </div>
              </div>

              <button
                onClick={() => onAssign(washer)}
                disabled={assigning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <FiCheck size={18} />
                    Assign This Washer
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
