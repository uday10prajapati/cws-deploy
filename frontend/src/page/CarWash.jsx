import React, { useState, useEffect } from "react";
import {
  Plus,
  Check,
  Clock,
  X,
  Calendar,
  TrendingUp,
  ChevronDown,
  Trash2,
  Edit2,
  Filter,
} from "lucide-react";

const CarWash = () => {
  const [stats, setStats] = useState({
    today: { total: 0, completed: 0, pending: 0, cancelled: 0 },
    month: { total: 0, completed: 0, pending: 0, cancelled: 0 },
  });

  const [washes, setWashes] = useState([]);
  const [filteredWashes, setFilteredWashes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("today"); // "today" or "monthly"
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "pending", "washed", "cancelled"
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    carOwnerName: "",
    carModel: "",
    carNumber: "",
    carColor: "",
    notes: "",
  });

  const employeeId = localStorage.getItem("userId"); // Get from localStorage

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/car-wash/stats/${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          today: data.today,
          month: data.month,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch today's washes
  const fetchTodayWashes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/car-wash/today/${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setWashes(data.washes);
      }
    } catch (err) {
      console.error("Error fetching today's washes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly washes
  const fetchMonthlyWashes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/car-wash/monthly/${employeeId}?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (data.success) {
        setWashes(data.washes);
      }
    } catch (err) {
      console.error("Error fetching monthly washes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to washes
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredWashes(washes);
    } else {
      setFilteredWashes(washes.filter((w) => w.status === filterStatus));
    }
  }, [washes, filterStatus]);

  // Initial load
  useEffect(() => {
    if (employeeId) {
      fetchStats();
      fetchTodayWashes();
    }
  }, [employeeId]);

  // Fetch when view mode changes
  useEffect(() => {
    if (viewMode === "today") {
      fetchTodayWashes();
    } else {
      fetchMonthlyWashes();
    }
  }, [viewMode, selectedMonth, selectedYear]);

  // Handle add/update form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.carOwnerName || !formData.carNumber) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/car-wash/add-wash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          carOwnerName: formData.carOwnerName,
          carModel: formData.carModel,
          carNumber: formData.carNumber.toUpperCase(),
          carColor: formData.carColor,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormData({ carOwnerName: "", carModel: "", carNumber: "", carColor: "", notes: "" });
        setShowAddForm(false);
        fetchTodayWashes();
        fetchStats();
        alert("Car wash record added successfully!");
      } else {
        alert(data.error || "Error adding record");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to add car wash record");
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/car-wash/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        if (viewMode === "today") {
          fetchTodayWashes();
        } else {
          fetchMonthlyWashes();
        }
        fetchStats();
      } else {
        alert(data.error || "Error updating status");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`http://localhost:5000/car-wash/delete/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        if (viewMode === "today") {
          fetchTodayWashes();
        } else {
          fetchMonthlyWashes();
        }
        fetchStats();
      } else {
        alert(data.error || "Error deleting record");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to delete record");
    }
  };

  const StatCard = ({ label, value, color, icon: Icon }) => (
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

  const statusIcons = {
    pending: <Clock className="text-yellow-500" size={20} />,
    washed: <Check className="text-green-500" size={20} />,
    cancelled: <X className="text-red-500" size={20} />,
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    washed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Car Wash Tracking
            </h1>
            <p className="text-slate-400 mt-2">Manage and track your daily car washes</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3 rounded-2xl font-semibold transition-all"
          >
            <Plus size={20} />
            Add New Wash
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Today Total"
            value={stats.today.total}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
            icon={Calendar}
          />
          <StatCard
            label="Today Completed"
            value={stats.today.completed}
            color="bg-gradient-to-br from-green-600 to-green-700"
            icon={Check}
          />
          <StatCard
            label="This Month"
            value={stats.month.total}
            color="bg-gradient-to-br from-purple-600 to-purple-700"
            icon={TrendingUp}
          />
          <StatCard
            label="Month Completed"
            value={stats.month.completed}
            color="bg-gradient-to-br from-emerald-600 to-emerald-700"
            icon={Check}
          />
        </div>

        {/* View Toggle & Filters */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* View Mode */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="today">Today's Washes</option>
                <option value="monthly">Monthly Summary</option>
              </select>
            </div>

            {/* Month/Year Selector (for monthly view) */}
            {viewMode === "monthly" && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleDateString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Filter Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="washed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Car Wash Form */}
        {showAddForm && (
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-2">
            <h2 className="text-xl font-bold mb-6">Add New Car Wash</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Car Owner Name *</label>
                <input
                  type="text"
                  required
                  value={formData.carOwnerName}
                  onChange={(e) => setFormData({ ...formData, carOwnerName: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Car Number *</label>
                <input
                  type="text"
                  required
                  value={formData.carNumber}
                  onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none uppercase"
                  placeholder="GJ01AB1234"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Car Model</label>
                <input
                  type="text"
                  value={formData.carModel}
                  onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Honda City"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Car Color</label>
                <input
                  type="text"
                  value={formData.carColor}
                  onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Silver"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Add Wash
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Car Wash List */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold">
              {viewMode === "today" ? "Today's Washes" : `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })} Washes`}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Showing {filteredWashes.length} record{filteredWashes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin">⏳</div>
              <p className="text-slate-400 mt-4">Loading washes...</p>
            </div>
          ) : filteredWashes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No car washes found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Car Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Car Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Model</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWashes.map((wash) => (
                    <tr key={wash.id} className="border-b border-white/5 hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">{wash.car_owner_name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-cyan-400">{wash.car_number}</td>
                      <td className="px-6 py-4 text-slate-300">{wash.car_model || "-"}</td>
                      <td className="px-6 py-4">
                        <select
                          value={wash.status}
                          onChange={(e) => handleStatusChange(wash.id, e.target.value)}
                          className={`rounded-lg px-3 py-1 text-sm font-semibold cursor-pointer border-0 outline-none ${statusColors[wash.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="washed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(wash.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(wash.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarWash;
