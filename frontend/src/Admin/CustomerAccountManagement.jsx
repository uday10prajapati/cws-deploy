import React, { useEffect, useState } from "react";
import {
  FiTrendingUp,
  FiDollarSign,
  FiBell,
  FiAlertCircle,
  FiSearch,
  FiCheck,
  FiX,
  FiClock,
  FiEye,
  FiSettings,
  FiMapPin,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

export default function CustomerAccountManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // State for customer management
  const [activeTab, setActiveTab] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Location filter states
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [villageOptions, setVillageOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [villageInput, setVillageInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  useRoleBasedRedirect("admin");

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/account-status/summary`);
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, []);

  // Fetch customers based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab, filterStatus, searchTerm, selectedVillage, selectedCity, selectedState]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      let queryParams = new URLSearchParams();

      if (activeTab === "all") {
        endpoint = `/account-status/customers`;
      } else if (activeTab === "pending") {
        endpoint = `/account-status/pending-requests`;
      }

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (filterStatus !== "all" && activeTab === "all") {
        queryParams.append("status", filterStatus);
      }

      const query = queryParams.toString()
        ? `?${queryParams.toString()}`
        : "";
      const res = await fetch(`${API_URL}${endpoint}${query}`);
      const data = await res.json();

      if (data.success) {
        let customersData = activeTab === "all" ? (data.customers || []) : (data.pending_requests || []);
        
        // Fetch profile location data for all customers
        const customerIds = customersData.map(c => c.id);
        if (customerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, village, city, state")
            .in("id", customerIds);

          const profileMap = {};
          (profilesData || []).forEach(profile => {
            profileMap[profile.id] = profile;
          });

          // Enrich customers with location data
          customersData = customersData.map(customer => ({
            ...customer,
            village: profileMap[customer.id]?.village || "",
            city: profileMap[customer.id]?.city || "",
            state: profileMap[customer.id]?.state || "",
          }));

          // Extract unique locations
          const villageSet = new Set();
          const citySet = new Set();
          const stateSet = new Set();

          customersData.forEach(customer => {
            if (customer.village) villageSet.add(customer.village);
            if (customer.city) citySet.add(customer.city);
            if (customer.state) stateSet.add(customer.state);
          });

          setVillageOptions(Array.from(villageSet).sort());
          setCityOptions(Array.from(citySet).sort());
          setStateOptions(Array.from(stateSet).sort());
        }

        // Apply location filters
        customersData = customersData.filter(customer => {
          const villageMatch = !selectedVillage || customer.village === selectedVillage;
          const cityMatch = !selectedCity || customer.city === selectedCity;
          const stateMatch = !selectedState || customer.state === selectedState;
          return villageMatch && cityMatch && stateMatch;
        });

        if (activeTab === "all") {
          setCustomers(customersData);
        } else if (activeTab === "pending") {
          setPendingRequests(customersData);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details
  const fetchCustomerDetail = async (customerId) => {
    try {
      const res = await fetch(
        `${API_URL}/account-status/customer/${customerId}`
      );
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(data.customer);
        setShowDetail(true);
      }
    } catch (err) {
      console.error("Error fetching customer detail:", err);
    }
  };

  // Handle activate customer
  const handleActivate = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/activate/${customerId}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(`✅ ${customerName} has been activated`);
        await fetchData();
        await fetchSummary();
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to activate customer");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle deactivate customer
  const handleDeactivate = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/deactivate/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: deactivateReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(`❌ ${customerName} has been deactivated`);
        await fetchData();
        await fetchSummary();
        setDeactivateReason("");
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to deactivate customer");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve deactivation request
  const handleApproveDeactivation = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/approve-deactivate/${customerId}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(
          `✅ Deactivation approved for ${customerName}`
        );
        await fetchData();
        await fetchSummary();
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to approve deactivation");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject deactivation request
  const handleRejectDeactivation = async (customerId, customerName) => {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const res = await fetch(
        `${API_URL}/account-status/admin/reject-deactivate/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setActionSuccess(
          `✅ Deactivation request rejected for ${customerName}`
        );
        await fetchData();
        await fetchSummary();
        setRejectReason("");
        setShowRejectModal(false);
        setTimeout(() => {
          setShowDetail(false);
          setSelectedCustomer(null);
        }, 1500);
      } else {
        setActionError(data.error || "Failed to reject deactivation");
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            ✅ Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            ❌ Inactive
          </span>
        );
      case "deactivate_requested":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            ⏳ Pending Approval
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleVillageSelect = (village) => {
    setSelectedVillage(village);
    setVillageInput(village);
    setShowVillageSuggestions(false);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowCitySuggestions(false);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStateInput(state);
    setShowStateSuggestions(false);
  };

  const filteredVillages = villageOptions.filter(v =>
    v.toLowerCase().startsWith(villageInput.toLowerCase())
  );
  const filteredCities = cityOptions.filter(c =>
    c.toLowerCase().startsWith(cityInput.toLowerCase())
  );
  const filteredStates = stateOptions.filter(s =>
    s.toLowerCase().startsWith(stateInput.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-slate-600 text-sm mb-1 font-semibold">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {summary.total_customers}
                  </p>
                </div>
                <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <p className="text-slate-600 text-sm mb-1 font-semibold">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {summary.active}
                  </p>
                  <p className="text-xs text-slate-500">
                    {summary.active_percentage}
                  </p>
                </div>
                <div className="bg-linear-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                  <p className="text-slate-600 text-sm mb-1 font-semibold">Inactive</p>
                  <p className="text-3xl font-bold text-red-600">
                    {summary.inactive}
                  </p>
                </div>
                <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-slate-600 text-sm mb-1 font-semibold">
                    Pending Deactivation
                  </p>
                  <p className="text-3xl font-bold text-amber-600">
                    {summary.pending_deactivation}
                  </p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setFilterStatus("all");
                }}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === "all"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                📋 All Customers
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 font-medium border-b-2 transition flex items-center gap-2 ${
                  activeTab === "pending"
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                ⏳ Pending Requests
                {summary && summary.pending_deactivation > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {summary.pending_deactivation}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Filter */}
            {activeTab === "all" && (
              <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm transition"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex gap-4 flex-wrap">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm transition"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Location Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Village Filter */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Village</label>
                    <input
                      type="text"
                      placeholder="Select or type village..."
                      value={villageInput}
                      onChange={(e) => {
                        setVillageInput(e.target.value);
                        setShowVillageSuggestions(true);
                      }}
                      onFocus={() => setShowVillageSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowVillageSuggestions(false), 150)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    {showVillageSuggestions && filteredVillages.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredVillages.map((village) => (
                          <div
                            key={village}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleVillageSelect(village);
                            }}
                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900"
                          >
                            {village}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedVillage && (
                      <button
                        onClick={() => {
                          setSelectedVillage("");
                          setVillageInput("");
                        }}
                        className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* City Filter */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      placeholder="Select or type city..."
                      value={cityInput}
                      onChange={(e) => {
                        setCityInput(e.target.value);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredCities.map((city) => (
                          <div
                            key={city}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCitySelect(city);
                            }}
                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900"
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedCity && (
                      <button
                        onClick={() => {
                          setSelectedCity("");
                          setCityInput("");
                        }}
                        className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* State Filter */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                    <input
                      type="text"
                      placeholder="Select or type state..."
                      value={stateInput}
                      onChange={(e) => {
                        setStateInput(e.target.value);
                        setShowStateSuggestions(true);
                      }}
                      onFocus={() => setShowStateSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowStateSuggestions(false), 150)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    {showStateSuggestions && filteredStates.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredStates.map((state) => (
                          <div
                            key={state}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleStateSelect(state);
                            }}
                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900"
                          >
                            {state}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedState && (
                      <button
                        onClick={() => {
                          setSelectedState("");
                          setStateInput("");
                        }}
                        className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content Area */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <FiSettings className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-slate-600 mt-2">Loading customers...</p>
              </div>
            ) : activeTab === "all" ? (
              <div className="space-y-3">
                {customers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <FiAlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No customers found</p>
                  </div>
                ) : (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => fetchCustomerDetail(customer.id)}
                      className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                            {customer.name}
                          </h3>
                          <p className="text-sm text-slate-600">{customer.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            📞 {customer.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(customer.account_status)}
                          <p className="text-xs text-slate-500 mt-2">
                            Joined: {formatDate(customer.created_at)}
                          </p>
                        </div>
                      </div>
                      {/* Location Info */}
                      {(customer.village || customer.city || customer.state) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                          <FiMapPin className="text-blue-600 shrink-0" />
                          <span>
                            {[customer.village, customer.city, customer.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <FiCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-slate-600">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => fetchCustomerDetail(request.id)}
                      className="bg-white border border-amber-200 rounded-lg p-4 hover:border-amber-500 hover:shadow-md cursor-pointer transition group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition">
                            {request.name}
                          </h3>
                          <p className="text-sm text-slate-600">{request.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            📞 {request.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            ⏳ Pending Approval
                          </span>
                          <p className="text-xs text-slate-500 mt-2">
                            Requested: {formatDate(request.updated_at)}
                          </p>
                        </div>
                      </div>
                      {/* Location Info */}
                      {(request.village || request.city || request.state) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                          <FiMapPin className="text-blue-600 shrink-0" />
                          <span>
                            {[request.village, request.city, request.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>

      {/* Detail Modal */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedCustomer(null);
                  setActionSuccess("");
                  setActionError("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Messages */}
              {actionSuccess && (
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                  {actionError}
                </div>
              )}

              {/* Customer Info */}
              <div>
                <p className="text-slate-600 text-sm mb-1 font-semibold">Email</p>
                <p className="text-slate-900">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1 font-semibold">Phone</p>
                <p className="text-slate-900">{selectedCustomer.phone}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1 font-semibold">Status</p>
                {getStatusBadge(selectedCustomer.account_status)}
              </div>

              {/* Location Info */}
              {(selectedCustomer.village || selectedCustomer.city || selectedCustomer.state) && (
                <div>
                  <p className="text-slate-600 text-sm mb-2 font-semibold">📍 Location</p>
                  <div className="space-y-1 text-sm text-slate-700">
                    {selectedCustomer.village && (
                      <p>🏘️ Village: <span className="font-medium">{selectedCustomer.village}</span></p>
                    )}
                    {selectedCustomer.city && (
                      <p>🏙️ City: <span className="font-medium">{selectedCustomer.city}</span></p>
                    )}
                    {selectedCustomer.state && (
                      <p>📍 State: <span className="font-medium">{selectedCustomer.state}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Info */}
              {selectedCustomer.activity && (
                <div>
                  <p className="text-slate-600 text-sm mb-2 font-semibold">Activity</p>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p>📋 Total Bookings: {selectedCustomer.activity.total_bookings}</p>
                    <p>✅ Completed: {selectedCustomer.activity.completed_bookings}</p>
                    {selectedCustomer.activity.last_booking_date && (
                      <p>📅 Last Booking: {formatDate(selectedCustomer.activity.last_booking_date)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                {selectedCustomer.account_status === "active" && (
                  <button
                    onClick={() =>
                      handleDeactivate(selectedCustomer.id, selectedCustomer.name)
                    }
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    ❌ Deactivate Account
                  </button>
                )}

                {selectedCustomer.account_status === "inactive" && (
                  <button
                    onClick={() =>
                      handleActivate(selectedCustomer.id, selectedCustomer.name)
                    }
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 border border-green-300 text-green-700 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    ✅ Activate Account
                  </button>
                )}

                {selectedCustomer.account_status === "deactivate_requested" && (
                  <>
                    <button
                      onClick={() =>
                        handleApproveDeactivation(
                          selectedCustomer.id,
                          selectedCustomer.name
                        )
                      }
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 border border-green-300 text-green-700 rounded-lg transition disabled:opacity-50 font-medium"
                    >
                      ✅ Approve Deactivation
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 rounded-lg transition disabled:opacity-50 font-medium"
                    >
                      ❌ Reject Request
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedCustomer(null);
                    setActionSuccess("");
                    setActionError("");
                  }}
                  className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Reject Deactivation Request</h3>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-red-500"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleRejectDeactivation(
                      selectedCustomer.id,
                      selectedCustomer.name
                    )
                  }
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 rounded-lg transition disabled:opacity-50 font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
