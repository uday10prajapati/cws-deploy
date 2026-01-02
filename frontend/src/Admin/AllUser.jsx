import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

// All cities of Gujarat with their talukas
const GUJARAT_CITIES = {
  "Ahmedabad (City)": ["Ahmedabad City East", "Ahmedabad City West", "Daskroi", "Sanand", "Bavla", "Dholka", "Viramgam", "Dhandhuka", "Mandal", "Detroj-Rampura"],
  "Surat (City)": ["Surat City", "Chorasi", "Palsana", "Olpad", "Mangrol", "Umarpada", "Bardoli", "Mahuva"],
  "Vadodara (City)": ["Vadodara City", "Vadodara Rural", "Savli", "Waghodia", "Dabhoi", "Padra", "Karjan", "Shinor"],
  "Rajkot (City)": ["Rajkot City", "Rajkot Rural", "Gondal", "Jetpur", "Jasdan", "Lodhika", "Kotda Sangani"],
  "Bhavnagar (City)": ["Bhavnagar City", "Ghogha", "Sihor", "Palitana", "Talaja", "Gariadhar", "Vallabhipur", "Umrala", "Mahuva"],
  "Jamnagar (City)": ["Jamnagar City", "Jamnagar Rural", "Jodiya", "Kalavad", "Lalpur", "Dhrol"],
  "Junagadh (City)": ["Junagadh City", "Vanthali", "Mangrol", "Manavadar", "Visavadar", "Bhesan", "Mendarda"],
  "Gandhinagar (City)": ["Gandhinagar City", "Dehgam", "Kalol", "Mansa"],
  "Anand (City)": ["Anand", "Petlad", "Borsad", "Umreth", "Sojitra", "Tarapur"],
  "Nadiad (City)": ["Nadiad", "Mehmedabad", "Kheda", "Kathlal", "Kapadvanj", "Matar", "Galteshwar"],
  "Mehsana (City)": ["Mehsana", "Kadi", "Visnagar", "Unjha", "Becharaji", "Vadnagar", "Vijapur"],
  "Palanpur (City)": ["Palanpur", "Deesa", "Dhanera", "Tharad", "Kankrej", "Dantiwada", "Amirgadh", "Vadgam"],
  "Bhuj (City)": ["Bhuj", "Anjar", "Mandvi", "Mundra", "Bhachau", "Rapar", "Abdasa", "Nakhatrana", "Lakhpat"],
  "Surendranagar (City)": ["Surendranagar", "Wadhwan", "Dhrangadhra", "Limbdi", "Chotila", "Sayla", "Muli", "Patdi"],
  "Valsad (City)": ["Valsad", "Pardi", "Umbergaon", "Kaprada", "Dharampur"],
  "Navsari (City)": ["Navsari", "Jalalpore", "Gandevi", "Chikhli"],
  "Porbandar (City)": ["Porbandar", "Ranavav", "Kutiyana"],
  "Amreli (City)": ["Amreli", "Babra", "Lathi", "Savarkundla", "Rajula", "Dhari", "Khambha", "Jafrabad"],
  "Dahod (City)": ["Dahod", "Jhalod", "Limkheda", "Devgadh Baria", "Garbada", "Sanjeli"],
  "Godhra (City)": ["Godhra", "Kalol", "Halol", "Shehera", "Morwa Hadaf"],
  "Vyara (City)": ["Vyara", "Songadh", "Nizar", "Uchchhal", "Valod"],
  "Chhota Udaipur (City)": ["Chhota Udaipur", "Jetpur Pavi", "Kavant", "Nasvadi", "Sankheda"],
  "Bharuch (City)": ["Bharuch", "Ankleshwar", "Jambusar", "Jhagadia", "Amod", "Vagra", "Hansot", "Valia"],
  "Ankleshwar (City)": ["Ankleshwar", "Bharuch", "Jhagadia", "Jambusar", "Amod", "Vagra", "Hansot", "Valia"]
};

