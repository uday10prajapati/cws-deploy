import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw, FiFilter, FiLogOut } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function AllBookings() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [villageSearch, setVillageSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [villageSuggestions, setVillageSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  useRoleBasedRedirect("admin");
  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/recent-bookings");
      const result = await response.json();
      console.log("API Response:", result); // Debug: Check API response
      
      if (result.success && result.data) {
        // Fetch profiles for each booking to get customer details
        const bookingsWithProfiles = await Promise.all(
          result.data.map(async (booking) => {
            try {
              console.log("Processing booking:", booking); // Debug: Check booking structure
              
              // Try to get profile from Supabase if customer_id exists
              if (booking.customer_id) {
                console.log("Fetching profile for customer_id:", booking.customer_id);
                
                const { data: profile, error } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", booking.customer_id)
                  .single();

                console.log("Profile result:", { profile, error }); // Debug: Check profile fetch

                if (profile && !error) {
                  const enrichedBooking = {
                    ...booking,
                    customer_name: profile.full_name || profile.name || booking.customer_name || "N/A",
                    village: profile.village || booking.village || "",
                    city: profile.city || booking.city || "",
                    state: profile.state || booking.state || "",
                    location: profile.city || booking.location || "",
                  };
                  console.log("Enriched booking:", enrichedBooking);
                  return enrichedBooking;
                }
              }
              console.log("Returning original booking (no profile):", booking);
              return booking;
            } catch (error) {
              console.error("Error fetching profile:", error);
              return booking;
            }
          })
        );
        console.log("Final bookings with profiles:", bookingsWithProfiles);
        setBookings(bookingsWithProfiles);
      } else {
        console.error("API response not successful or no data:", result);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    // Use profile data for filtering
    const villageValue = booking.village || "";
    const cityValue = booking.city || booking.location || "";
    const stateValue = booking.state || "";

    const matchesVillage =
      !villageSearch.trim() ||
      villageValue.toLowerCase().includes(villageSearch.toLowerCase());
    
    const matchesCity =
      !citySearch.trim() ||
      cityValue.toLowerCase().includes(citySearch.toLowerCase());
    
    const matchesState =
      !stateSearch.trim() ||
      stateValue.toLowerCase().includes(stateSearch.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter;

    return matchesVillage && matchesCity && matchesState && matchesStatus;
  });

  // Generate village suggestions
  const generateVillageSuggestions = (input) => {
    if (!input.trim()) {
      setVillageSuggestions([]);
      return;
    }

    const lowerInput = input.toLowerCase();
    const uniqueSuggestions = new Set();

    bookings.forEach((booking) => {
      const village = booking.village || "";
      if (village.toLowerCase().includes(lowerInput)) {
        uniqueSuggestions.add(village);
      }
    });

    setVillageSuggestions(Array.from(uniqueSuggestions).sort());
  };

  // Generate city suggestions
  const generateCitySuggestions = (input) => {
    if (!input.trim()) {
      setCitySuggestions([]);
      return;
    }

    const lowerInput = input.toLowerCase();
    const uniqueSuggestions = new Set();

    bookings.forEach((booking) => {
      const city = booking.city || booking.location || "";
      if (city.toLowerCase().includes(lowerInput)) {
        uniqueSuggestions.add(city);
      }
    });

    setCitySuggestions(Array.from(uniqueSuggestions).sort());
  };

  // Generate state suggestions
  const generateStateSuggestions = (input) => {
    if (!input.trim()) {
      setStateSuggestions([]);
      return;
    }

    const lowerInput = input.toLowerCase();
    const uniqueSuggestions = new Set();

    bookings.forEach((booking) => {
      const state = booking.state || "";
      if (state.toLowerCase().includes(lowerInput)) {
        uniqueSuggestions.add(state);
      }
    });

    setStateSuggestions(Array.from(uniqueSuggestions).sort());
  };

  const handleVillageChange = (e) => {
    const value = e.target.value;
    setVillageSearch(value);
    generateVillageSuggestions(value);
    setShowVillageSuggestions(true);
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setCitySearch(value);
    generateCitySuggestions(value);
    setShowCitySuggestions(true);
  };

  const handleStateChange = (e) => {
    const value = e.target.value;
    setStateSearch(value);
    generateStateSuggestions(value);
    setShowStateSuggestions(true);
  };

  const handleVillageSuggestionClick = (suggestion) => {
    setVillageSearch(suggestion);
    setVillageSuggestions([]);
    setShowVillageSuggestions(false);
  };

  const handleCitySuggestionClick = (suggestion) => {
    setCitySearch(suggestion);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleStateSuggestionClick = (suggestion) => {
    setStateSearch(suggestion);
    setStateSuggestions([]);
    setShowStateSuggestions(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      Confirmed: "bg-blue-100 text-blue-700 border-blue-300",
      "In Progress": "bg-purple-100 text-purple-700 border-purple-300",
      Completed: "bg-green-100 text-green-700 border-green-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">All Bookings</h1>
            <p className="text-slate-600">Manage and track all service bookings</p>
          </div>
          <button
            onClick={loadBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* VILLAGE SEARCH */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-2">🏘️ Village</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search village..."
                  value={villageSearch}
                  onChange={handleVillageChange}
                  onFocus={() => villageSearch && setShowVillageSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowVillageSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                
                {/* VILLAGE SUGGESTIONS */}
                {showVillageSuggestions && villageSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {villageSuggestions.slice(0, 8).map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleVillageSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-slate-900 text-sm border-b border-slate-200 last:border-b-0 transition"
                      >
                        <span className="font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CITY SEARCH */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-2">🏙️ City</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={handleCityChange}
                  onFocus={() => citySearch && setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                
                {/* CITY SUGGESTIONS */}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {citySuggestions.slice(0, 8).map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCitySuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-slate-900 text-sm border-b border-slate-200 last:border-b-0 transition"
                      >
                        <span className="font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STATE SEARCH */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-2">🏛️ State</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search state..."
                  value={stateSearch}
                  onChange={handleStateChange}
                  onFocus={() => stateSearch && setShowStateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                
                {/* STATE SUGGESTIONS */}
                {showStateSuggestions && stateSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {stateSuggestions.slice(0, 8).map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleStateSuggestionClick(suggestion)}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-slate-900 text-sm border-b border-slate-200 last:border-b-0 transition"
                      >
                        <span className="font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STATUS FILTER */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">✓ Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          
          {/* RESULTS COUNT */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 font-medium">
              📊 Showing <span className="text-blue-600 font-bold">{filteredBookings.length}</span> of <span className="font-bold">{bookings.length}</span> bookings
            </p>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 font-medium">Loading bookings...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Customer Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Car</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Service</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-600">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{booking.customer_name || booking.customer || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{booking.car_name || booking.car || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {Array.isArray(booking.services) ? booking.services[0] : booking.services || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {booking.date} {booking.time}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          ₹{(booking.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
