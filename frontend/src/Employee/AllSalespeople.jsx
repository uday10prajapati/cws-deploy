import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

import { FiSearch, FiFilter, FiPhone, FiMapPin, FiUser, FiMenu, FiTruck } from "react-icons/fi";

export default function AllSalespeople() {
  useRoleBasedRedirect("employee");
  
  const navigate = useNavigate();
  const [salespeople, setSalespeople] = useState([]);
  const [filteredSalespeople, setFilteredSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterTaluka, setFilterTaluka] = useState("");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignedTalukas, setAssignedTalukas] = useState([]);

  // Get allowed areas based on user role
  const getAllowedAreas = () => {
    if (userRole === "hr-general" && assignedTalukas.length > 0) {
      // For HR-General, return only assigned talukas
      return assignedTalukas;
    }
    // For others, return all talukas from salespeople
    return [...new Set(salespeople.map(s => s.taluka).filter(Boolean))];
  };

  useEffect(() => {
    const loadSalespeople = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;
        
        setUser(auth.user);

        // Fetch user profile to get employee type
        const { data: profile } = await supabase
          .from("profiles")
          .select("employee_type")
          .eq("id", auth.user.id)
          .single();
        
        if (profile?.employee_type) {
          setUserRole(profile.employee_type);

          // If HR-General, fetch assigned talukas
          if (profile.employee_type === "hr-general") {
            const { data: assignments } = await supabase
              .from("user_role_assignments")
              .select("assigned_talukas")
              .eq("user_id", auth.user.id)
              .eq("role", "hr-general")
              .maybeSingle();
            
            if (assignments?.assigned_talukas) {
              setAssignedTalukas(assignments.assigned_talukas);
            }
          }
        }

        // Fetch all salespeople (employees with employee_type = 'sales')
        const response = await fetch("http://localhost:5000/customer/salespeople");
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Sales Persons loaded:", data.data);
          setSalespeople(data.data || []);
          setFilteredSalespeople(data.data || []);
        }
      } catch (err) {
        console.error("Error loading salespeople:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSalespeople();
  }, []);

  // Filter salespeople based on search and filters
  useEffect(() => {
    let filtered = salespeople;

    console.log("=== FILTERING DEBUG ===");
    console.log("User Role:", userRole);
    console.log("Assigned Talukas:", assignedTalukas);
    console.log("Total Salespeople:", filtered.length);
    
    if (filtered.length > 0) {
      console.log("Salespeople data:", filtered.map(s => ({ name: s.name, taluka: s.taluka })));
    }

    // If HR-General, filter by assigned talukas only
    if (userRole === "hr-general" && assignedTalukas.length > 0) {
      const talukaLowerCase = assignedTalukas.map(t => t.toLowerCase());
      console.log("Talukas (lowercase):", talukaLowerCase);
      
      filtered = filtered.filter(s => {
        // Try multiple field variations (taluko, taluka)
        const salespersonTaluka = (s.taluka || s.taluko || "").toLowerCase();
        const matches = talukaLowerCase.includes(salespersonTaluka);
        console.log(`Checking ${s.name}: taluka="${s.taluka}" taluko="${s.taluko}" combined="${salespersonTaluka}" - Match: ${matches}`);
        console.log(`  Full object: `, { name: s.name, taluka: s.taluka, taluko: s.taluko, city: s.city });
        return matches;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCity) {
      filtered = filtered.filter(s => s.city === filterCity);
    }

    if (filterTaluka) {
      filtered = filtered.filter(s => s.taluka === filterTaluka);
    }

    console.log("Final filtered count:", filtered.length);
    console.log("=== END DEBUG ===");
    
    setFilteredSalespeople(filtered);
  }, [searchTerm, filterCity, filterTaluka, salespeople, userRole, assignedTalukas]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
  

      <main className="pt-20 px-4 md:px-6 py-10">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50"
        >
          <FiMenu size={24} className="text-slate-700" />
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
              Sales Team 👥
            </h1>
            <p className="text-slate-600 text-base">
              View and manage your sales team members and their assigned areas
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-slate-200">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
              <p className="text-slate-600 text-sm font-medium">Total Salespeople</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{salespeople.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-emerald-600">
              <p className="text-slate-600 text-sm font-medium">Filtered Results</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{filteredSalespeople.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
              <p className="text-slate-600 text-sm font-medium">Talukas Covered</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {userRole === "hr-general" ? assignedTalukas.length : new Set(salespeople.map(s => s.taluka).filter(Boolean)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-600">
              <p className="text-slate-600 text-sm font-medium">Your Role</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 capitalize">{userRole || "Loading..."}</p>
            </div>
          </div>

          {/* Salespeople Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading salespeople...</p>
            </div>
          ) : filteredSalespeople.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-slate-200">
              <FiTruck size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-medium">No salespeople found</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalespeople.map((salesperson) => (
                <div
                  key={salesperson.id}
                  onClick={() => navigate(`/employee/salesperson/${salesperson.id}`)}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200"
                >
                  <div className="bg-linear-to-r from-emerald-600 to-green-600 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-2xl font-bold">{salesperson.name?.charAt(0) || "S"}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold truncate">{salesperson.name}</h3>
                        <p className="text-green-100 text-sm">Salesperson</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3 text-slate-700">
                      <FiPhone className="text-emerald-600 shrink-0" size={18} />
                      <span className="text-sm">{salesperson.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <FiUser className="text-emerald-600 shrink-0" size={18} />
                      <span className="text-sm truncate">{salesperson.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <FiMapPin className="text-emerald-600 shrink-0" size={18} />
                      <span className="text-sm">{salesperson.city} {salesperson.taluka && `• ${salesperson.taluka}`}</span>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employee/salesperson/${salesperson.id}`);
                        }}
                        className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                      >
                        View & Assign Areas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
