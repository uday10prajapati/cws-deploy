import { useEffect, useState } from "react";
import { FiRefreshCw, FiX, FiCheck, FiEdit2, FiTrash2, FiMapPin } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { ROLES } from "../utils/rbacUtils";
import { GUJARAT_CITIES, getTalukasForCity } from "../constants/gujaratConstants";

export default function AssignArea() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignedCities, setAssignedCities] = useState([]);
  const [assignedTalukas, setAssignedTalukas] = useState([]);
  const [loading, setLoading] = useState(true);

  // General Role - Assign cities to Sub-Generals
  const [subGenerals, setSubGenerals] = useState([]);
  const [selectedSubGeneral, setSelectedSubGeneral] = useState(null);
  const [selectedCitiesForSubGeneral, setSelectedCitiesForSubGeneral] = useState([]);
  const [showSubGeneralModal, setShowSubGeneralModal] = useState(false);

  // Sub-General Role - Assign talukas to HR-Generals
  const [hrGenerals, setHrGenerals] = useState([]);
  const [selectedHrGeneral, setSelectedHrGeneral] = useState(null);
  const [selectedCityForTaluka, setSelectedCityForTaluka] = useState("");
  const [selectedTalukasForHrGeneral, setSelectedTalukasForHrGeneral] = useState([]);
  const [showHrGeneralModal, setShowHrGeneralModal] = useState(false);

  // HR-General Role - Assign areas to Sales Persons
  const [salesPersons, setSalesPersons] = useState([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [selectedAreasForSalesPerson, setSelectedAreasForSalesPerson] = useState([]);
  const [showSalesPersonModal, setShowSalesPersonModal] = useState(false);

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

        if (profile) {
          setUserRole(profile.employee_type);

          // If Sub-General, fetch their assigned cities
          if (profile.employee_type === "sub-general") {
            const { data: assignment } = await supabase
              .from("user_role_assignments")
              .select("assigned_cities")
              .eq("user_id", auth.user.id)
              .eq("role", ROLES.SUB_GENERAL)
              .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

            if (assignment?.assigned_cities) {
              setAssignedCities(assignment.assigned_cities);
            } else {
              console.log("⚠️ No cities assigned yet for Sub-General");
              setAssignedCities([]);
            }
          }

          // If HR-General, fetch their assigned talukas
          if (profile.employee_type === "hr-general") {
            const { data: assignment } = await supabase
              .from("user_role_assignments")
              .select("assigned_talukas")
              .eq("user_id", auth.user.id)
              .eq("role", ROLES.HR_GENERAL)
              .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

            if (assignment?.assigned_talukas) {
              setAssignedTalukas(assignment.assigned_talukas);
            } else {
              console.log("⚠️ No talukas assigned yet for HR-General");
              setAssignedTalukas([]);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (userRole === "general") {
      loadSubGenerals();
    } else if (userRole === "sub-general") {
      loadHrGenerals();
    } else if (userRole === "hr-general") {
      loadSalesPersons();
    }
  }, [userRole, assignedCities, assignedTalukas]);

  const loadSubGenerals = async () => {
    try {
      // Fetch all Sub-Generals from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, employee_type")
        .eq("employee_type", "sub-general");

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("⚠️ No sub-generals found in profiles");
        setSubGenerals([]);
        return;
      }

      // Fetch their role assignments to get assigned cities
      const subGeneralIds = data.map(sg => sg.id);
      
      // Only query assignments if there are Sub-Generals
      if (subGeneralIds.length === 0) {
        setSubGenerals(data.map(profile => ({
          user_id: profile.id,
          profiles: profile,
          assigned_cities: []
        })));
        return;
      }

      const { data: assignments, error: assignError } = await supabase
        .from("user_role_assignments")
        .select("user_id, assigned_cities")
        .in("user_id", subGeneralIds)
        .eq("role", ROLES.SUB_GENERAL);

      if (assignError) console.warn("⚠️ Assignment fetch warning:", assignError);

      // Merge profile data with assignment data
      const mergedData = data.map(profile => {
        const assignment = assignments?.find(a => a.user_id === profile.id);
        return {
          user_id: profile.id,
          profiles: profile,
          assigned_cities: assignment?.assigned_cities || []
        };
      });

      console.log("✅ Sub-Generals loaded:", mergedData);
      setSubGenerals(mergedData);
    } catch (error) {
      console.error("❌ Error loading sub-generals:", error);
      setSubGenerals([]);
    }
  };

  const loadHrGenerals = async () => {
    try {
      // Fetch all HR-Generals from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, employee_type")
        .eq("employee_type", "hr-general");

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("⚠️ No HR-Generals found in profiles");
        setHrGenerals([]);
        return;
      }

      // Fetch their role assignments to get assigned talukas
      const hrGeneralIds = data.map(hg => hg.id);
      
      // Only query assignments if there are HR-Generals
      if (hrGeneralIds.length === 0) {
        setHrGenerals(data.map(profile => ({
          user_id: profile.id,
          profiles: profile,
          assigned_talukas: []
        })));
        return;
      }

      const { data: assignments, error: assignError } = await supabase
        .from("user_role_assignments")
        .select("user_id, assigned_talukas")
        .in("user_id", hrGeneralIds)
        .eq("role", ROLES.HR_GENERAL);

      if (assignError) console.warn("⚠️ Assignment fetch warning:", assignError);

      // Merge profile data with assignment data
      const mergedData = data.map(profile => {
        const assignment = assignments?.find(a => a.user_id === profile.id);
        return {
          user_id: profile.id,
          profiles: profile,
          assigned_talukas: assignment?.assigned_talukas || []
        };
      });

      console.log("✅ HR-Generals loaded:", mergedData);
      setHrGenerals(mergedData);
    } catch (error) {
      console.error("❌ Error loading HR-Generals:", error);
      setHrGenerals([]);
    }
  };

  const loadSalesPersons = async () => {
    try {
      // Fetch all Sales Persons from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, employee_type")
        .eq("employee_type", "sales");

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("⚠️ No Sales Persons found in profiles");
        setSalesPersons([]);
        return;
      }

      // Fetch their role assignments to get assigned talukas/areas
      const salesPersonIds = data.map(sp => sp.id);
      
      // Only query assignments if there are sales persons
      if (salesPersonIds.length === 0) {
        setSalesPersons(data.map(profile => ({
          user_id: profile.id,
          profiles: profile,
          assigned_talukas: []
        })));
        return;
      }

      const { data: assignments, error: assignError } = await supabase
        .from("user_role_assignments")
        .select("user_id, assigned_talukas")
        .in("user_id", salesPersonIds)
        .eq("role", ROLES.SALESMAN);

      if (assignError) console.warn("⚠️ Assignment fetch warning:", assignError);

      // Merge profile data with assignment data
      const mergedData = data.map(profile => {
        const assignment = assignments?.find(a => a.user_id === profile.id);
        return {
          user_id: profile.id,
          profiles: profile,
          assigned_talukas: assignment?.assigned_talukas || []
        };
      });

      console.log("✅ Sales Persons loaded:", mergedData);
      setSalesPersons(mergedData);
    } catch (error) {
      console.error("❌ Error loading Sales Persons:", error);
      setSalesPersons([]);
    }
  };

  const loadAreaAssignments = async () => {
    // This function is no longer used for Sub-General view
    // Keeping it for now in case it's needed elsewhere
    try {
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select(`user_id, assigned_talukas, id`)
        .eq("role", ROLES.HR_GENERAL);

      if (error) throw error;
      // Not setting state since we're using loadSalesmen instead
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  // GENERAL FUNCTIONS
  const openSubGeneralModal = (subGeneral) => {
    setSelectedSubGeneral(subGeneral);
    setSelectedCitiesForSubGeneral(subGeneral.assigned_cities || []);
    setShowSubGeneralModal(true);
  };

  const closeSubGeneralModal = () => {
    setShowSubGeneralModal(false);
    setSelectedSubGeneral(null);
    setSelectedCitiesForSubGeneral([]);
  };

  const toggleCityForSubGeneral = (city) => {
    if (selectedCitiesForSubGeneral.includes(city)) {
      setSelectedCitiesForSubGeneral(selectedCitiesForSubGeneral.filter((c) => c !== city));
    } else {
      setSelectedCitiesForSubGeneral([...selectedCitiesForSubGeneral, city]);
    }
  };

  const saveSubGeneralCities = async () => {
    if (selectedCitiesForSubGeneral.length === 0) {
      alert("Please select at least one city");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .upsert({
          user_id: selectedSubGeneral.user_id,
          role: ROLES.SUB_GENERAL,
          assigned_cities: selectedCitiesForSubGeneral,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      loadSubGenerals();
      closeSubGeneralModal();
      alert("✅ Sub-General cities updated successfully!");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // SUB-GENERAL FUNCTIONS - HR-GENERAL MODAL
  const openHrGeneralModal = (hrGeneral) => {
    setSelectedHrGeneral(hrGeneral);
    setSelectedCityForTaluka(assignedCities[0] || "");
    setSelectedTalukasForHrGeneral(hrGeneral.assigned_talukas || []);
    setShowHrGeneralModal(true);
  };

  const closeHrGeneralModal = () => {
    setShowHrGeneralModal(false);
    setSelectedHrGeneral(null);
    setSelectedCityForTaluka("");
    setSelectedTalukasForHrGeneral([]);
  };

  const toggleTalukaForHrGeneral = (taluka) => {
    // HR-Generals can have multiple talukas assigned
    if (selectedTalukasForHrGeneral.includes(taluka)) {
      setSelectedTalukasForHrGeneral(selectedTalukasForHrGeneral.filter((t) => t !== taluka));
    } else {
      setSelectedTalukasForHrGeneral([...selectedTalukasForHrGeneral, taluka]);
    }
  };

  const saveHrGeneralTaluka = async () => {
    if (selectedTalukasForHrGeneral.length === 0) {
      alert("Please select at least one taluka");
      return;
    }

    setIsSaving(true);
    try {
      // Save HR-General's taluka assignment
      const { error } = await supabase
        .from("user_role_assignments")
        .upsert({
          user_id: selectedHrGeneral.user_id,
          role: ROLES.HR_GENERAL,
          assigned_talukas: selectedTalukasForHrGeneral,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log("✅ HR-General taluka assignment saved!");
      loadHrGenerals();
      closeHrGeneralModal();
      alert("✅ HR-General taluka assignments updated successfully!");
    } catch (error) {
      console.error("❌ Error saving assignment:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHrGeneralAssignment = async (userId) => {
    if (!confirm("Remove this HR-General's taluka assignment?")) return;

    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("role", ROLES.HR_GENERAL);

      if (error) throw error;

      console.log("✅ HR-General assignment removed!");
      loadHrGenerals();
      alert("✅ Assignment removed!");
    } catch (error) {
      console.error("❌ Error removing assignment:", error);
      alert("Error: " + error.message);
    }
  };

  // HR-GENERAL FUNCTIONS - SALES PERSON MODAL
  const openSalesPersonModal = (salesPerson) => {
    setSelectedSalesPerson(salesPerson);
    // For now, areas can be set to their assigned taluka
    // In a full implementation, areas would be specific geographic units
    setSelectedAreasForSalesPerson(salesPerson.assigned_talukas || []);
    setShowSalesPersonModal(true);
  };

  const closeSalesPersonModal = () => {
    setShowSalesPersonModal(false);
    setSelectedSalesPerson(null);
    setSelectedAreasForSalesPerson([]);
  };

  const toggleAreaForSalesPerson = (area) => {
    if (selectedAreasForSalesPerson.includes(area)) {
      setSelectedAreasForSalesPerson(selectedAreasForSalesPerson.filter((a) => a !== area));
    } else {
      setSelectedAreasForSalesPerson([...selectedAreasForSalesPerson, area]);
    }
  };

  const saveSalesPersonArea = async () => {
    if (selectedAreasForSalesPerson.length === 0) {
      alert("Please select at least one taluka/area");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .upsert({
          user_id: selectedSalesPerson.user_id,
          role: ROLES.SALESMAN,
          assigned_talukas: selectedAreasForSalesPerson,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log("✅ Sales Person taluka/area assignment saved!");
      loadSalesPersons();
      closeSalesPersonModal();
      alert("✅ Sales Person area assignment updated successfully!");
    } catch (error) {
      console.error("❌ Error saving assignment:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSalesPersonAssignment = async (userId) => {
    if (!confirm("Remove this Sales Person's area assignment?")) return;

    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("role", ROLES.SALESMAN);

      if (error) throw error;

      console.log("✅ Sales Person assignment removed!");
      loadSalesPersons();
      alert("✅ Assignment removed!");
    } catch (error) {
      console.error("❌ Error removing assignment:", error);
      alert("Error: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiRefreshCw className="text-4xl animate-spin text-blue-600" />
      </div>
    );
  }

  // GENERAL ROLE VIEW
  if (userRole === "general") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">🔴 General - Area Management</h1>
              <p className="text-slate-600">Assign cities to Sub-Generals</p>
            </div>
            <button
              onClick={loadSubGenerals}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-100 border-2 border-blue-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-blue-700 mb-1">Total Sub-Generals</p>
              <p className="text-3xl font-bold text-blue-600">{subGenerals.length}</p>
            </div>
            <div className="bg-green-100 border-2 border-green-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-green-700 mb-1">Cities in System</p>
              <p className="text-3xl font-bold text-green-600">{Object.keys(GUJARAT_CITIES).length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-900">Sub-Generals & Their City Assignments</h2>
            </div>
            <div className="p-6">
              {subGenerals.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No sub-generals found</p>
              ) : (
                <div className="space-y-4">
                  {subGenerals.map((sg) => (
                    <div key={sg.user_id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900">{sg.profiles?.name}</p>
                          <p className="text-sm text-slate-500">{sg.profiles?.email}</p>
                        </div>
                        <button
                          onClick={() => openSubGeneralModal(sg)}
                          className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 flex items-center gap-2"
                        >
                          <FiEdit2 /> Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sg.assigned_cities && sg.assigned_cities.length > 0 ? (
                          sg.assigned_cities.map((city) => (
                            <span key={city} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                              {city}
                            </span>
                          ))
                        ) : (
                          <span className="text-amber-600">⚠️ No cities assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* SUB-GENERAL MODAL */}
        {showSubGeneralModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Cities to {selectedSubGeneral?.profiles?.name}</h2>
                <button onClick={closeSubGeneralModal} className="text-slate-400 hover:text-slate-600">
                  <FiX className="text-2xl" />
                </button>
              </div>

              <p className="text-sm font-semibold text-slate-900 mb-4">Select Cities (Multiple allowed):</p>
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-72 overflow-y-auto">
                {Object.keys(GUJARAT_CITIES).map((city) => (
                  <label
                    key={city}
                    className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCitiesForSubGeneral.includes(city)}
                      onChange={() => toggleCityForSubGeneral(city)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-slate-900 font-medium text-sm">{city}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeSubGeneralModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSubGeneralCities}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                    isSaving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SUB-GENERAL ROLE VIEW
  if (userRole === "sub-general") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">🟠 Sub-General - Area Management</h1>
              <p className="text-slate-600 mb-2">Assign talukas to HR-Generals</p>
              <p className="text-sm text-orange-600 font-semibold">
                📍 Your Cities: {assignedCities.join(", ")}
              </p>
            </div>
            <button
              onClick={() => {
                loadHrGenerals();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-orange-100 border-2 border-orange-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-orange-700">Total HR-Generals</p>
              <p className="text-3xl font-bold text-orange-600">{hrGenerals.length}</p>
            </div>
            <div className="bg-green-100 border-2 border-green-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-green-700">Your Cities</p>
              <p className="text-3xl font-bold text-green-600">{assignedCities.length}</p>
            </div>
            <div className="bg-blue-100 border-2 border-blue-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-blue-700">Your Talukas</p>
              <p className="text-3xl font-bold text-blue-600">
                {assignedCities.reduce((sum, city) => sum + getTalukasForCity(city).length, 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h2 className="text-2xl font-bold text-orange-900">HR-Generals & Their Taluka Assignments</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search HR-Generals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {hrGenerals.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No HR-Generals assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {hrGenerals
                    .filter(hg => 
                      hg.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      hg.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((hrGeneral) => (
                    <div key={hrGeneral.user_id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900">{hrGeneral.profiles?.name}</p>
                          <p className="text-sm text-slate-500">{hrGeneral.profiles?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openHrGeneralModal(hrGeneral)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 flex items-center gap-1"
                          >
                            <FiEdit2 className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => deleteHrGeneralAssignment(hrGeneral.user_id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 flex items-center gap-1"
                          >
                            <FiTrash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hrGeneral.assigned_talukas && hrGeneral.assigned_talukas.length > 0 ? (
                          hrGeneral.assigned_talukas.map((taluka) => (
                            <span
                              key={taluka}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1"
                            >
                              <FiMapPin className="w-3 h-3" /> {taluka}
                            </span>
                          ))
                        ) : (
                          <span className="text-amber-600 font-semibold">⚠️ No taluka assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* HR-GENERAL MODAL */}
        {showHrGeneralModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Taluka to {selectedHrGeneral?.profiles?.name}</h2>
                <button onClick={closeHrGeneralModal} className="text-slate-400 hover:text-slate-600">
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Select City:</label>
                <select
                  value={selectedCityForTaluka}
                  onChange={(e) => {
                    setSelectedCityForTaluka(e.target.value);
                    setSelectedTalukasForHrGeneral([]);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select a City --</option>
                  {assignedCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm font-semibold text-slate-900 mb-4">Select Taluka (Multiple allowed):</p>
              <div className="grid grid-cols-1 gap-3 mb-6 max-h-72 overflow-y-auto">
                {selectedCityForTaluka && getTalukasForCity(selectedCityForTaluka).map((taluka) => (
                  <label
                    key={taluka}
                    className="flex items-center p-3 border-2 border-slate-200 rounded-lg hover:bg-orange-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTalukasForHrGeneral.includes(taluka)}
                      onChange={() => toggleTalukaForHrGeneral(taluka)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="ml-3 text-slate-900 font-medium">{taluka}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeHrGeneralModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHrGeneralTaluka}
                  disabled={isSaving || selectedTalukasForHrGeneral.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                    isSaving || selectedTalukasForHrGeneral.length === 0
                      ? "bg-orange-400 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // HR-GENERAL ROLE VIEW
  if (userRole === "hr-general") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-green-50 to-slate-100">
        <NavbarNew />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">🟢 HR-General - Sales Management</h1>
              <p className="text-slate-600 mb-2">Assign areas to Sales Persons</p>
              <p className="text-sm text-green-600 font-semibold">
                📍 Your Talukas: {assignedTalukas.join(", ")}
              </p>
            </div>
            <button
              onClick={() => {
                loadSalesPersons();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-100 border-2 border-green-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-green-700">Total Sales Persons</p>
              <p className="text-3xl font-bold text-green-600">{salesPersons.length}</p>
            </div>
            <div className="bg-blue-100 border-2 border-blue-500 rounded-xl p-6">
              <p className="text-sm font-semibold text-blue-700">Your Talukas</p>
              <p className="text-3xl font-bold text-blue-600">{assignedTalukas.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <h2 className="text-2xl font-bold text-green-900">Sales Persons & Their Area Assignments</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search Sales Persons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {salesPersons.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No Sales Persons assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {salesPersons
                    .filter(sp =>
                      sp.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      sp.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((salesPerson) => (
                      <div key={salesPerson.user_id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-slate-900">{salesPerson.profiles?.name}</p>
                            <p className="text-sm text-slate-500">{salesPerson.profiles?.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openSalesPersonModal(salesPerson)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 flex items-center gap-1"
                            >
                              <FiEdit2 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => deleteSalesPersonAssignment(salesPerson.user_id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 flex items-center gap-1"
                            >
                              <FiTrash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {salesPerson.assigned_talukas && salesPerson.assigned_talukas.length > 0 ? (
                            salesPerson.assigned_talukas.map((taluka) => (
                              <span
                                key={taluka}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1"
                              >
                                <FiMapPin className="w-3 h-3" /> {taluka}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-600 font-semibold">⚠️ No area assigned</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* SALES PERSON MODAL */}
        {showSalesPersonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Area to {selectedSalesPerson?.profiles?.name}</h2>
                <button onClick={closeSalesPersonModal} className="text-slate-400 hover:text-slate-600">
                  <FiX className="text-2xl" />
                </button>
              </div>

              <p className="text-sm font-semibold text-slate-900 mb-4">Select Taluka/Area (One or more):</p>
              <div className="grid grid-cols-1 gap-3 mb-6 max-h-72 overflow-y-auto">
                {assignedTalukas.map((taluka) => (
                  <label
                    key={taluka}
                    className="flex items-center p-3 border-2 border-slate-200 rounded-lg hover:bg-green-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreasForSalesPerson.includes(taluka)}
                      onChange={() => toggleAreaForSalesPerson(taluka)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="ml-3 text-slate-900 font-medium">{taluka}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeSalesPersonModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSalesPersonArea}
                  disabled={isSaving || selectedAreasForSalesPerson.length === 0}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                    isSaving || selectedAreasForSalesPerson.length === 0
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // NO ACCESS
  return (
    <div className="min-h-screen bg-slate-50">
      <NavbarNew />
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Access Denied</h1>
        <p className="text-slate-600">Only General, Sub-General, and HR-General roles can access this page.</p>
      </div>
    </div>
  );
}
