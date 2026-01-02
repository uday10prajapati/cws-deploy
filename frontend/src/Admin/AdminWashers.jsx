import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiTrendingUp,
  FiChevronRight,
  FiArrowLeft,
  FiMap,
  FiAlertCircle,
  FiUser,
  FiTruck,
} from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";

export default function AdminWashers() {
  const navigate = useNavigate();
  const [washers, setWashers] = useState([]);
  const [filteredWashers, setFilteredWashers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWasher, setSelectedWasher] = useState(null);
  const [washerAssignedCars, setWasherAssignedCars] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userTaluko, setUserTaluko] = useState(null);
  const [userCity, setUserCity] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  
  // Filter state variables
  const [selectedTaluko, setSelectedTaluko] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [talukoInput, setTalukoInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [showTalukoSuggestions, setShowTalukoSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [talukoOptions, setTalukoOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect(["admin", "sub-admin", "hr"]);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadWashers();
    }
  }, [userRole, userTaluko, userCity]);

  const loadUser = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, taluko, city, assigned_city")
        .eq("id", auth.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        setIsSubAdmin(profile.role === "sub-admin");
        setIsHR(profile.role === "hr");
        if (profile.role === "sub-admin") {
          setUserTaluko(profile.taluko);
        } else if (profile.role === "hr") {
          setUserCity(profile.assigned_city);
        }
      }
    }
  };

  const applyFilters = (taluko, city, state) => {
    const filtered = washers.filter((washer) => {
      const talukoMatch = !taluko || washer.taluko?.toLowerCase() === taluko.toLowerCase();
      const cityMatch = !city || washer.city?.toLowerCase() === city.toLowerCase();
      const stateMatch = !state || washer.state?.toLowerCase() === state.toLowerCase();
      return talukoMatch && cityMatch && stateMatch;
    });
    setFilteredWashers(filtered);
  };

  const handleTalukoSelect = (taluko) => {
    setSelectedTaluko(taluko);
    setTalukoInput(taluko);
    setShowTalukoSuggestions(false);
    applyFilters(taluko, selectedCity, selectedState);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowCitySuggestions(false);
    applyFilters(selectedTaluko, city, selectedState);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStateInput(state);
    setShowStateSuggestions(false);
    applyFilters(selectedTaluko, selectedCity, state);
  };

  const filteredTalukas = talukoOptions.filter(t => t.toLowerCase().startsWith(talukoInput.toLowerCase()));
  const filteredCities = cityOptions.filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase()));
  const filteredStates = stateOptions.filter(s => s.toLowerCase().startsWith(stateInput.toLowerCase()));

  const loadWashers = async () => {
    setLoading(true);
    try {
      const { data: washerProfiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")
        .eq("employee_type", "washer")
        .order("created_at", { ascending: false });

      // Filter by role
      let filteredWashers = washerProfiles || [];

      if (isSubAdmin && userTaluko) {
        // Sub-admin: Show washers from their city AND taluko
        filteredWashers = filteredWashers.filter(
          (w) => w.taluko === userTaluko || w.city === userTaluko
        );
      } else if (isHR && userCity) {
        // HR: Show washers from their taluko only
        filteredWashers = filteredWashers.filter(
          (w) => w.taluko === userCity
        );
      }

      // Enrich with assigned cars count
      const enrichedWashers = await Promise.all(
        filteredWashers.map(async (washer) => {
          const { count } = await supabase
            .from("car_assignments")
            .select("*", { count: "exact" })
            .eq("assigned_to", washer.id)
            .eq("status", "active");

          return {
            ...washer,
            assignedCars: count || 0,
          };
        })
      );

      setWashers(enrichedWashers);
      setFilteredWashers(enrichedWashers);
      
      // Extract unique talukas, cities, states from washers
      const talukoSet = new Set();
      const citySet = new Set();
      const stateSet = new Set();
      
      enrichedWashers.forEach(washer => {
        if (washer.taluko) talukoSet.add(washer.taluko);
        if (washer.city) citySet.add(washer.city);
        if (washer.state) stateSet.add(washer.state);
      });
      
      setTalukoOptions(Array.from(talukoSet).sort());
      setCityOptions(Array.from(citySet).sort());
      setStateOptions(Array.from(stateSet).sort());
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWasherClick = async (washer) => {
    setSelectedWasher(washer);

    try {
      // Fetch all cars assigned to this washer
      const { data: assignments, error } = await supabase
        .from("car_assignments")
        .select("id, car_id, status, assigned_by_role, assigned_by_name, assigned_at")
        .eq("assigned_to", washer.id)
        .eq("status", "active")
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching assignments:", error);
        setWasherAssignedCars([]);
        return;
      }

      // Now fetch car details for each assignment
      if (assignments && assignments.length > 0) {
        const carIds = assignments.map(a => a.car_id);
        const { data: carsData } = await supabase
          .from("cars")
          .select("id, brand, model, number_plate, customer_id")
          .in("id", carIds);

        // Get customer details for the cars
        if (carsData && carsData.length > 0) {
          const customerIds = [...new Set(carsData.map(c => c.customer_id))];
          const { data: customersData } = await supabase
            .from("profiles")
            .select("id, name, phone, city, taluko")
            .in("id", customerIds);

          const customerMap = {};
          (customersData || []).forEach(cust => {
            customerMap[cust.id] = cust;
          });

          const carMap = {};
          (carsData || []).forEach(car => {
            carMap[car.id] = {
              ...car,
              owner: customerMap[car.customer_id] || {}
            };
          });

          const enrichedAssignments = assignments.map(a => ({
            ...a,
            car: carMap[a.car_id] || {}
          }));

          setWasherAssignedCars(enrichedAssignments);
        }
      } else {
        setWasherAssignedCars([]);
      }
    } catch (err) {
      console.error("Exception fetching assignments:", err);
      setWasherAssignedCars([]);
    }
  };

  const renderContent = () => {
    if (selectedWasher) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedWasher(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
            >
              <FiArrowLeft className="text-xl" />
              Back to Washers
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Washer Details</h1>
            <div></div>
          </div>

          {/* Washer Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Washer Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center text-3xl font-bold text-white">
                  {selectedWasher.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedWasher.name}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Washer ID: {selectedWasher.id.slice(0, 8)}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Location Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <FiMail className="text-blue-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="text-slate-900 font-medium">
                      {selectedWasher.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="text-green-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">Phone</p>
                    <p className="text-slate-900 font-medium">
                      {selectedWasher.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-purple-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">City</p>
                    <p className="text-slate-900 font-semibold">
                      {selectedWasher.city || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-pink-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">Taluko</p>
                    <p className="text-slate-900 font-semibold">
                      {selectedWasher.taluko || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-xs text-slate-600 mb-1 font-semibold">
                    Assigned Cars
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {washerAssignedCars.length}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1 font-semibold">
                    Member Since
                  </p>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(selectedWasher.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Status Card */}
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="font-semibold text-emerald-700">Active</p>
                </div>
                <p className="text-sm text-slate-600">Status: Available</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiUser className="text-blue-600 text-lg" />
                  <p className="font-semibold text-slate-900">Role Info</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-semibold text-slate-900">Washer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Access:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedWasher.taluko}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Cars Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiTruck className="text-emerald-600 text-2xl" />
              Assigned Cars ({washerAssignedCars.length})
            </h3>

            {washerAssignedCars.length > 0 ? (
              <div className="space-y-4">
                {washerAssignedCars.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-linear-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-5 hover:shadow-lg transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Car Details */}
                      <div className="md:col-span-1">
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">
                          {assignment.car?.brand} {assignment.car?.model}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-600">
                            <span className="font-semibold">Plate:</span>{" "}
                            <span className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-semibold">
                              {assignment.car?.number_plate}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Owner Details */}
                      <div className="md:col-span-1">
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          Customer
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-900 font-semibold">
                            {assignment.car?.owner?.name}
                          </p>
                          <p className="text-slate-600">
                            {assignment.car?.owner?.phone}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="md:col-span-1">
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          Customer Address
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-900 font-semibold">
                            📍 {assignment.car?.owner?.city}
                          </p>
                          <p className="text-slate-600">
                            {assignment.car?.owner?.taluko}
                          </p>
                        </div>
                      </div>

                      {/* Assignment Info */}
                      <div className="md:col-span-1">
                        <p className="text-xs font-semibold text-slate-600 mb-2">
                          Assigned By
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-900 font-semibold">
                            {assignment.assigned_by_name}
                          </p>
                          <p className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold w-fit">
                            {assignment.assigned_by_role?.toUpperCase()}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(
                              assignment.assigned_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiTruck className="text-4xl text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">
                  No cars assigned to this washer yet
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Active Washers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and track your washers
          </p>
        </div>

        {/* LOCATION FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Taluko Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Village/Taluko
            </label>
            <input
              type="text"
              placeholder="Select or type taluko..."
              value={talukoInput}
              onChange={(e) => {
                setTalukoInput(e.target.value);
                setShowTalukoSuggestions(true);
              }}
              onFocus={() => setShowTalukoSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTalukoSuggestions(false), 150)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
            {showTalukoSuggestions && filteredTalukas.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {filteredTalukas.map((taluko) => (
                  <div
                    key={taluko}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleTalukoSelect(taluko);
                    }}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900"
                  >
                    {taluko}
                  </div>
                ))}
              </div>
            )}
            {selectedTaluko && (
              <button
                onClick={() => {
                  setSelectedTaluko("");
                  setTalukoInput("");
                  applyFilters("", selectedCity, selectedState);
                }}
                className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              City
            </label>
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
                  applyFilters(selectedTaluko, "", selectedState);
                }}
                className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              State
            </label>
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
                  applyFilters(selectedTaluko, selectedCity, "");
                }}
                className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Total Washers
            </p>
            <p className="text-3xl font-bold text-emerald-600">{filteredWashers.length}</p>
          </div>
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">Active</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredWashers.filter((w) => w.account_status === "active").length}
            </p>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Assigned Cars
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {filteredWashers.reduce((sum, w) => sum + (w.assignedCars || 0), 0)}
            </p>
          </div>
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Approved
            </p>
            <p className="text-3xl font-bold text-amber-600">
              {filteredWashers.filter((w) => w.approval_status === "approved").length}
            </p>
          </div>
        </div>

        {/* Washers List */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading washers...</p>
            </div>
          ) : filteredWashers.length === 0 ? (
            <div className="p-12 text-center">
              <FiAlertCircle className="text-4xl text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No washers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredWashers.map((washer) => (
                <div
                  key={washer.id}
                  onClick={() => handleWasherClick(washer)}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500 group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center font-bold text-white">
                        {washer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg group-hover:text-emerald-600">
                          {washer.name}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <FiPhone className="text-xs" />
                            {washer.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMapPin className="text-xs" />
                            {washer.taluko} {washer.city && `(${washer.city})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              washer.account_status === "active"
                                ? "bg-green-500"
                                : "bg-slate-400"
                            }`}
                          ></div>
                          <span
                            className={`text-xs font-medium ${
                              washer.account_status === "active"
                                ? "text-green-600"
                                : "text-slate-600"
                            }`}
                          >
                            {washer.account_status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-emerald-600 font-semibold">
                          {washer.assignedCars} car(s)
                        </p>
                      </div>

                      <FiChevronRight className="text-2xl text-slate-400 group-hover:text-emerald-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
