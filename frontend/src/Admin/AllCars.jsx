import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiSearch, FiRefreshCw, FiMapPin } from "react-icons/fi";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { FaCar } from "react-icons/fa";
import NavbarNew from "../components/NavbarNew";

export default function AllCars() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCars, setFilteredCars] = useState([]);
  const [selectedTaluko, setSelectedTaluko] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [talukoOptions, setTalukoOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [talukoInput, setTalukoInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [showTalukoSuggestions, setShowTalukoSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [userTaluko, setUserTaluko] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);

  useRoleBasedRedirect(["admin", "sub-admin"]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get taluko and role
        const { data: profile } = await supabase
          .from("profiles")
          .select("taluko, role")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setUserTaluko(profile.taluko);
          setIsSubAdmin(profile.role === "sub-admin");
          
          // Auto-fill taluko filter for sub-admins
          if (profile.role === "sub-admin" && profile.taluko) {
            setSelectedTaluko(profile.taluko);
            setTalukoInput(profile.taluko);
          }
        }
      }
    };
    loadUser();
  }, []);

  /* LOAD ALL CARS WITH USER DETAILS */
  useEffect(() => {
    const loadCars = async () => {
      try {
        // Fetch all cars from backend API (all customer cars)
        const response = await fetch("http://localhost:5000/cars");
        const result = await response.json();

        if (!result.success || !result.cars) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        const carsData = result.cars;
        const carIds = carsData.map(c => c.id);

        if (carIds.length === 0) {
          setCars([]);
          setFilteredCars([]);
          return;
        }

        // Fetch booking stats for all cars
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, car_id, status, amount, date, location, services")
          .in("car_id", carIds);

        // Fetch customer info with location data from profiles
        const customerIds = [...new Set(carsData.map(c => c.customer_id))];
        const { data: customersData } = await supabase
          .from("profiles")
          .select("id, email, name, taluko, city, state")
          .in("id", customerIds);

        const customerMap = {};
        (customersData || []).forEach(cust => {
          customerMap[cust.id] = cust;
        });

        // Fetch monthly pass for each car
        const passMap = {};
        for (const car of carsData) {
          try {
            const passResponse = await fetch(`http://localhost:5000/pass/car/${car.id}`);
            const passResult = await passResponse.json();
            if (passResult.success && passResult.data) {
              passMap[car.id] = passResult.data;
            }
          } catch (err) {
            console.error(`Error fetching pass for car ${car.id}:`, err);
          }
        }

        // Enrich car data with stats
        const enrichedCars = carsData.map(car => {
          const carBookings = (bookingsData || []).filter(b => b.car_id === car.id);
          const customer = customerMap[car.customer_id] || {};
          return {
            ...car,
            car_name: `${car.brand} ${car.model}`.trim() || "Unknown Car",
            owner_name: customer.name || customer.email || "Unknown",
            owner_email: customer.email || "N/A",
            owner_taluko: customer.taluko || "",
            owner_city: customer.city || "",
            owner_state: customer.state || "",
            total_bookings: carBookings.length,
            completed_bookings: carBookings.filter(b => b.status === "Completed").length,
            total_revenue: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
            last_service: carBookings.length > 0 ? carBookings[0].date : null,
            locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
            status_breakdown: {
              pending: carBookings.filter(b => b.status === "Pending").length,
              confirmed: carBookings.filter(b => b.status === "Confirmed").length,
              inProgress: carBookings.filter(b => b.status === "In Progress").length,
              completed: carBookings.filter(b => b.status === "Completed").length,
            },
            monthlyPass: passMap[car.id] || null,
          };
        });

        setCars(enrichedCars);
        setFilteredCars(enrichedCars);

        // Extract unique villages, cities, states from customer profiles
        const talukoSet = new Set();
        const citySet = new Set();
        const stateSet = new Set();

        enrichedCars.forEach(car => {
          if (car.owner_taluko) talukoSet.add(car.owner_taluko);
          if (car.owner_city) citySet.add(car.owner_city);
          if (car.owner_state) stateSet.add(car.owner_state);
        });

        setTalukoOptions(Array.from(talukoSet).sort());
        setCityOptions(Array.from(citySet).sort());
        setStateOptions(Array.from(stateSet).sort());
      } catch (error) {
        console.error("Error loading cars:", error);
      }
    };

    loadCars();
  }, []);

  /* SEARCH FILTER */
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, selectedTaluko, selectedCity, selectedState);
  };

  const applyFilters = (search, taluko, city, state) => {
    const filtered = cars.filter((car) => {
      const matchSearch =
        car.car_name.toLowerCase().includes(search) ||
        car.brand?.toLowerCase().includes(search) ||
        car.model?.toLowerCase().includes(search) ||
        car.number_plate?.toLowerCase().includes(search) ||
        car.owner_name?.toLowerCase().includes(search) ||
        car.owner_email?.toLowerCase().includes(search) ||
        car.owner_taluko?.toLowerCase().includes(search) ||
        car.owner_city?.toLowerCase().includes(search) ||
        car.owner_state?.toLowerCase().includes(search) ||
        car.locations?.some(loc => loc.toLowerCase().includes(search));

      // Check location filters using profile data
      let matchLocation = true;
      if (taluko || city || state) {
        const talukoMatch = isSubAdmin 
          ? car.owner_taluko?.toLowerCase() === userTaluko?.toLowerCase()
          : !taluko || car.owner_taluko?.toLowerCase().includes(taluko.toLowerCase());
        const cityMatch = !city || car.owner_city?.toLowerCase() === city.toLowerCase();
        const stateMatch = !state || car.owner_state?.toLowerCase() === state.toLowerCase();
        matchLocation = talukoMatch && cityMatch && stateMatch;
      }

      return matchSearch && matchLocation;
    });

    setFilteredCars(filtered);
  };

  const handleTalukoSelect = (taluko) => {
    setSelectedTaluko(taluko);
    setTalukoInput(taluko);
    setShowTalukoSuggestions(false);
    applyFilters(searchTerm, taluko, selectedCity, selectedState);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityInput(city);
    setShowCitySuggestions(false);
    applyFilters(searchTerm, selectedTaluko, city, selectedState);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStateInput(state);
    setShowStateSuggestions(false);
    applyFilters(searchTerm, selectedTaluko, selectedCity, state);
  };

  const filteredTalukas = talukoOptions.filter(t => t.toLowerCase().startsWith(talukoInput.toLowerCase()));
  const filteredCities = cityOptions.filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase()));
  const filteredStates = stateOptions.filter(s => s.toLowerCase().startsWith(stateInput.toLowerCase()));

  const stats = [
    {
      title: "Total Cars",
      value: cars.length,
      icon: <FaCar />,
      color: "from-blue-50 to-cyan-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Total Bookings",
      value: cars.reduce((sum, car) => sum + car.total_bookings, 0),
      icon: "📋",
      color: "from-green-50 to-emerald-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
    },
    {
      title: "Completed Services",
      value: cars.reduce((sum, car) => sum + car.completed_bookings, 0),
      icon: "✓",
      color: "from-amber-50 to-orange-50",
      textColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
    {
      title: "Total Revenue",
      value: `₹${cars.reduce((sum, car) => sum + car.total_revenue, 0).toLocaleString()}`,
      icon: "💰",
      color: "from-red-50 to-pink-50",
      textColor: "text-red-600",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">All Cars 🚗</h1>
            <p className="text-slate-600 text-base">View and manage all registered vehicles</p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className={`bg-gradient-to-br ${stat.color} border ${stat.borderColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
            >
              <p className="text-slate-600 text-sm font-semibold mb-2">{stat.title}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by car name, plate, owner name, email, or location..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* LOCATION FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Taluko Filter */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Taluko {isSubAdmin && <span className="text-xs text-blue-600">(📍 Assigned)</span>}
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
              disabled={isSubAdmin}
              className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm ${isSubAdmin ? "opacity-75 cursor-not-allowed bg-slate-50" : ""}`}
              title={isSubAdmin ? `You can only view cars from ${userTaluko}` : ""}
            />
            {showTalukoSuggestions && filteredTalukas.length > 0 && !isSubAdmin && (
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
            {selectedTaluko && !isSubAdmin && (
              <button
                onClick={() => {
                  setSelectedTaluko("");
                  setTalukoInput("");
                  applyFilters(searchTerm, "", selectedCity, selectedState);
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
                  applyFilters(searchTerm, selectedTaluko, "", selectedState);
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
                  applyFilters(searchTerm, selectedTaluko, selectedCity, "");
                }}
                className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CARS TABLE */}
        {filteredCars.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-lg">
            <FaCar className="text-5xl text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchTerm ? "No cars found matching your search." : "No cars registered yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Car Details</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Plate</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Bookings</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Completed</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-900">Revenue</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Last Service</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCars.map((car, idx) => (
                    <tr key={car.id || idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {car.image_url ? (
                            <img
                              src={car.image_url}
                              alt={car.car_name}
                              className="w-10 h-10 rounded object-cover border border-slate-300"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-50 border border-blue-300 rounded flex items-center justify-center">
                              <FaCar className="text-blue-600 text-sm" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{car.car_name}</p>
                            <p className="text-xs text-slate-500">{car.brand} {car.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                            {car.owner_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{car.owner_name}</p>
                            <p className="text-xs text-slate-500">{car.owner_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 border border-blue-300 text-blue-700 rounded text-xs font-semibold">
                          {car.number_plate || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold text-slate-900">{car.total_bookings}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold text-green-600">{car.completed_bookings}</p>
                        <p className="text-xs text-slate-500">Completed</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900">₹{car.total_revenue.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {car.last_service 
                            ? new Date(car.last_service).toLocaleDateString() 
                            : "N/A"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETAILED CARDS VIEW */}
        {filteredCars.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 mt-8 text-slate-900">Detailed Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {filteredCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:border-blue-300 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={car.car_name}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-300"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-50 border border-blue-300 rounded-lg flex items-center justify-center">
                          <FaCar className="text-blue-600 text-2xl" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900">{car.car_name}</h3>
                        <p className="text-sm text-blue-600 font-semibold">{car.number_plate}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Owner: {car.owner_name} • {car.owner_email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STATS GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-semibold">Total Bookings</p>
                      <p className="font-bold text-blue-600">{car.total_bookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-semibold">Completed</p>
                      <p className="font-bold text-green-600">{car.completed_bookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-semibold">Revenue</p>
                      <p className="font-bold text-slate-900">₹{car.total_revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1 font-semibold">Pending</p>
                      <p className="font-bold text-amber-600">{car.status_breakdown.pending}</p>
                    </div>
                  </div>

                  {/* STATUS BREAKDOWN */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-blue-50 border border-blue-300 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-700 font-semibold">Confirmed</p>
                      <p className="font-bold text-blue-600">{car.status_breakdown.confirmed}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 text-center">
                      <p className="text-xs text-amber-700 font-semibold">In Progress</p>
                      <p className="font-bold text-amber-600">{car.status_breakdown.inProgress}</p>
                    </div>
                    <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-700 font-semibold">Completed</p>
                      <p className="font-bold text-green-600">{car.status_breakdown.completed}</p>
                    </div>
                    <div className="bg-slate-100 border border-slate-300 rounded-lg p-2 text-center">
                      <p className="text-xs text-slate-700 font-semibold">Pending</p>
                      <p className="font-bold text-slate-600">{car.status_breakdown.pending}</p>
                    </div>
                  </div>

                  {/* ACTIVE PASS SECTION */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-lg">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Active Pass</p>
                    {car.monthlyPass && car.monthlyPass.active ? (
                      <div>
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          ✓ Monthly Pass • {car.monthlyPass.remaining_washes}/{car.monthlyPass.total_washes} washes
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Valid till: {new Date(car.monthlyPass.valid_till).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-amber-600 mt-1">No Active Pass</p>
                    )}
                  </div>

                  {/* LOCATIONS */}
                  {car.locations && car.locations.length > 0 && (
                    <div className="flex items-start gap-2 mb-3 text-sm text-slate-600">
                      <FiMapPin className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {car.locations.slice(0, 3).map((loc, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs text-slate-700">
                            {loc}
                          </span>
                        ))}
                        {car.locations.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs text-slate-700">
                            +{car.locations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
