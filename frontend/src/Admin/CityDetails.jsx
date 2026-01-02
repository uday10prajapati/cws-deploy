import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import {
  FiMapPin,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiActivity,
  FiHome,
  FiSearch,
  FiBarChart2,
  FiFilter
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function CityDetails() {
  const [user, setUser] = useState(null);
  const [userCities, setUserCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [selectedTaluko, setSelectedTaluko] = useState("");
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [userFilter, setUserFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [cityStats, setCityStats] = useState(null);
  const [cityUsers, setCityUsers] = useState([]);
  const [cityCars, setCityCars] = useState([]);
  const [cityBookings, setCityBookings] = useState([]);
  const [cityTalukaBreakdown, setCityTalukaBreakdown] = useState([]);
  
  // Filtered data
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);

  useRoleBasedRedirect(["sub-admin"]);

  // 🔐 ROLE-BASED ACCESS: Sub-Admin has assigned cities (City → Taluka → Wash Area hierarchy)
  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get assigned cities and role
        const { data: profile } = await supabase
          .from("profiles")
          .select("assigned_cities, role")
          .eq("id", auth.user.id)
          .single();
        
        if (profile && profile.role === "sub-admin") {
          // Sub-Admin has one or more assigned cities
          const cities = profile.assigned_cities || [];
          setUserCities(cities);
          setIsSubAdmin(true);
          
          // Auto-select first city if available
          if (cities.length > 0) {
            setSelectedCity(cities[0]);
          }
        }
      }
    };
    loadUser();
  }, []);

  // Load city data when selected city changes
  useEffect(() => {
    if (selectedCity) {
      loadCityData();
    }
  }, [selectedCity]);

  // Apply taluko filter
  useEffect(() => {
    if (cityUsers.length > 0) {
      let filtered = cityUsers;
      
      if (selectedTaluko) {
        filtered = filtered.filter(u => u.taluko === selectedTaluko);
      }
      
      if (userFilter !== "All") {
        filtered = filtered.filter(u => u.role === userFilter);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(u =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.includes(searchTerm)
        );
      }
      
      setFilteredUsers(filtered);
    }
  }, [cityUsers, selectedTaluko, userFilter, searchTerm]);

  // Apply taluko filter to cars
  useEffect(() => {
    if (cityCars.length > 0) {
      let filtered = cityCars;
      
      if (selectedTaluko) {
        filtered = filtered.filter(car => car.taluko === selectedTaluko);
      }
      
      setFilteredCars(filtered);
    }
  }, [cityCars, selectedTaluko]);

  const loadCityData = async () => {
    setLoading(true);
    try {
      // 🔐 GEOGRAPHIC HIERARCHY: City → Taluka → Wash Area
      // Sub-Admin can see ALL talukas under assigned city
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, name, email, phone, role, city, taluko, state")
        .eq("city", selectedCity);

      setCityUsers(usersData || []);

      // Extract unique talukas for filter
      const talukas = [...new Set(usersData?.map(u => u.taluko).filter(Boolean))];
      setAvailableTalukas(talukas);
      
      // If only one taluko, select it by default
      if (talukas.length === 1) {
        setSelectedTaluko(talukas[0]);
      }

      // Calculate taluko breakdown
      const breakdown = talukas.map(taluko => {
        const talukoUsers = usersData?.filter(u => u.taluko === taluko) || [];
        return {
          taluko,
          totalUsers: talukoUsers.length,
          customers: talukoUsers.filter(u => u.role === "customer").length,
          washers: talukoUsers.filter(u => u.role === "employee" || u.role === "washer").length,
        };
      });
      setCityTalukaBreakdown(breakdown);

      // Fetch all cars for customers in this city
      if (usersData && usersData.length > 0) {
        const customerIds = usersData
          .filter(u => u.role === "customer")
          .map(u => u.id);

        if (customerIds.length > 0) {
          const carsResponse = await fetch("http://localhost:5000/cars");
          const carsResult = await carsResponse.json();
          
          if (carsResult.success && carsResult.cars) {
            // Add taluko info to cars based on customer
            const carsWithTaluko = carsResult.cars
              .filter(car => customerIds.includes(car.customer_id))
              .map(car => {
                const customer = usersData.find(u => u.id === car.customer_id);
                return { ...car, taluko: customer?.taluko };
              });
            setCityCars(carsWithTaluko);
          }
        }
      }

      // Fetch bookings for this city
      const bookingsResponse = await fetch("http://localhost:5000/admin/recent-bookings");
      const bookingsResult = await bookingsResponse.json();
      
      if (bookingsResult.success && bookingsResult.data) {
        // Filter bookings for this city (based on customer location)
        const filteredBookings = bookingsResult.data.filter(booking => {
          const customer = usersData?.find(u => u.id === booking.customer_id);
          return customer && customer.city === userCity;
        });
        setCityBookings(filteredBookings);
      }

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const totalCustomers = usersData?.filter(u => u.role === "customer").length || 0;
      const totalWashers = usersData?.filter(u => u.role === "employee" || u.role === "washer").length || 0;
      const totalCars = cityCars?.length || 0;
      const totalBookings = cityBookings?.length || 0;
      const completedBookings = cityBookings?.filter(b => b.status === "Completed").length || 0;

      setCityStats({
        totalUsers,
        totalCustomers,
        totalWashers,
        totalCars,
        totalBookings,
        completedBookings,
      });
    } catch (error) {
      console.error("Error loading city data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Users",
      value: cityStats?.totalUsers || "0",
      icon: <FiUsers />,
      colors: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Customers",
      value: cityStats?.totalCustomers || "0",
      icon: <FiActivity />,
      colors: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      title: "Washers/Employees",
      value: cityStats?.totalWashers || "0",
      icon: <FiCheckCircle />,
      colors: "from-emerald-600 to-green-600",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      title: "Total Cars",
      value: cityStats?.totalCars || "0",
      icon: <FaCar />,
      colors: "from-amber-600 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      title: "Total Bookings",
      value: cityStats?.totalBookings || "0",
      icon: <FiCheckCircle />,
      colors: "from-red-600 to-pink-600",
      bgGradient: "from-red-50 to-pink-50"
    },
    {
      title: "Completed",
      value: cityStats?.completedBookings || "0",
      icon: <FiCheckCircle />,
      colors: "from-green-600 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
                🏙️ City Details
              </h1>
              <p className="text-slate-600 text-base">
                View all details for {selectedCity} city
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 py-3 text-right">
              <p className="text-sm font-semibold text-blue-900">📋 Your Role: Sub-Admin</p>
              {userCities.length > 1 ? (
                <div>
                  <p className="text-xs text-blue-700 mt-1">Assigned Cities: {userCities.length}</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">{selectedCity}</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">{selectedCity}</p>
              )}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          {stats.map((item) => (
            <div
              key={item.title}
              className={`bg-linear-to-br ${item.bgGradient} rounded-2xl p-6 shadow-lg border border-opacity-30 hover:shadow-xl hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-700 text-sm font-semibold tracking-wide">
                  {item.title}
                </p>
                <div className={`w-10 h-10 rounded-lg bg-linear-to-r ${item.colors} text-white flex items-center justify-center text-lg opacity-90`}>
                  {item.icon}
                </div>
              </div>
              <p className={`text-3xl font-black bg-linear-to-r ${item.colors} bg-clip-text text-transparent`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* CITY SELECTOR - For Sub-Admin with multiple cities */}
        {userCities.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
              <FiMapPin className="text-blue-600" />
              Select City
            </h3>
            <div className="flex gap-3 flex-wrap">
              {userCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedCity === city
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TALUKO BREAKDOWN */}
        {availableTalukas.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg mb-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FiBarChart2 className="text-blue-600" />
              Taluko Breakdown in {userCity}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityTalukaBreakdown.map((taluko) => (
                <div
                  key={taluko.taluko}
                  onClick={() => setSelectedTaluko(selectedTaluko === taluko.taluko ? "" : taluko.taluko)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTaluko === taluko.taluko
                      ? "bg-blue-50 border-blue-400 shadow-lg"
                      : "bg-slate-50 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-bold text-slate-900 text-lg">{taluko.taluko}</p>
                  <p className="text-sm text-slate-600 mt-2">Users: <span className="font-bold text-blue-600">{taluko.totalUsers}</span></p>
                  <p className="text-sm text-slate-600">Customers: <span className="font-bold text-green-600">{taluko.customers}</span></p>
                  <p className="text-sm text-slate-600">Washers: <span className="font-bold text-orange-600">{taluko.washers}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {[
            { id: "overview", label: "📊 Overview", icon: <FiBarChart2 /> },
            { id: "users", label: "👥 Users", icon: <FiUsers /> },
            { id: "cars", label: "🚗 Cars", icon: <FaCar /> },
            { id: "bookings", label: "📋 Bookings", icon: <FiCheckCircle /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Users in {userCity}</h2>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <select
                value={selectedTaluko}
                onChange={(e) => setSelectedTaluko(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="">All Talukas in {userCity}</option>
                {availableTalukas.map((taluko) => (
                  <option key={taluko} value={taluko}>
                    {taluko}
                  </option>
                ))}
              </select>

              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="All">All Roles</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee/Washer</option>
                <option value="sub-admin">Sub-Admin</option>
              </select>
            </div>

            {/* USERS TABLE */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FiUsers className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No users found with selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">City</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Taluko</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((usr, idx) => (
                      <tr key={usr.id || idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{usr.name || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-600">{usr.email || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-600">{usr.phone || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            usr.role === "customer" ? "bg-blue-100 text-blue-700" :
                            usr.role === "employee" || usr.role === "washer" ? "bg-green-100 text-green-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-600">{usr.city || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {usr.taluko || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CARS TAB */}
        {activeTab === "cars" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Cars in {userCity}</h2>
            
            {/* TALUKO FILTER FOR CARS */}
            {availableTalukas.length > 1 && (
              <div className="mb-6">
                <select
                  value={selectedTaluko}
                  onChange={(e) => setSelectedTaluko(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="">All Talukas in {userCity}</option>
                  {availableTalukas.map((taluko) => (
                    <option key={taluko} value={taluko}>
                      {taluko}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filteredCars.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FaCar className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No cars found in {userCity}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCars.map((car) => (
                  <div key={car.id} className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-300 rounded-xl p-4 shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-slate-900">{car.brand} {car.model}</p>
                    <p className="text-sm text-slate-600 mt-1">Plate: {car.number_plate}</p>
                    <p className="text-sm text-slate-600">Year: {car.year || "N/A"}</p>
                    <p className="text-xs text-blue-600 mt-2 font-semibold">Taluko: {car.taluko || "N/A"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bookings in {userCity}</h2>
            {cityBookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FiCheckCircle className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No bookings found in {userCity}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-4 text-left font-bold text-slate-900">ID</th>
                      <th className="py-4 px-4 text-left font-bold text-slate-900">Customer</th>
                      <th className="py-4 px-4 text-left font-bold text-slate-900">Location</th>
                      <th className="py-4 px-4 text-left font-bold text-slate-900">Status</th>
                      <th className="py-4 px-4 text-left font-bold text-slate-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityBookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="py-4 px-4 font-bold text-blue-600 font-mono text-xs">{b.id.substring(0, 8)}</td>
                        <td className="py-4 px-4 font-semibold text-slate-900">{b.name || "N/A"}</td>
                        <td className="py-4 px-4 text-slate-600">{b.location || "N/A"}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            b.status === "Completed" ? "bg-green-100 text-green-700" :
                            b.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                            b.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {b.date ? new Date(b.date).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FiUsers className="text-emerald-600" />
                User Distribution in {userCity}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="font-semibold text-slate-700">Customers</span>
                  <span className="text-2xl font-bold text-emerald-600">{cityStats?.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="font-semibold text-slate-700">Washers/Employees</span>
                  <span className="text-2xl font-bold text-emerald-600">{cityStats?.totalWashers || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FiCheckCircle className="text-blue-600" />
                Booking Statistics for {userCity}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-slate-700">Total Bookings</span>
                  <span className="text-2xl font-bold text-blue-600">{cityStats?.totalBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-slate-700">Completed</span>
                  <span className="text-2xl font-bold text-blue-600">{cityStats?.completedBookings || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
