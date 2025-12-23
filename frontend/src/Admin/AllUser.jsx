import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

export default function AllUser() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [talukoFilter, setTalukoFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
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
          .select("role, taluko")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setIsSubAdmin(profile.role === "sub-admin");
          if (profile.role === "sub-admin" && profile.taluko) {
            setUserTaluko(profile.taluko);
            setTalukoFilter(profile.taluko); // Auto-filter for sub-admin's taluko
          }
        }
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
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    
    // For sub-admin, always filter by their taluko
    const matchesTaluko = isSubAdmin 
      ? user.taluko?.toLowerCase() === userTaluko?.toLowerCase()
      : talukoFilter === "" || user.taluko?.toLowerCase().includes(talukoFilter.toLowerCase());
    
    const matchesCity = cityFilter === "" || user.city?.toLowerCase().includes(cityFilter.toLowerCase());
    const matchesState = stateFilter === "" || user.state?.toLowerCase().includes(stateFilter.toLowerCase());

    return matchesSearch && matchesRole && matchesTaluko && matchesCity && matchesState;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      customer: "bg-blue-100 text-blue-700 border border-blue-300",
      employee: "bg-green-100 text-green-700 border border-green-300",
      admin: "bg-red-100 text-red-700 border border-red-300",
    };
    return colors[role] || "bg-slate-100 text-slate-700 border border-slate-300";
  };

  const userStats = {
    total: users.length,
    customers: users.filter((u) => u.role === "customer").length,
    employees: users.filter((u) => u.role === "employee").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">All Users 👥</h1>
            <p className="text-slate-600 text-base">Manage and view all system users</p>
          </div>
          <button
            onClick={loadUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Customers</p>
            <p className="text-3xl font-bold text-green-600">{userStats.customers}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Employees</p>
            <p className="text-3xl font-bold text-amber-600">{userStats.employees}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Admins</p>
            <p className="text-3xl font-bold text-red-600">{userStats.admins}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="All">All Roles</option>
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search taluko..."
              value={talukoFilter}
              onChange={(e) => setTalukoFilter(e.target.value)}
              disabled={isSubAdmin}
              className={`w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm ${
                isSubAdmin ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
              title={isSubAdmin ? `Filtered to your taluko: ${userTaluko}` : ""}
            />
            {isSubAdmin && (
              <span className="text-xs text-slate-500 mt-1 block">
                📍 Showing only {userTaluko} users
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search state..."
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        <div className="text-right mb-6">
          <p className="text-sm text-slate-600 font-medium">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-12">
            <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Taluko</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">City</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${user.name || user.email}&background=3b82f6&color=fff`}
                              className="w-8 h-8 rounded-full"
                              alt={user.name || user.email}
                            />
                            {user.name || user.email.split('@')[0] || "User"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{user.phone || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{user.taluko || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{user.city || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
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
  );
}
