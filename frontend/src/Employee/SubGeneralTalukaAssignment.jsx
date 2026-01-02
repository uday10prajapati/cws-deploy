import { useEffect, useState } from "react";
import { FiRefreshCw, FiX, FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  ROLES,
  assignTalukasToHRGeneral,
  getHRGeneralsUnderSubGeneral,
  getUsersByRole,
  validateTalukasBelongToCity,
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

export default function SubGeneralTalukaAssignment() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignedCities, setAssignedCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hrGenerals, setHrGenerals] = useState([]);
  const [availableHRGenerals, setAvailableHRGenerals] = useState([]);
  const [editingHRGeneral, setEditingHRGeneral] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedCity, setSelectedCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

        if (profile && profile.employee_type === "sub-general") {
          setUserRole(profile.employee_type);

          // Fetch assigned cities
          const { data: assignment } = await supabase
            .from("user_role_assignments")
            .select("assigned_cities")
            .eq("user_id", auth.user.id)
            .eq("role", ROLES.SUB_GENERAL)
            .single();

          if (assignment?.assigned_cities) {
            setAssignedCities(assignment.assigned_cities);
            setSelectedCity(assignment.assigned_cities[0] || "");
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (userRole === "sub-general" && assignedCities.length > 0) {
      loadHRGenerals();
      loadAvailableHRGenerals();
    }
  }, [userRole, assignedCities]);

  const loadHRGenerals = async () => {
    try {
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select(`user_id, assigned_talukas, assigned_cities, updated_at, profiles!inner(id, email, name)`)
        .eq("role", ROLES.HR_GENERAL)
        .in("assigned_cities", assignedCities);

      if (error) throw error;
      setHrGenerals(data || []);
    } catch (error) {
      console.error("Error loading HR-Generals:", error);
    }
  };

  const loadAvailableHRGenerals = async () => {
    try {
      const hrGeneralUsers = await getUsersByRole("hr-general");
      setAvailableHRGenerals(hrGeneralUsers);
    } catch (error) {
      console.error("Error loading available HR-Generals:", error);
    }
  };

  const openEditModal = (hrGeneral) => {
    setEditingHRGeneral(hrGeneral);
    setEditFormData({
      user_id: hrGeneral.user_id,
      assigned_talukas: hrGeneral.assigned_talukas || [],
    });
    setSelectedCity(hrGeneral.assigned_cities?.[0] || assignedCities[0]);
  };

  const closeEditModal = () => {
    setEditingHRGeneral(null);
    setEditFormData({});
    setSelectedCity("");
  };

  const toggleTaluka = (taluka) => {
    const currentTalukas = editFormData.assigned_talukas || [];
    const newTalukas = currentTalukas.includes(taluka)
      ? currentTalukas.filter((t) => t !== taluka)
      : [...currentTalukas, taluka];

    setEditFormData({ ...editFormData, assigned_talukas: newTalukas });
  };

  const saveHRGeneralChanges = async () => {
    if (!editFormData.assigned_talukas || editFormData.assigned_talukas.length === 0) {
      alert("Please assign at least one taluka");
      return;
    }

    // Validate talukas belong to selected city
    if (!validateTalukasBelongToCity(GUJARAT_CITIES, selectedCity, editFormData.assigned_talukas)) {
      alert("Invalid talukas selected for the city");
      return;
    }

    setIsSaving(true);
    try {
      const result = await assignTalukasToHRGeneral(
        editFormData.user_id,
        editFormData.assigned_talukas,
        selectedCity
      );

      if (!result.success) throw result.error;

      loadHRGenerals();
      closeEditModal();
      alert("✅ HR-General talukas updated successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHRGeneralAssignment = async (userId) => {
    if (!confirm("Remove this HR-General's taluka assignments?")) return;

    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("role", ROLES.HR_GENERAL);

      if (error) throw error;

      loadHRGenerals();
      alert("✅ HR-General assignment removed!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const filteredHRGenerals = hrGenerals.filter((hg) =>
    hg.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hg.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiRefreshCw className="text-4xl animate-spin text-blue-600" />
      </div>
    );
  }

  if (userRole !== "sub-general") {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarNew />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600">Only Sub-General can access this page.</p>
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
              🟡 HR-General Taluka Assignment
            </h1>
            <p className="text-slate-600 text-base">Assign talukas to HR-Generals within your cities</p>
            <p className="text-sm text-orange-600 font-semibold mt-2">
              📍 Your Cities: {assignedCities.join(", ")}
            </p>
          </div>
          <button
            onClick={() => {
              loadHRGenerals();
              loadAvailableHRGenerals();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-linear-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total HR-Generals</p>
            <p className="text-3xl font-bold text-yellow-600">{filteredHRGenerals.length}</p>
          </div>
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg">
            <p className="text-slate-600 text-sm font-semibold mb-2">Assigned Talukas</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredHRGenerals.reduce((sum, hg) => sum + (hg.assigned_talukas?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* HR-GENERAL MANAGEMENT */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="bg-linear-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-yellow-200">
            <h2 className="text-2xl font-bold text-yellow-900">🟡 HR-General Management</h2>
            <p className="text-yellow-700 text-sm mt-1">Assign talukas from your cities</p>
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

            {filteredHRGenerals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg">No HR-Generals assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHRGenerals.map((hrGeneral) => (
                  <div
                    key={hrGeneral.user_id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{hrGeneral.profiles?.name}</p>
                        <p className="text-sm text-slate-500">{hrGeneral.profiles?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(hrGeneral)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => deleteHRGeneralAssignment(hrGeneral.user_id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiTrash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Assigned Talukas:</p>
                      <div className="flex flex-wrap gap-2">
                        {hrGeneral.assigned_talukas && hrGeneral.assigned_talukas.length > 0 ? (
                          hrGeneral.assigned_talukas.map((taluka) => (
                            <span
                              key={taluka}
                              className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold"
                            >
                              {taluka}
                            </span>
                          ))
                        ) : (
                          <span className="text-amber-600 font-semibold text-sm">⚠️ No talukas assigned</span>
                        )}
                      </div>
                    </div>

                    {hrGeneral.updated_at && (
                      <p className="text-xs text-slate-400 mt-3">
                        Last updated: {new Date(hrGeneral.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingHRGeneral && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Talukas to HR-General</h2>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">HR-General</p>
                <p className="text-lg font-bold text-slate-900">{editingHRGeneral.profiles?.name}</p>
                <p className="text-sm text-slate-500">{editingHRGeneral.profiles?.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setEditFormData({ ...editFormData, assigned_talukas: [] });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {assignedCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-900 mb-4">Select Talukas (Can select multiple):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {selectedCity && GUJARAT_CITIES[selectedCity] ? (
                    GUJARAT_CITIES[selectedCity].map((taluka) => (
                      <label
                        key={taluka}
                        className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={(editFormData.assigned_talukas || []).includes(taluka)}
                          onChange={() => toggleTaluka(taluka)}
                          className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="ml-3 text-slate-900 font-medium">{taluka}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-slate-500">Select a city first</p>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900">
                  Selected: {editFormData.assigned_talukas?.length || 0} talukas
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
                  onClick={saveHRGeneralChanges}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isSaving ? "bg-yellow-400 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
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
