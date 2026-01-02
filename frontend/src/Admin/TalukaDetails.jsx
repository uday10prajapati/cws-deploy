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
  FiBarChart2
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function TalukaDetails() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCity, setUserCity] = useState(null);
  const [userTaluko, setUserTaluko] = useState(null);
  const [userTalukas, setUserTalukas] = useState([]);
  const [selectedTaluko, setSelectedTaluko] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data states
  const [talukaStats, setTalukaStats] = useState(null);
  const [talukaUsers, setTalukaUsers] = useState([]);
  const [talukaCars, setTalukaCars] = useState([]);
  const [talukaBookings, setTalukaBookings] = useState([]);
  const [talukaWashers, setTalukaWashers] = useState([]);
  
  // Filter states
  const [userFilter, setUserFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  useRoleBasedRedirect(["sub-admin", "hr"]);

  // 🔐 ROLE-BASED ACCESS:
  // Sub-Admin: Assigned cities → all talukas under those cities → all data
  // HR: Assigned talukas → data only for those talukas
  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get role and geographic assignments
        const { data: profile } = await supabase
          .from("profiles")
          .select("taluko, assigned_talukas, assigned_cities, city, role")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          
          if (profile.role === "sub-admin" && profile.assigned_cities) {
            // Sub-Admin: Can see ALL talukas under assigned cities
            setIsSubAdmin(true);
            setUserCity(profile.city);
            const talukas = profile.assigned_talukas || [profile.taluko];
            setUserTalukas(talukas);
            
            // Auto-select first taluko
            if (talukas.length > 0) {
              setSelectedTaluko(talukas[0]);
            }
          } else if (profile.role === "hr" && profile.assigned_talukas) {
            // HR: Can ONLY see assigned talukas
            setIsHR(true);
            setUserCity(profile.city);
            setUserTalukas(profile.assigned_talukas);
            
            // Auto-select first taluko
            if (profile.assigned_talukas.length > 0) {
              setSelectedTaluko(profile.assigned_talukas[0]);
            }
          }
        }
      }
    };
    loadUser();
  }, []);

  // Load taluka data when selected taluko changes
  useEffect(() => {
    if (selectedTaluko) {
      loadTalukaData();
    }
  }, [selectedTaluko]);

  const loadTalukaData = async () => {
    setLoading(true);
    try {
      // 🔐 GEOGRAPHIC HIERARCHY ENFORCEMENT:
      // Fetch only data for the selected taluko
      // Sub-Admin can see all talukas in assigned cities
      // HR can see only assigned talukas
      
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, name, email, phone, role, city, state, taluko")
        .eq("taluko", selectedTaluko);

      setTalukaUsers(usersData || []);

      // Fetch all cars for customers in this taluko
      if (usersData && usersData.length > 0) {
        const customerIds = usersData
          .filter(u => u.role === "customer")
          .map(u => u.id);

        if (customerIds.length > 0) {
          const carsResponse = await fetch("http://localhost:5000/cars");
          const carsResult = await carsResponse.json();
          
          if (carsResult.success && carsResult.cars) {
            const filteredCars = carsResult.cars.filter(car => 
              customerIds.includes(car.customer_id)
            );
            setTalukaCars(filteredCars);
          }
        }

        // Fetch washers in this taluko
        const washersData = usersData.filter(u => u.role === "employee" || u.role === "washer");
        setTalukaWashers(washersData);
      }

      // Fetch bookings for this taluko
      const bookingsResponse = await fetch("http://localhost:5000/admin/recent-bookings");
      const bookingsResult = await bookingsResponse.json();
      
      if (bookingsResult.success && bookingsResult.data) {
        // Filter bookings for this taluko (based on customer location)
        const filteredBookings = bookingsResult.data.filter(booking => {
          const customer = usersData?.find(u => u.id === booking.customer_id);
          return customer && customer.taluko === userTaluko;
        });
        setTalukaBookings(filteredBookings);
      }

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const totalCustomers = usersData?.filter(u => u.role === "customer").length || 0;
      const totalWashers = washersData?.length || 0;
      const totalCars = filteredCars?.length || 0;
      const totalBookings = filteredBookings?.length || 0;
      const completedBookings = filteredBookings?.filter(b => b.status === "Completed").length || 0;

      setTalukaStats({
        totalUsers,
        totalCustomers,
        totalWashers,
        totalCars,
        totalBookings,
        completedBookings,
      });
    } catch (error) {
      console.error("Error loading taluka data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = talukaUsers.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = userFilter === "All" || user.role === userFilter;
    return matchesSearch && matchesRole;
  });

  const stats = [
    {
      title: "Total Users",
      value: talukaStats?.totalUsers || "0",
      icon: <FiUsers />,
      colors: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Customers",
      value: talukaStats?.totalCustomers || "0",
      icon: <FiActivity />,
      colors: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      title: "Washers/Employees",
      value: talukaStats?.totalWashers || "0",
      icon: <FiCheckCircle />,
      colors: "from-emerald-600 to-green-600",
      bgGradient: "from-emerald-50 to-green-50"
    },
    {
      title: "Total Cars",
      value: talukaStats?.totalCars || "0",
      icon: <FaCar />,
      colors: "from-amber-600 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      title: "Total Bookings",
      value: talukaStats?.totalBookings || "0",
      icon: <FiCheckCircle />,
      colors: "from-red-600 to-pink-600",
      bgGradient: "from-red-50 to-pink-50"
    },
    {
      title: "Completed",
      value: talukaStats?.completedBookings || "0",
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
                📍 Taluko Details
              </h1>
              <p className="text-slate-600 text-base">
                View all details for {selectedTaluko} taluko
              </p>
            </div>
            {/* Show different badges for Sub-Admin vs HR */}
            {isSubAdmin ? (
              <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 py-3 text-right">
                <p className="text-sm font-semibold text-blue-900">📋 Your Role: Sub-Admin</p>
                {userTalukas.length > 1 ? (
                  <div>
                    <p className="text-xs text-blue-700 mt-1">Assigned Talukas: {userTalukas.length}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{selectedTaluko}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{selectedTaluko}</p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-3 text-right">
                <p className="text-sm font-semibold text-green-900">👤 Your Role: HR</p>
                {userTalukas.length > 1 ? (
                  <div>
                    <p className="text-xs text-green-700 mt-1">Assigned Talukas: {userTalukas.length}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">{selectedTaluko}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">{selectedTaluko}</p>
                )}
              </div>
            )}
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

        {/* TALUKO SELECTOR - For users with multiple assigned talukas */}
        {userTalukas.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
              <FiMapPin className="text-blue-600" />
              Select Taluko
            </h3>
            <div className="flex gap-3 flex-wrap">
              {userTalukas.map((taluko) => (
                <button
                  key={taluko}
                  onClick={() => setSelectedTaluko(taluko)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedTaluko === taluko
                      ? isSubAdmin
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-green-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {taluko}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CITY AND TALUKO BREAKDOWN FOR SUB-ADMIN */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sub-Admin Taluko Details */}
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              📍 Your Taluko Details
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600 font-semibold">Assigned Taluko</p>
                <p className="text-2xl font-bold text-blue-600">{userTaluko}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold">Total Users</p>
                  <p className="text-xl font-bold text-blue-600">
                    {talukaUsers.length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold">Customers</p>
                  <p className="text-xl font-bold text-green-600">
                    {talukaUsers.filter(u => u.role === "customer").length}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold">Employees</p>
                  <p className="text-xl font-bold text-amber-600">
                    {talukaUsers.filter(u => u.role === "employee" || u.role === "washer").length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 font-semibold">Cities in Taluko</p>
                  <p className="text-xl font-bold text-purple-600">
                    {[...new Set(talukaUsers.map(u => u.city).filter(Boolean))].length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cities in Taluko */}
          <div className="bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              🏙️ Cities in {userTaluko}
            </h3>
            <div className="space-y-2">
              {[...new Set(talukaUsers.map(u => u.city).filter(Boolean))].map(city => (
                <div key={city} className="bg-white p-3 rounded-lg border border-emerald-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-900">{city}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                    {talukaUsers.filter(u => u.city?.toLowerCase() === city?.toLowerCase()).length} users
                  </span>
                </div>
              ))}
              {[...new Set(talukaUsers.map(u => u.city).filter(Boolean))].length === 0 && (
                <p className="text-slate-500 text-center py-4">No cities found</p>
              )}
            </div>
          </div>
        </div>

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
              <h2 className="text-2xl font-bold text-slate-900">Users in {userTaluko}</h2>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="All">All Roles</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee/Washer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* USERS TABLE */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FiUsers className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No users found in {userTaluko}</p>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Cars in {userTaluko}</h2>
            {talukaCars.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FaCar className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No cars found in {userTaluko}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {talukaCars.map((car) => (
                  <div key={car.id} className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-300 rounded-xl p-4 shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-slate-900">{car.brand} {car.model}</p>
                    <p className="text-sm text-slate-600 mt-1">Plate: {car.number_plate}</p>
                    <p className="text-sm text-slate-600">Year: {car.year || "N/A"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bookings in {userTaluko}</h2>
            {talukaBookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                <FiCheckCircle className="text-5xl text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No bookings found in {userTaluko}</p>
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
                    {talukaBookings.map((b) => (
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
                User Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="font-semibold text-slate-700">Customers</span>
                  <span className="text-2xl font-bold text-emerald-600">{talukaStats?.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="font-semibold text-slate-700">Washers/Employees</span>
                  <span className="text-2xl font-bold text-emerald-600">{talukaStats?.totalWashers || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FiCheckCircle className="text-blue-600" />
                Booking Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-slate-700">Total Bookings</span>
                  <span className="text-2xl font-bold text-blue-600">{talukaStats?.totalBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                  <span className="font-semibold text-slate-700">Completed</span>
                  <span className="text-2xl font-bold text-blue-600">{talukaStats?.completedBookings || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
