import { useEffect, useState } from "react";
import { FiRefreshCw, FiX, FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { ROLES, assignTalukaToSalesman, getSalesmenUnderHRGeneral, getUsersByRole } from "../utils/rbacUtils";

export default function HRGeneralSalesmanAssignment() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignedTalukas, setAssignedTalukas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [salesmen, setSalesmen] = useState([]);
  const [availableSalesmen, setAvailableSalesmen] = useState([]);
  const [editingSalesman, setEditingSalesman] = useState(null);
  const [selectedTaluka, setSelectedTaluka] = useState("");
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

        if (profile && profile.employee_type === "hr-general") {
          setUserRole(profile.employee_type);

          // Fetch assigned talukas
          const { data: assignment } = await supabase
            .from("user_role_assignments")
            .select("assigned_talukas")
            .eq("user_id", auth.user.id)
            .eq("role", ROLES.HR_GENERAL)
            .single();

          if (assignment?.assigned_talukas) {
            setAssignedTalukas(assignment.assigned_talukas);
            setSelectedTaluka(assignment.assigned_talukas[0] || "");
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (userRole === "hr-general" && assignedTalukas.length > 0) {
      loadSalesmen();
      loadAvailableSalesmen();
    }
  }, [userRole, assignedTalukas]);

  const loadSalesmen = async () => {
    try {
      const { data, error } = await supabase
        .from("user_role_assignments")
        .select(`user_id, assigned_talukas, updated_at, profiles!inner(id, email, name)`)
        .eq("role", ROLES.SALESMAN)
        .in("assigned_talukas", assignedTalukas);

      if (error) throw error;
      setSalesmen(data || []);
    } catch (error) {
      console.error("Error loading salesmen:", error);
    }
  };

  const loadAvailableSalesmen = async () => {
    try {
      const salesmanUsers = await getUsersByRole("salesman");
      setAvailableSalesmen(salesmanUsers);
    } catch (error) {
      console.error("Error loading available salesmen:", error);
    }
  };

  const openEditModal = (salesman) => {
    setEditingSalesman(salesman);
    setSelectedTaluka(salesman.assigned_talukas?.[0] || assignedTalukas[0]);
  };

  const closeEditModal = () => {
    setEditingSalesman(null);
    setSelectedTaluka("");
  };

  const saveSalesmanChanges = async () => {
    if (!selectedTaluka) {
      alert("Please select a taluka");
      return;
    }

    // Validate taluka is in assigned talukas
    if (!assignedTalukas.includes(selectedTaluka)) {
      alert("Invalid taluka selected");
      return;
    }

    setIsSaving(true);
    try {
      const result = await assignTalukaToSalesman(editingSalesman.user_id, selectedTaluka);

      if (!result.success) throw result.error;

      loadSalesmen();
      closeEditModal();
      alert("✅ Salesman taluka updated successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSalesmanAssignment = async (userId) => {
    if (!confirm("Remove this Salesman's taluka assignment?")) return;

    try {
      const { error } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("role", ROLES.SALESMAN);

      if (error) throw error;

      loadSalesmen();
      alert("✅ Salesman assignment removed!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const filteredSalesmen = salesmen.filter((s) =>
    s.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FiRefreshCw className="text-4xl animate-spin text-blue-600" />
      </div>
    );
  }

  if (userRole !== "hr-general") {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavbarNew />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600">Only HR-General can access this page.</p>
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
              🟢 Salesman Taluka Assignment
            </h1>
            <p className="text-slate-600 text-base">Assign talukas to salesmen under your management</p>
            <p className="text-sm text-green-600 font-semibold mt-2">
              📍 Your Talukas: {assignedTalukas.join(", ")}
            </p>
          </div>
          <button
            onClick={() => {
              loadSalesmen();
              loadAvailableSalesmen();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total Salesmen</p>
            <p className="text-3xl font-bold text-green-600">{filteredSalesmen.length}</p>
          </div>
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg">
            <p className="text-slate-600 text-sm font-semibold mb-2">Assigned to Talukas</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredSalesmen.filter((s) => s.assigned_talukas?.length > 0).length}
            </p>
          </div>
        </div>

        {/* SALESMAN MANAGEMENT */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
            <h2 className="text-2xl font-bold text-green-900">🟢 Salesman Management</h2>
            <p className="text-green-700 text-sm mt-1">Assign talukas from your jurisdiction</p>
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

            {filteredSalesmen.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-lg">No salesmen assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSalesmen.map((salesman) => (
                  <div
                    key={salesman.user_id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{salesman.profiles?.name}</p>
                        <p className="text-sm text-slate-500">{salesman.profiles?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(salesman)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => deleteSalesmanAssignment(salesman.user_id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold flex items-center gap-1"
                        >
                          <FiTrash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Assigned Taluka:</p>
                      <div className="flex flex-wrap gap-2">
                        {salesman.assigned_talukas && salesman.assigned_talukas.length > 0 ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {salesman.assigned_talukas[0]}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-sm">⚠️ No taluka assigned</span>
                        )}
                      </div>
                    </div>

                    {salesman.updated_at && (
                      <p className="text-xs text-slate-400 mt-3">
                        Last updated: {new Date(salesman.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingSalesman && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Taluka</h2>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Salesman</p>
                <p className="text-lg font-bold text-slate-900">{editingSalesman.profiles?.name}</p>
                <p className="text-sm text-slate-500">{editingSalesman.profiles?.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Taluka *</label>
                <select
                  value={selectedTaluka}
                  onChange={(e) => setSelectedTaluka(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Taluka --</option>
                  {assignedTalukas.map((taluka) => (
                    <option key={taluka} value={taluka}>
                      {taluka}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Salesman will only be able to add data for the selected taluka
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
                  onClick={saveSalesmanChanges}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isSaving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
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
                      Save
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
