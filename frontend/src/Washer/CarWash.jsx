import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Check,
  Calendar,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiHome,
  FiBell,
  FiMenu,
  FiChevronLeft,
  FiLogOut,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";

const CarWash = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [stats, setStats] = useState({
    today: { total: 0, completed: 0, pending: 0, cancelled: 0 },
    month: { total: 0, completed: 0, pending: 0, cancelled: 0 },
  });

  const [washes, setWashes] = useState([]);
  const [filteredWashes, setFilteredWashes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("today");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    carOwnerName: "",
    carModel: "",
    carNumber: "",
    carColor: "",
    notes: "",
  });

  const employeeId = localStorage.getItem("userId");

  // Load initial data
  useEffect(() => {
    if (employeeId) {
      fetchStats();
      fetchTodayWashes();
    }
  }, [employeeId]);

  // Apply filters
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredWashes(washes);
    } else {
      setFilteredWashes(washes.filter((w) => w.status === filterStatus));
    }
  }, [washes, filterStatus]);

  // Fetch on view mode change
  useEffect(() => {
    if (viewMode === "today") {
      fetchTodayWashes();
    } else {
      fetchMonthlyWashes();
    }
  }, [viewMode, selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/car-wash/stats/${employeeId}`);
      const data = await res.json();
      if (data.success) {
        setStats({ today: data.today, month: data.month });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    washed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/carwash" },
    { name: "My Jobs", icon: <span>💼</span>, link: "/washer/jobs" },
    { name: "Loyalty Points", icon: <span>⭐</span>, link: "/washer/loyalty-points" },
    { name: "Documents", icon: <span>📄</span>, link: "/washer/documents" },
    { name: "Demo Videos", icon: <span>🎬</span>, link: "/washer/demo-videos" },
    { name: "Profile", icon: <FiUsers />, link: "/profile" },
  ];

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
          {employeeMenu.map((item) => (
            <a
              key={item.name}
              href={item.link}
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
            </a>
          ))}
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
          {!collapsed && "Logout"}
        </div>
      </aside>

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div className={`flex-1 transition-all duration-300 mt-14 lg:mt-0 ${collapsed ? "lg:ml-16" : "lg:ml-56"}`}>

        {/* ▓▓▓ NAVBAR ▓▓▓ */}
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 
        items-center justify-between px-8 sticky top-0 z-20 shadow-lg">

          <h1 className="text-2xl font-bold">
            Car Wash Tracking
          </h1>

          <div className="flex items-center gap-8">
            <button className="text-xl text-slate-300 hover:text-blue-400 transition">
              <FiBell />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=Employee&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-8">

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">Car Wash Tracking</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and track your daily car washes</p>
          </div>

          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-all text-white"
            >
              <Plus size={20} />
              Add New Wash
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-2">Today Total</p>
              <p className="text-3xl font-bold text-white">{stats.today.total}</p>
              <p className="text-green-400 text-xs mt-2">+20%</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-2">Today Completed</p>
              <p className="text-3xl font-bold text-white">{stats.today.completed}</p>
              <p className="text-green-400 text-xs mt-2">Washes</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-2">This Month</p>
              <p className="text-3xl font-bold text-white">{stats.month.total}</p>
              <p className="text-green-400 text-xs mt-2">Total</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-2">Month Completed</p>
              <p className="text-3xl font-bold text-white">{stats.month.completed}</p>
              <p className="text-green-400 text-xs mt-2">Completed</p>
            </div>
          </div>

          {/* View Toggle & Filters */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">View Mode</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="today">Today's Washes</option>
                  <option value="monthly">Monthly Summary</option>
                </select>
              </div>

              {viewMode === "monthly" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6 text-white">Add New Car Wash</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Car Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.carOwnerName}
                    onChange={(e) => setFormData({ ...formData, carOwnerName: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    placeholder="GJ01AB1234"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Car Model</label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Honda City"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Car Color</label>
                  <input
                    type="text"
                    value={formData.carColor}
                    onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Silver"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold transition-all text-white"
                  >
                    Add Wash
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-semibold transition-all text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Car Wash List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {viewMode === "today"
                  ? "Today's Washes"
                  : `${new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })} Washes`}
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
                    <tr className="border-b border-slate-700 bg-slate-900">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Car Owner</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Car Number</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Model</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWashes.map((wash) => (
                      <tr key={wash.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-white">{wash.car_owner_name}</td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-400">{wash.car_number}</td>
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
        </main>
      </div>
    </div>
  );
};

export default CarWash;
