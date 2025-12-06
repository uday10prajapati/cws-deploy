import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  FiUsers,
  FiHome,
  FiClipboard,
  FiMenu,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiCreditCard,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function AdminRiders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [activeJobs, setActiveJobs] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("admin");

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    setLoading(true);
    try {
      // Fetch all riders (employees with employee_type = 'rider')
      const { data: riderProfiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")
        .eq("employee_type", "rider")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading riders:", error);
        return;
      }

      // Enrich with active job count
      const enrichedRiders = await Promise.all(
        (riderProfiles || []).map(async (rider) => {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact" })
            .eq("assigned_to", rider.id)
            .in("status", ["pending", "in_wash"]);

          return {
            ...rider,
            activeJobs: count || 0,
          };
        })
      );

      setRiders(enrichedRiders);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRiderClick = async (rider) => {
    setSelectedRider(rider);
    
    // Fetch rider's current location and active jobs
    const { data: locations } = await supabase
      .from("car_locations")
      .select("*")
      .eq("rider_id", rider.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (locations) {
      setRiderLocation(locations);
    }

    // Count active jobs
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .eq("assigned_to", rider.id)
      .in("status", ["pending", "in_wash"]);

    setActiveJobs(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard", id: "dashboard" },
    { name: "Approvals", icon: <FiAlertCircle />, link: null, id: "approvals" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings", id: "bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users", id: "users" },
    { name: "Riders", icon: <FiUsers />, link: "/admin/riders", id: "riders" },
    { name: "Customer Accounts", icon: <FiSettings />, link: "/admin/customer-accounts", id: "customer-accounts" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/admin/earnings", id: "earnings" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars", id: "cars" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue", id: "revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics", id: "analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account", id: "bank" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings", id: "settings" },
  ];

  const renderContent = () => {
    if (selectedRider) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSelectedRider(null)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
          >
            <FiArrowLeft className="text-xl" />
            Back to Riders
          </button>
          <h1 className="text-3xl font-bold">Rider Details</h1>
          <div></div>
        </div>

        {/* Rider Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Rider Info */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                {selectedRider.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selectedRider.name}</h2>
                <p className="text-slate-400 text-sm mt-1">Rider ID: {selectedRider.id.slice(0, 8)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-400">Active</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-3">
                <FiMail className="text-blue-400 text-lg" />
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-white font-medium">{selectedRider.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-green-400 text-lg" />
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-white font-medium">{selectedRider.phone}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-700">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Active Jobs</p>
                <p className="text-2xl font-bold text-blue-400">{activeJobs}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Member Since</p>
                <p className="text-sm text-white font-medium">
                  {new Date(selectedRider.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Status Card */}
          <div className="space-y-4">
            <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-700/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <p className="font-semibold text-green-400">Online</p>
              </div>
              <p className="text-sm text-slate-300">Last updated: Just now</p>
            </div>

            {riderLocation && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiMapPin className="text-blue-400 text-lg" />
                  <p className="font-semibold">Current Location</p>
                </div>
                <p className="text-sm text-slate-300 mb-3">{riderLocation.address || "Location data unavailable"}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded">
                    <p className="text-slate-400">Latitude</p>
                    <p className="text-blue-400 font-mono">{riderLocation.latitude?.toFixed(4)}</p>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded">
                    <p className="text-slate-400">Longitude</p>
                    <p className="text-blue-400 font-mono">{riderLocation.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Tracking Map Placeholder */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FiMap className="text-blue-400 text-xl" />
            <h3 className="text-xl font-bold">Live Tracking</h3>
          </div>
          
          {riderLocation ? (
            <div className="w-full h-96 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700">
              <div className="text-center">
                <FiMapPin className="text-4xl text-blue-400 mx-auto mb-3" />
                <p className="text-slate-300 mb-2">Location: {riderLocation.address}</p>
                <p className="text-sm text-slate-400">
                  Coordinates: {riderLocation.latitude?.toFixed(4)}, {riderLocation.longitude?.toFixed(4)}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Last update: {new Date(riderLocation.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <div className="text-center">
                <FiMapPin className="text-4xl text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No location data available</p>
                <p className="text-sm text-slate-500 mt-2">Rider hasn't shared location yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Jobs */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-blue-400" />
            Active Jobs ({activeJobs})
          </h3>
          
          {activeJobs > 0 ? (
            <p className="text-slate-400">Rider has {activeJobs} active job(s)</p>
          ) : (
            <p className="text-slate-400">No active jobs at this moment</p>
          )}
        </div>
      </div>
    );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Active Riders</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track your riders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-blue-600/20 to-blue-900/20 border border-blue-700/50 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-2">Total Riders</p>
            <p className="text-3xl font-bold text-blue-400">{riders.length}</p>
          </div>
          <div className="bg-linear-to-br from-green-600/20 to-green-900/20 border border-green-700/50 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-2">Online</p>
            <p className="text-3xl font-bold text-green-400">
              {riders.filter(r => r.account_status === "active").length}
            </p>
          </div>
          <div className="bg-linear-to-br from-purple-600/20 to-purple-900/20 border border-purple-700/50 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-2">Active Jobs</p>
            <p className="text-3xl font-bold text-purple-400">
              {riders.reduce((sum, r) => sum + (r.activeJobs || 0), 0)}
            </p>
          </div>
          <div className="bg-linear-to-br from-amber-600/20 to-amber-900/20 border border-amber-700/50 rounded-xl p-6">
            <p className="text-sm text-slate-400 mb-2">Approval Status</p>
            <p className="text-3xl font-bold text-amber-400">
              {riders.filter(r => r.approval_status === "approved").length}
            </p>
          </div>
        </div>

        {/* Riders List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="text-4xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No riders found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {riders.map((rider) => (
                <div
                  key={rider.id}
                  onClick={() => handleRiderClick(rider)}
                  className="p-6 hover:bg-slate-700/50 transition cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                      {rider.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{rider.name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                        <FiPhone className="text-xs" />
                        {rider.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <div className={`w-2 h-2 rounded-full ${rider.account_status === "active" ? "bg-green-500" : "bg-slate-600"}`}></div>
                        <span className={`text-xs font-medium ${rider.account_status === "active" ? "text-green-400" : "text-slate-400"}`}>
                          {rider.account_status === "active" ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="text-sm text-blue-400 font-semibold">{rider.activeJobs} active job(s)</p>
                    </div>

                    <FiChevronRight className="text-2xl text-slate-500" />
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">CarWash+</h1>
        <FiMenu className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setSidebarOpen(true)} />
      </div>

      {/* ▓▓▓ BACKDROP FOR MOBILE ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-2xl 
          z-50 transition-all duration-300
          ${collapsed ? "w-16" : "w-56"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Row */}
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">
            {collapsed ? "CW" : "CarWash+"}
          </span>

          {!collapsed && (
            <FiChevronLeft className="text-slate-400" />
          )}
        </div>

        {/* MENU */}
        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => {
            if (item.link) {
              return (
                <Link
                  key={item.name}
                  to={item.link}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-4 px-3 py-2 rounded-lg 
                    mb-2 font-medium transition-all
                    ${
                      location.pathname === item.link
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                  title={collapsed ? item.name : ""}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              );
            } else {
              return null;
            }
          })}
        </nav>

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            text-white px-4 py-2 font-semibold rounded-lg cursor-pointer 
            flex items-center gap-3 shadow-lg transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Logout" : ""}
        >
          <FiLogOut className="text-lg" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <main className={`
        flex-1 transition-all duration-300 
        lg:ml-0 mt-20 lg:mt-0
        ${collapsed ? "lg:ml-16" : "lg:ml-56"}
      `}>
        {/* TOP BAR (Desktop) */}
        <div className="hidden lg:block bg-slate-900 border-b border-slate-800 px-8 py-6 shadow-lg sticky top-0 z-30">
          <h1 className="text-2xl font-bold">Riders Management</h1>
        </div>

        {/* CONTENT AREA */}
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
