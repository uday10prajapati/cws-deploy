import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw, FiFilter, FiMenu, FiLogOut, FiChevronLeft, FiHome, FiClipboard, FiUsers, FiDollarSign, FiTrendingUp, FiSettings, FiCreditCard, FiBell, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaCar } from "react-icons/fa";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function AllUser() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/all-users");
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesRole = roleFilter === "All" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      customer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      employee: "bg-green-500/20 text-green-300 border-green-500/30",
      admin: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[role] || "bg-slate-500/20 text-slate-300";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const adminMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/admin/dashboard" },
    { name: "Bookings", icon: <FiClipboard />, link: "/admin/bookings" },
    { name: "Users", icon: <FiUsers />, link: "/admin/users" },
    { name: "Earnings", icon: <FiDollarSign />, link: "/admin/earnings" },
    { name: "Cars", icon: <FaCar />, link: "/admin/cars" },
    { name: "Revenue", icon: <FiDollarSign />, link: "/admin/revenue" },
    { name: "Analytics", icon: <FiTrendingUp />, link: "/admin/analytics" },
    { name: "Bank Account", icon: <FiCreditCard />, link: "/admin/bank-account" },
    { name: "Settings", icon: <FiSettings />, link: "/admin/settings" },
  ];

  const userStats = {
    total: users.length,
    customers: users.filter((u) => u.role === "customer").length,
    employees: users.filter((u) => u.role === "employee").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          CarWash+
        </h1>
        <FiMenu className="text-2xl cursor-pointer" onClick={() => setSidebarOpen(true)} />
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
        <div
          className="hidden lg:flex items-center justify-between p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="font-extrabold text-lg">{collapsed ? "CW" : "CarWash+"}</span>
          {!collapsed && <FiChevronLeft className="text-slate-400" />}
        </div>

        <nav className="mt-4 px-3 pb-24">
          {adminMenu.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-4 px-3 py-2 rounded-lg mb-2 font-medium transition-all 
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
          ))}
        </nav>

        {/* LOGOUT */}
        <div
          onClick={handleLogout}
          className={`
            absolute bottom-6 left-3 right-3 bg-red-600 hover:bg-red-700 
            px-4 py-2 rounded-lg cursor-pointer flex items-center gap-3 shadow-lg transition-all
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
        <header className="hidden lg:flex h-16 bg-slate-900/90 border-b border-blue-500/20 items-center justify-between px-8 sticky top-0 z-20 shadow-lg">
          <h1 className="text-2xl font-bold">All Users</h1>

          <div className="flex items-center gap-8 relative">
            {/* NOTIFICATIONS BELL */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xl text-slate-300 hover:text-blue-400 transition relative group"
            >
              <FiBell />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto top-12">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white transition">
                    <FiX />
                  </button>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition last:border-b-0">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{notif.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            )}

            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=3b82f6&color=fff`}
              className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer hover:border-blue-400 transition"
              alt="Profile"
            />
          </div>
        </header>

        {/* ▓▓▓ PAGE CONTENT ▓▓▓ */}
        <main className="p-4 md:p-8 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Users</h1>
            <p className="text-slate-400">Total users: {users.length}</p>
          </div>
          <button
            onClick={loadUsers}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-blue-400">{userStats.total}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Customers</p>
            <p className="text-3xl font-bold text-green-400">{userStats.customers}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Employees</p>
            <p className="text-3xl font-bold text-yellow-400">{userStats.employees}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Admins</p>
            <p className="text-3xl font-bold text-red-400">{userStats.admins}</p>
          </div>
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
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option>All</option>
              <option>customer</option>
              <option>employee</option>
              <option>admin</option>
            </select>
          </div>

          <div className="text-right pt-2">
            <p className="text-sm text-slate-400">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-12">
            <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-400" />
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${user.full_name}&background=3b82f6&color=fff`}
                              className="w-8 h-8 rounded-full"
                              alt={user.full_name}
                            />
                            {user.full_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.phone || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">{user.city || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "N/A"}
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
    </div>
  );
}
