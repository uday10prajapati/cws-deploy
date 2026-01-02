import React, { useState, useEffect } from "react";
import {
  Check,
  Clock,
  X,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
  Search,
} from "lucide-react";
import NavbarNew from "../components/NavbarNew";
import { FiMapPin } from "react-icons/fi";
import { supabase } from "../supabaseClient";

const AdminWashDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total_washes: 0,
    washed: 0,
    pending: 0,
    cancelled: 0,
    total_bookings: 0,
    booked_but_not_washed: 0,
    wash_completion_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings with wash status
      const res = await fetch("http://localhost:5000/bookings/admin/all-with-status");
      const bookingsData = await res.json();

      // Fetch statistics
      const statsRes = await fetch(
        "http://localhost:5000/bookings/stats/wash-summary"
      );
      const statsData = await statsRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.bookings);

        // Fetch customer profile data to get location from profiles table
        const customerIds = [...new Set((bookingsData.bookings || []).map(b => b.customer_id))];
        if (customerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, village, city, state")
            .in("id", customerIds);

          const profileMap = {};
          (profilesData || []).forEach(profile => {
            profileMap[profile.id] = profile;
          });

          // Enrich bookings with customer location data
          const enrichedBookings = bookingsData.bookings.map(booking => ({
            ...booking,
            customer_village: profileMap[booking.customer_id]?.village || "",
            customer_city: profileMap[booking.customer_id]?.city || "",
            customer_state: profileMap[booking.customer_id]?.state || "",
          }));

          setBookings(enrichedBookings);

          // Extract unique villages, cities, states from profiles
          const villageSet = new Set();
          const citySet = new Set();
          const stateSet = new Set();

          enrichedBookings.forEach(booking => {
            if (booking.customer_village) villageSet.add(booking.customer_village);
            if (booking.customer_city) citySet.add(booking.customer_city);
            if (booking.customer_state) stateSet.add(booking.customer_state);
          });

          setVillageOptions(Array.from(villageSet).sort());
          setCityOptions(Array.from(citySet).sort());
          setStateOptions(Array.from(stateSet).sort());
        }
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "washed":
        return <Check className="text-green-500" size={20} />;
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      case "cancelled":
        return <X className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "washed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "washed":
        return "✅ Washed";
      case "pending":
        return "🔄 Pending";
      case "cancelled":
        return "❌ Cancelled";
      default:
        return "⏳ Not Started";
    }
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

  const filteredVillages = villageOptions.filter(v => v.toLowerCase().startsWith(villageInput.toLowerCase()));
  const filteredCities = cityOptions.filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase()));
  const filteredStates = stateOptions.filter(s => s.toLowerCase().startsWith(stateInput.toLowerCase()));

  const filteredBookings = bookings.filter((booking) => {
    let statusMatch = true;
    let dateMatch = true;
    let locationMatch = true;
    let searchMatch = true;

    if (filterStatus !== "all") {
      statusMatch = booking.wash_status === filterStatus;
    }

    if (filterDate) {
      const bookingDate = new Date(booking.created_at)
        .toISOString()
        .split("T")[0];
      dateMatch = bookingDate === filterDate;
    }

    if (searchTerm) {
      searchMatch =
        booking.car_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase());
    }

    if (selectedVillage || selectedCity || selectedState) {
      const villageMatch = !selectedVillage || booking.customer_village?.toLowerCase() === selectedVillage.toLowerCase();
      const cityMatch = !selectedCity || booking.customer_city?.toLowerCase() === selectedCity.toLowerCase();
      const stateMatch = !selectedState || booking.customer_state?.toLowerCase() === selectedState.toLowerCase();
      locationMatch = villageMatch && cityMatch && stateMatch;
    }

    return statusMatch && dateMatch && locationMatch && searchMatch;
  });

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className={`${color} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon size={40} className="opacity-80" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
    {/* Navbar */}
    <NavbarNew />

    <main className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
              Wash Status Dashboard 🚗
            </h1>
            <p className="text-slate-600 text-base">Real-time monitoring of all car wash bookings</p>
          </div>
        </div>

        {/* Stats Cards - Enhanced Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total Washes</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total_washes}</p>
          </div>

          <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.washed}</p>
          </div>

          <div className="bg-linear-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Completion Rate</p>
            <p className="text-3xl font-bold text-purple-600">{stats.wash_completion_rate}%</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by booking ID, car name, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
          
          {/* First Row - Status and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Wash Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              >
                <option value="all">All Status</option>
                <option value="pending">🔄 Pending</option>
                <option value="washed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>

          {/* Second Row - Location Filters */}
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              {showVillageSuggestions && filteredVillages.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredVillages.map((village) => (
                    <div
                      key={village}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedVillage(village);
                        setVillageInput(village);
                        setShowVillageSuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              {showCitySuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <div
                      key={city}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCity(city);
                        setCityInput(city);
                        setShowCitySuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              {showStateSuggestions && filteredStates.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredStates.map((state) => (
                    <div
                      key={state}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedState(state);
                        setStateInput(state);
                        setShowStateSuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
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

          {/* Reset Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterDate("");
                setSearchTerm("");
                setSelectedVillage("");
                setSelectedCity("");
                setSelectedState("");
                setVillageInput("");
                setCityInput("");
                setStateInput("");
              }}
              className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-4 py-2 font-semibold transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 text-lg">
              Bookings ({filteredBookings.length})
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="text-slate-300 mx-auto mb-4" size={48} />
              <p className="text-slate-600 text-lg">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Booking ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Car</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-t border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {booking.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{booking.car_name}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{booking.customer_name || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        <div className="flex items-center gap-1">
                          <FiMapPin size={14} className="text-blue-600" />
                          <span>
                            {[booking.customer_village, booking.customer_city, booking.customer_state]
                              .filter(Boolean)
                              .join(", ") || booking.location || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                            booking.wash_status === "washed"
                              ? "bg-green-100 text-green-700"
                              : booking.wash_status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : booking.wash_status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {booking.wash_status === "washed" && "✅"}
                          {booking.wash_status === "pending" && "🔄"}
                          {booking.wash_status === "cancelled" && "❌"}
                          {booking.wash_status.charAt(0).toUpperCase() +
                            booking.wash_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
);

};

export default AdminWashDashboard;
