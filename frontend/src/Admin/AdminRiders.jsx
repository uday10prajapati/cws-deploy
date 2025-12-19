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
} from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";

export default function AdminRiders() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [activeJobs, setActiveJobs] = useState(0);

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

  const renderContent = () => {
    if (selectedRider) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedRider(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
            >
              <FiArrowLeft className="text-xl" />
              Back to Riders
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Rider Details</h1>
            <div></div>
          </div>

          {/* Rider Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Rider Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                  {selectedRider.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedRider.name}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Rider ID: {selectedRider.id.slice(0, 8)}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <FiMail className="text-blue-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="text-slate-900 font-medium">
                      {selectedRider.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="text-green-600 text-lg" />
                  <div>
                    <p className="text-xs text-slate-600">Phone</p>
                    <p className="text-slate-900 font-medium">
                      {selectedRider.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600 mb-1 font-semibold">
                    Active Jobs
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {activeJobs}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1 font-semibold">
                    Member Since
                  </p>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(selectedRider.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Status Card */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="font-semibold text-green-700">Online</p>
                </div>
                <p className="text-sm text-slate-600">Last updated: Just now</p>
              </div>

              {riderLocation && (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiMapPin className="text-blue-600 text-lg" />
                    <p className="font-semibold text-slate-900">
                      Current Location
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">
                    {riderLocation.address || "Location data unavailable"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <p className="text-slate-600">Latitude</p>
                      <p className="text-blue-600 font-mono">
                        {riderLocation.latitude?.toFixed(4)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <p className="text-slate-600">Longitude</p>
                      <p className="text-blue-600 font-mono">
                        {riderLocation.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Tracking Map Placeholder */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <FiMap className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold text-slate-900">
                Live Tracking
              </h3>
            </div>

            {riderLocation ? (
              <div className="w-full h-96 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <FiMapPin className="text-4xl text-blue-600 mx-auto mb-3" />
                  <p className="text-slate-700 mb-2">
                    Location: {riderLocation.address}
                  </p>
                  <p className="text-sm text-slate-600">
                    Coordinates: {riderLocation.latitude?.toFixed(4)},{" "}
                    {riderLocation.longitude?.toFixed(4)}
                  </p>
                  <p className="text-xs text-slate-500 mt-3">
                    Last update:{" "}
                    {new Date(riderLocation.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-96 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <FiMapPin className="text-4xl text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No location data available</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Rider hasn't shared location yet
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Active Jobs */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiTrendingUp className="text-blue-600" />
              Active Jobs ({activeJobs})
            </h3>

            {activeJobs > 0 ? (
              <p className="text-slate-600">
                Rider has {activeJobs} active job(s)
              </p>
            ) : (
              <p className="text-slate-600">No active jobs at this moment</p>
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
          <p className="text-slate-400 text-sm mt-1">
            Manage and track your riders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Total Riders
            </p>
            <p className="text-3xl font-bold text-blue-600">{riders.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">Online</p>
            <p className="text-3xl font-bold text-green-600">
              {riders.filter((r) => r.account_status === "active").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Active Jobs
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {riders.reduce((sum, r) => sum + (r.activeJobs || 0), 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <p className="text-slate-600 text-sm mb-1 font-semibold">
              Approved
            </p>
            <p className="text-3xl font-bold text-amber-600">
              {riders.filter((r) => r.approval_status === "approved").length}
            </p>
          </div>
        </div>

        {/* Riders List */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-12 text-center">
              <FiAlertCircle className="text-4xl text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No riders found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {riders.map((rider) => (
                <div
                  key={rider.id}
                  onClick={() => handleRiderClick(rider)}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                        {rider.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600">
                          {rider.name}
                        </h3>
                        <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <FiPhone className="text-xs" />
                          {rider.phone}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              rider.account_status === "active"
                                ? "bg-green-500"
                                : "bg-slate-400"
                            }`}
                          ></div>
                          <span
                            className={`text-xs font-medium ${
                              rider.account_status === "active"
                                ? "text-green-600"
                                : "text-slate-600"
                            }`}
                          >
                            {rider.account_status === "active"
                              ? "Online"
                              : "Offline"}
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 font-semibold">
                          {rider.activeJobs} active job(s)
                        </p>
                      </div>

                      <FiChevronRight className="text-2xl text-slate-400 group-hover:text-blue-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
