import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Filter,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Car,
  Clock,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

const WashHistory = () => {
  const navigate = useNavigate();
  
  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [washes, setWashes] = useState([]);
  const [filteredWashes, setFilteredWashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [stats, setStats] = useState({
    totalWashes: 0,
    totalEarned: 0,
    averagePerDay: 0,
  });

  const employeeId = localStorage.getItem("userId");
  const AMOUNT_PER_WASH = 25;

  // Load wash history
  useEffect(() => {
    if (employeeId) {
      fetchWashHistory();
    }
  }, [employeeId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [washes, selectedDateFilter, customStartDate, customEndDate]);

  const fetchWashHistory = async () => {
    setLoading(true);
    try {
      // Fetch from Supabase car_wash_tracking table
      const { data: washData, error } = await supabase
        .from("car_wash_tracking")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("status", "washed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setWashes([]);
        return;
      }

      if (washData && washData.length > 0) {
        setWashes(washData);
        calculateStats(washData);
        console.log("✅ Wash history loaded:", washData.length, "washes");
      } else {
        console.log("ℹ️ No wash history found");
        setWashes([]);
      }
    } catch (err) {
      console.error("Error fetching wash history:", err);
      // Fallback: try to get data from backend if Supabase fails
      try {
        const res = await fetch(
          `http://localhost:5000/car-wash/monthly/${employeeId}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`
        );
        const data = await res.json();
        if (data.success && data.washes) {
          const completedWashes = data.washes.filter(w => w.status === "washed");
          setWashes(completedWashes);
          calculateStats(completedWashes);
        }
      } catch (backendErr) {
        console.error("Backend fallback error:", backendErr);
        setWashes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (washList) => {
    const totalWashes = washList.length;
    const totalEarned = totalWashes * AMOUNT_PER_WASH;

    // Get unique dates
    const uniqueDates = new Set(
      washList.map(w => new Date(w.created_at).toDateString())
    );
    const averagePerDay = uniqueDates.size > 0 
      ? Math.round(totalWashes / uniqueDates.size)
      : 0;

    setStats({
      totalWashes,
      totalEarned,
      averagePerDay,
    });
  };

  const applyFilters = () => {
    let filtered = [...washes];

    if (selectedDateFilter === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        w => new Date(w.created_at).toDateString() === today
      );
    } else if (selectedDateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(w => new Date(w.created_at) >= weekAgo);
    } else if (selectedDateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(w => new Date(w.created_at) >= monthAgo);
    } else if (selectedDateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59);
        filtered = filtered.filter(
          w => new Date(w.created_at) >= start && new Date(w.created_at) <= end
        );
      }
    }

    setFilteredWashes(filtered);
    calculateStats(filtered);
  };

  const downloadCSV = () => {
    if (filteredWashes.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Car Owner",
      "Car Number",
      "Car Model",
      "Amount Earned",
      "Status",
    ];

    const rows = filteredWashes.map(wash => [
      new Date(wash.created_at).toLocaleDateString("en-IN"),
      new Date(wash.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      wash.car_owner_name,
      wash.car_number,
      wash.car_model || "N/A",
      wash.car_color || "N/A",
      `₹${AMOUNT_PER_WASH}`,
      wash.status === "washed" ? "Completed" : wash.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wash-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
           
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Wash History</h1>
              <p className="text-slate-600 mt-1">Track all your completed car washes and earnings</p>
            </div>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Washes */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-2">Total Washes</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalWashes}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <Car size={32} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-600 font-semibold">
              Based on selected date range
            </p>
          </div>

          {/* Total Earned */}
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-2">Total Earned</p>
                <p className="text-4xl font-bold text-green-600">
                  ₹{stats.totalEarned.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <DollarSign size={32} className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-600 font-semibold">
              ₹{AMOUNT_PER_WASH} per wash
            </p>
          </div>

          {/* Average Per Day */}
          <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-2">Average Per Day</p>
                <p className="text-4xl font-bold text-purple-600">
                  {stats.averagePerDay} cars
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg">
                <TrendingUp size={32} className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-slate-600 font-semibold">
              Washes per day average
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={24} className="text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Preset Filters */}
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Date Range
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "All Time", value: "all" },
                  { label: "Today", value: "today" },
                  { label: "Last 7 Days", value: "week" },
                  { label: "Last 30 Days", value: "month" },
                  { label: "Custom", value: "custom" },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDateFilter(option.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedDateFilter === option.value
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs */}
            {selectedDateFilter === "custom" && (
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wash History Table */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Completed Washes ({filteredWashes.length})
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-slate-600 mt-4">Loading wash history...</p>
            </div>
          ) : filteredWashes.length === 0 ? (
            <div className="text-center py-12">
              <Car size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">No washes found for the selected date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                      Car Owner
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                      Car Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                      Car Model
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                      Amount Earned
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-slate-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWashes.map((wash, index) => (
                    <tr
                      key={wash.id}
                      className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-600" />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {new Date(wash.created_at).toLocaleDateString("en-IN")}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(wash.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {wash.car_owner_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-blue-600">
                          {wash.car_number}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">
                          {wash.car_model || "N/A"}
                        </p>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-green-600">
                          ₹{AMOUNT_PER_WASH}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            Completed
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredWashes.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Total Washes</p>
                <p className="text-3xl font-bold">{stats.totalWashes}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Total Earnings</p>
                <p className="text-3xl font-bold">₹{stats.totalEarned.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Daily Average</p>
                <p className="text-3xl font-bold">{stats.averagePerDay} cars/day</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WashHistory;