export default function AllUser() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [talukoFilter, setTalukoFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [userTaluko, setUserTaluko] = useState(null);
  const [userCity, setUserCity] = useState(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [ishr, setIshr] = useState(false);
  
  // Edit modal states
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [availableTalukas, setAvailableTalukas] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableTalukasForState, setAvailableTalukasForState] = useState([]);
  const [selectedCityForEdit, setSelectedCityForEdit] = useState("");

  useRoleBasedRedirect(["admin", "sub-admin", "hr"]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get taluko, city, and role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, taluko, city, assigned_city")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setIsSubAdmin(profile.role === "sub-admin");
          setIshr(profile.role === "hr");
          
          // Sub-admin: Get city from local storage and filter city-wise
          if (profile.role === "sub-admin") {
            const subAdminCity = localStorage.getItem("city") || profile.city;
            if (subAdminCity) {
              setUserCity(subAdminCity);
              setCityFilter(subAdminCity);
            }
          }
          
          // HR: Get taluko from local storage or profile, and filter taluko-wise
          if (profile.role === "hr") {
            const hrTaluko = localStorage.getItem("taluko") || profile.taluko;
            if (hrTaluko) {
              setUserTaluko(hrTaluko);
              setTalukoFilter(hrTaluko);
            }
          }
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadUsers();
    loadAvailableTalukas();
  }, []);

  // Re-filter users whenever user's taluko or city changes
  useEffect(() => {
    // This triggers re-computation of filteredUsers
  }, [userTaluko, userCity, isSubAdmin, ishr]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/all-users");
      console.log("Fetch response:", response);
      const result = await response.json();
      if (result.success) {
        console.log("Users loaded successfully:", result.data);
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTalukas = async () => {
    try {
      // Get unique talukas from all users
      const response = await fetch("http://localhost:5000/admin/all-users");
      const result = await response.json();
      if (result.success && result.data) {
        const talukas = [...new Set(result.data.map(u => u.taluko).filter(Boolean))].sort();
        setAvailableTalukas(talukas);
      }
    } catch (error) {
      console.error("Error loading talukas:", error);
    }
  };

  const loadCitiesAndTalukas = async () => {
    try {
      // Get unique cities and talukas from all users
      const response = await fetch("http://localhost:5000/admin/all-users");
      const result = await response.json();
      if (result.success && result.data) {
        const cities = [...new Set(result.data.map(u => u.city).filter(Boolean))].sort();
        const talukas = [...new Set(result.data.map(u => u.taluko).filter(Boolean))].sort();
        setAvailableCities(cities);
        setAvailableTalukasForState(talukas);
      }
    } catch (error) {
      console.error("Error loading cities and talukas:", error);
    }
  };

  const openEditModal = (userRecord) => {
    // Check if current user is admin or sub-admin
    if (!userRole) return;

    // Only admin and sub-admin can edit
    if (userRole.toLowerCase() !== "admin" && userRole.toLowerCase() !== "sub-admin") {
      alert("You don't have permission to edit users");
      return;
    }

    // If sub-admin, only allow editing HR users
    if (userRole.toLowerCase() === "sub-admin" && userRecord.role?.toLowerCase() !== "hr") {
      alert("Sub-admins can only edit HR users");
      return;
    }

    setEditingUser(userRecord);
    setEditFormData({
      city: userRecord.city || "",
      taluko: userRecord.taluko || "",
    });
    setSelectedCityForEdit(userRecord.city || "");
    
    // Load cities and talukas for the modal
    if (availableCities.length === 0) {
      loadCitiesAndTalukas();
    }
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditFormData({});
    setSelectedCityForEdit("");
  };

  // Get talukas for selected city
  const filteredTalukasForCity = selectedCityForEdit
    ? users
        .filter(u => u.city?.toLowerCase() === selectedCityForEdit?.toLowerCase())
        .map(u => u.taluko)
        .filter(Boolean)
        .filter((taluko, index, self) => self.indexOf(taluko) === index)
        .sort()
    : [];

  const saveUserChanges = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          taluko: editFormData.taluko || null,
          assigned_city: editFormData.assigned_city || null,
        })
        .eq("id", editingUser.id);
      
      if (error) throw error;
      
      // Update local user list
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...editFormData }
          : u
      ));
      
      closeEditModal();
      alert("✅ User updated successfully!");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("❌ Error updating user: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    // Handle washer role - check employee_type
    let matchesRole = false;
    if (roleFilter === "All") {
      matchesRole = true;
    } else if (roleFilter === "washer") {
      matchesRole = user.role === "employee" && user.employee_type === "washer";
    } else {
      matchesRole = user.role === roleFilter;
    }
    
    // Filter based on role
    let matchesTaluko, matchesCity;
    
    if (ishr && userTaluko) {
      // HR: Show only users from their assigned taluko (from local storage)
      matchesTaluko = user.taluko?.toLowerCase() === userTaluko?.toLowerCase();
      matchesCity = true;
    } else if (isSubAdmin && userCity) {
      // Sub-admin: Show only users from their city (from local storage)
      matchesCity = user.city?.toLowerCase() === userCity?.toLowerCase();
      matchesTaluko = true;
    } else {
      // Admin: Can filter freely
      matchesTaluko = talukoFilter === "" || user.taluko?.toLowerCase().includes(talukoFilter.toLowerCase());
      matchesCity = cityFilter === "" || user.city?.toLowerCase().includes(cityFilter.toLowerCase());
    }
    
    const matchesState = stateFilter === "" || user.state?.toLowerCase().includes(stateFilter.toLowerCase());

    return matchesSearch && matchesRole && matchesTaluko && matchesCity && matchesState;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      customer: "bg-blue-100 text-blue-700 border border-blue-300",
      employee: "bg-green-100 text-green-700 border border-green-300",
      washer: "bg-emerald-100 text-emerald-700 border border-emerald-300",
      admin: "bg-red-100 text-red-700 border border-red-300",
      "sub-admin": "bg-orange-100 text-orange-700 border border-orange-300",
      hr: "bg-purple-100 text-purple-700 border border-purple-300",
    };
    return colors[role] || "bg-slate-100 text-slate-700 border border-slate-300";
  };

  const userStats = {
    total: users.length,
    customers: users.filter((u) => u.role === "customer").length,
    employees: users.filter((u) => u.role === "employee" && u.employee_type !== "washer").length,
    washers: users.filter((u) => u.role === "employee" && u.employee_type === "washer").length,
    admins: users.filter((u) => u.role === "admin").length,
    subAdmins: users.filter((u) => u.role === "sub-admin").length,
    hr: users.filter((u) => u.role === "hr").length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
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
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
          </div>
          <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Customers</p>
            <p className="text-3xl font-bold text-green-600">{userStats.customers}</p>
          </div>
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Employees</p>
            <p className="text-3xl font-bold text-amber-600">{userStats.employees}</p>
          </div>
          <div className="bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Washers</p>
            <p className="text-3xl font-bold text-emerald-600">{userStats.washers}</p>
          </div>
          <div className="bg-linear-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Admins</p>
            <p className="text-3xl font-bold text-red-600">{userStats.admins}</p>
          </div>
          <div className="bg-linear-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Sub-Admins</p>
            <p className="text-3xl font-bold text-red-600">{userStats.subAdmins}</p>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">HR</p>
            <p className="text-3xl font-bold text-purple-600">{userStats.hr}</p>
          </div>
        </div>

        {/* SUB-ADMIN TALUKO & CITY BREAKDOWN */}
        {isSubAdmin && userTaluko && (
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
                      {users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase()).length}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-slate-600 font-semibold">Customers</p>
                    <p className="text-xl font-bold text-green-600">
                      {users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase() && u.role === "customer").length}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-slate-600 font-semibold">Employees</p>
                    <p className="text-xl font-bold text-amber-600">
                      {users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase() && (u.role === "employee" || u.role === "washer")).length}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-slate-600 font-semibold">Cities in Taluko</p>
                    <p className="text-xl font-bold text-purple-600">
                      {[...new Set(users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase()).map(u => u.city).filter(Boolean))].length}
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
                {[...new Set(users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase()).map(u => u.city).filter(Boolean))].map(city => (
                  <div key={city} className="bg-white p-3 rounded-lg border border-emerald-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-900">{city}</span>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                      {users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase() && u.city?.toLowerCase() === city?.toLowerCase()).length} users
                    </span>
                  </div>
                ))}
                {[...new Set(users.filter(u => u.taluko?.toLowerCase() === userTaluko?.toLowerCase()).map(u => u.city).filter(Boolean))].length === 0 && (
                  <p className="text-slate-500 text-center py-4">No cities found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HR TALUKO DETAILS ONLY - FROM THEIR CITY */}
        {ishr && userCity && (
          <div className="mb-8 bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              📍 Taluko Details (Your Access)
            </h3>
            <p className="text-sm text-slate-600 mb-6">Showing all talukas you have access to</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...new Set(users.filter(u => u.city?.toLowerCase() === userCity?.toLowerCase()).map(u => u.taluko).filter(Boolean))].map(taluko => {
                // Only show users from HR's city for this taluko
                const talukaUsers = users.filter(u => 
                  u.taluko?.toLowerCase() === taluko?.toLowerCase() && 
                  u.city?.toLowerCase() === userCity?.toLowerCase()
                );
                const customers = talukaUsers.filter(u => u.role === "customer").length;
                const employees = talukaUsers.filter(u => u.role === "employee" || u.role === "washer").length;
                
                return (
                  <div key={taluko} className="bg-white border border-purple-200 rounded-xl p-4 shadow-md hover:shadow-lg transition">
                    <p className="font-bold text-slate-900 text-lg mb-3">📍 {taluko}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <span className="text-sm text-slate-700">Total Users</span>
                        <span className="font-bold text-purple-600">{talukaUsers.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm text-slate-700">Customers</span>
                        <span className="font-bold text-blue-600">{customers}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm text-slate-700">Employees</span>
                        <span className="font-bold text-green-600">{employees}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {[...new Set(users.filter(u => u.city?.toLowerCase() === userCity?.toLowerCase()).map(u => u.taluko).filter(Boolean))].length === 0 && (
                <p className="text-slate-500 col-span-full text-center py-4">No talukas found</p>
              )}
            </div>
          </div>
        )}

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
              <option value="washer">Washer</option>
              <option value="admin">Admin</option>
              <option value="sub-admin">Sub-Admin</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={ishr ? "Talukas in your city..." : "Search taluko..."}
              value={talukoFilter}
              onChange={(e) => setTalukoFilter(e.target.value)}
              disabled={isSubAdmin || ishr}
              className={`w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm ${
                isSubAdmin || ishr ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
              title={isSubAdmin ? `Filtered to your taluko: ${userTaluko}` : ishr ? `Showing all talukas in ${userCity}` : ""}
            />
            {isSubAdmin && (
              <span className="text-xs text-slate-500 mt-1 block">
                📍 Showing only {userTaluko} users
              </span>
            )}
            {ishr && (
              <span className="text-xs text-slate-500 mt-1 block">
                📍 Showing all talukas in {userCity}
              </span>
            )}
          </div>

          {/* City Filter - Hidden from HR */}
          {!ishr && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          )}

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
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
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
    user.role === "employee" && user.employee_type === "washer"
      ? "washer"
      : user.role
  )}`}
>
  {user.role === "employee" && user.employee_type === "washer"
    ? "washer"
    : user.role}
</span>

                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {(userRole?.toLowerCase() === "admin" || 
                            (userRole?.toLowerCase() === "sub-admin" && user.role?.toLowerCase() === "hr")) && (
                            <button
                              onClick={() => openEditModal(user)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit User</h2>
              
              {/* User Info Display */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Name</p>
                <p className="text-lg font-bold text-slate-900">{editingUser.name || editingUser.email}</p>
              </div>

              {/* Display Current Role Assignment */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 mb-1">User Role:</p>
                <p className="text-sm font-bold text-blue-900">{editingUser.role}</p>
              </div>

              {/* City Field - For All Users */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  🏙️ City
                </label>
                <select
                  value={selectedCityForEdit}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setSelectedCityForEdit(newCity);
                    setEditFormData({ ...editFormData, city: newCity, taluko: "" });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select City --</option>
                  {Object.keys(GUJARAT_CITIES).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Taluko Field - Filtered by City */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  📍 Taluko
                </label>
                <select
                  value={editFormData.taluko || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, taluko: e.target.value })}
                  disabled={!selectedCityForEdit}
                  className={`w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 ${
                    !selectedCityForEdit ? "bg-slate-100 cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <option value="">{selectedCityForEdit ? "-- Select Taluko --" : "-- Select City First --"}</option>
                  {selectedCityForEdit && GUJARAT_CITIES[selectedCityForEdit] ? (
                    GUJARAT_CITIES[selectedCityForEdit].map((taluko) => (
                      <option key={taluko} value={taluko}>
                        {taluko}
                      </option>
                    ))
                  ) : null}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedCityForEdit ? `Select a taluko in ${selectedCityForEdit}` : "Please select a city first"}
                </p>
                {editingUser.role?.toLowerCase() === "washer" && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2">
                    ✅ Washer will operate in the assigned taluko
                  </p>
                )}
              </div>

              {/* City Field - Only for Sub-Admins */}
              {editingUser.role?.toLowerCase() === "sub-admin" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    🏙️ Assign City
                  </label>
                  <input
                    type="text"
                    value={editFormData.assigned_city || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, assigned_city: e.target.value })}
                    placeholder="Enter city name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Sub-admin will have access to ALL talukas within this city
                  </p>
                </div>
              )}



              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveUserChanges}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition ${
                    isSaving 
                      ? "bg-blue-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
