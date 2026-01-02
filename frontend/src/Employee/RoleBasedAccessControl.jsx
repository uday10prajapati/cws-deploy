import { useEffect, useState } from "react";
import { FiRefreshCw, FiX, FiCheck, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  ROLES,
  getUserRoleAndPermissions,
  assignCitiesToSubGeneral,
  getSubGeneralsUnderGeneral,
  getUsersByRole,
} from "../utils/rbacUtils";

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

export default function RoleBasedAccessControl() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sub-General management
  const [subGenerals, setSubGenerals] = useState([]);
  const [availableSubGenerals, setAvailableSubGenerals] = useState([]);
  const [editingSubGeneral, setEditingSubGeneral] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter
  const [searchTerm, setSearchTerm] = useState("");

  useRoleBasedRedirect(["employee"]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("employee_type")
          .eq("id", auth.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.employee_type);
          if (profile.employee_type === "general") {
            loadSubGenerals();
            loadAvailableSubGenerals();
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const loadSubGenerals = async () => {
    try {
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select(`user_id, assigned_cities, updated_at, profiles!inner(id, email, name)`)
        .eq("role", ROLES.SUB_GENERAL);

      if (error) throw error;
      setSubGenerals(data || []);
    } catch (error) {
      console.error("Error loading sub-generals:", error);
    }
  };

  const loadAvailableSubGenerals = async () => {
    try {
      const subGeneralUsers = await getUsersByRole("sub-general");
      setAvailableSubGenerals(subGeneralUsers);
    } catch (error) {
      console.error("Error loading available sub-generals:", error);
    }
  };

  const openEditModal = (subGeneral) => {
    setEditingSubGeneral(subGeneral);
    setEditFormData({
      user_id: subGeneral.user_id,
      assigned_cities: subGeneral.assigned_cities || [],
    });
  };

  const closeEditModal = () => {
    setEditingSubGeneral(null);
    setEditFormData({});
  };

  const toggleCity = (city) => {
    const currentCities = editFormData.assigned_cities || [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter((c) => c !== city)
      : [...currentCities, city];
    
    setEditFormData({ ...editFormData, assigned_cities: newCities });
  };

  const saveSubGeneralChanges = async () => {
    if (!editFormData.assigned_cities || editFormData.assigned_cities.length === 0) {
      alert("Please assign at least one city");
      return;
    }

    setIsSaving(true);
    try {
      const result = await assignCitiesToSubGeneral(
        editFormData.user_id,
        editFormData.assigned_cities
      );

      if (!result.success) throw result.error;

      loadSubGenerals();
      closeEditModal();
      alert("✅ Sub-General cities updated successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSubGeneralAssignment = async (userId) => {
    if (!confirm("Remove this Sub-General's city assignments?")) return;

    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("role", ROLES.SUB_GENERAL);

      if (error) throw error;

      loadSubGenerals();
      alert("✅ Sub-General assignment removed!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const filteredSubGenerals = subGenerals.filter((sg) =>
    sg.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sg.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiRefreshCw className="text-4xl animate-spin text-blue-600" />
      </div>
    );
  }

  // Only General role can access this
  if (userRole !== "general") {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarNew />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600">Only General (Super Admin) can access role management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">Role-Based Access Control 🔐</h1>
            <p className="text-slate-600 text-base">Manage role hierarchy and geographic permissions</p>
          </div>
          <button
            onClick={() => {
              loadSubGenerals();
              loadAvailableSubGenerals();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* HIERARCHY VISUALIZATION */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📊 Role Hierarchy</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 px-4 py-3 bg-red-100 border-2 border-red-500 rounded-lg font-bold text-red-700 text-center">
                🔴 General
              </div>
              <div className="text-slate-600 font-semibold">Super Admin - Access to ALL cities & talukas</div>
            </div>
            <div className="flex items-center gap-8 ml-8">
              <div className="w-1 h-12 bg-slate-300"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 px-4 py-3 bg-orange-100 border-2 border-orange-500 rounded-lg font-bold text-orange-700 text-center">
                🟠 Sub-General
              </div>
              <div className="text-slate-600 font-semibold">Access to assigned cities & all their talukas</div>
            </div>
            <div className="flex items-center gap-8 ml-8">
              <div className="w-1 h-12 bg-slate-300"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 px-4 py-3 bg-yellow-100 border-2 border-yellow-500 rounded-lg font-bold text-yellow-700 text-center">
                🟡 HR-General
              </div>
              <div className="text-slate-600 font-semibold">Access to assigned talukas only</div>
            </div>
            <div className="flex items-center gap-8 ml-8">
              <div className="w-1 h-12 bg-slate-300"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 px-4 py-3 bg-green-100 border-2 border-green-500 rounded-lg font-bold text-green-700 text-center">
                🟢 Salesman
              </div>
              <div className="text-slate-600 font-semibold">Access to single assigned taluka only</div>
            </div>
          </div>
        </div>

        {/* SUB-GENERAL MANAGEMENT */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-slate-200">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
            <h2 className="text-2xl font-bold text-orange-900">🟠 Sub-General Management</h2>
            <p className="text-orange-700 text-sm mt-1">Assign cities to Sub-Generals</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {filteredSubGenerals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg">No Sub-Generals assigned yet</p>
                <p className="text-sm mt-1">Create Sub-General users first in the system</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubGenerals.map((subGeneral) => (
                  <div
                    key={subGeneral.user_id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{subGeneral.profiles?.name}</p>
                        <p className="text-sm text-slate-500">{subGeneral.profiles?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(subGeneral)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => deleteSubGeneralAssignment(subGeneral.user_id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiTrash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Assigned Cities:</p>
                      <div className="flex flex-wrap gap-2">
                        {subGeneral.assigned_cities && subGeneral.assigned_cities.length > 0 ? (
                          subGeneral.assigned_cities.map((city) => (
                            <span
                              key={city}
                              className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold"
                            >
                              {city}
                            </span>
                          ))
                        ) : (
                          <span className="text-amber-600 font-semibold text-sm">⚠️ No cities assigned</span>
                        )}
                      </div>
                    </div>

                    {subGeneral.updated_at && (
                      <p className="text-xs text-slate-400 mt-3">
                        Last updated: {new Date(subGeneral.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingSubGeneral && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Cities to Sub-General</h2>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Sub-General</p>
                <p className="text-lg font-bold text-slate-900">{editingSubGeneral.profiles?.name}</p>
                <p className="text-sm text-slate-500">{editingSubGeneral.profiles?.email}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-900 mb-4">Select Cities (Can select multiple):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {Object.keys(GUJARAT_CITIES).map((city) => (
                    <label
                      key={city}
                      className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={(editFormData.assigned_cities || []).includes(city)}
                        onChange={() => toggleCity(city)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-slate-900 font-medium">{city}</span>
                      <span className="ml-auto text-xs text-slate-500">
                        {GUJARAT_CITIES[city].length} talukas
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  Selected: {editFormData.assigned_cities?.length || 0} cities
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSubGeneralChanges}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isSaving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
