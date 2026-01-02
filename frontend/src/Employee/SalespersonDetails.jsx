import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

import { FiArrowLeft, FiPhone, FiMail, FiMapPin, FiUser, FiCalendar, FiTag, FiMenu, FiPlus, FiX } from "react-icons/fi";

export default function SalespersonDetails() {
  useRoleBasedRedirect("employee");
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [salesperson, setSalesperson] = useState(null);
  const [assignedAreas, setAssignedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTalukas, setSelectedTalukas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const GUJARAT_AREAS = {
    Ahmedabad: ["Ahmedabad", "Sanand", "Borsad", "Viramgam"],
    Surat: ["Surat", "Palsana", "Mangrol", "Bardoli"],
    Vadodara: ["Vadodara", "Padra", "Waghodia", "Karjan"],
    Rajkot: ["Rajkot", "Wankaner", "Gondal", "Jetpur"],
    Gandhinagar: ["Gandhinagar", "Kalol", "Khedbrahma"],
    Jamnagar: ["Jamnagar", "Jam Jodhpur", "Khimaj"],
    Kutch: ["Bhuj", "Mandvi", "Nakhatrana"]
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          setCurrentUser(auth.user);
        }

        const response = await fetch(`http://localhost:5000/customer/salespeople/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setSalesperson(data.data);
          setEditData(data.data);
        }

        // Load assigned areas
        const areasResponse = await fetch(`http://localhost:5000/employee/assigned-areas/${id}`);
        const areasData = await areasResponse.json();
        if (areasData.success) {
          setAssignedAreas(areasData.data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddArea = async () => {
    if (!selectedCity || selectedTalukas.length === 0) {
      alert("Please select city and at least one taluka");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/employee/assign-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: id,
          city: selectedCity,
          talukas: selectedTalukas,
          assigned_by: currentUser?.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssignedAreas([...assignedAreas, data.data]);
        setSelectedCity("");
        setSelectedTalukas([]);
        setShowAddAreaModal(false);
        alert("Area assigned successfully!");
      }
    } catch (error) {
      console.error("Error assigning area:", error);
      alert("Failed to assign area");
    }
  };

  const handleRemoveArea = async (areaId) => {
    if (!window.confirm("Remove this area assignment?")) return;

    try {
      const response = await fetch(`http://localhost:5000/employee/assigned-areas/${areaId}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setAssignedAreas(assignedAreas.filter(a => a.id !== areaId));
        alert("Area removed successfully!");
      }
    } catch (error) {
      console.error("Error removing area:", error);
    }
  };

  const toggleTaluka = (taluka) => {
    setSelectedTalukas(prev =>
      prev.includes(taluka)
        ? prev.filter(t => t !== taluka)
        : [...prev, taluka]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">Loading salesperson details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!salesperson) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <button
            onClick={() => navigate("/employee/salespeople")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
          >
            <FiArrowLeft /> Back to Sales Team
          </button>
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-slate-600 text-lg">Salesperson not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
 

      <main className="lg:ml-64 pt-20 px-4 md:px-6 py-10">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50"
        >
          <FiMenu size={24} className="text-slate-700" />
        </button>

        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/employee/salespeople")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
          >
            <FiArrowLeft /> Back to Sales Team
          </button>

          {/* Salesperson Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 border border-slate-200">
            <div className="bg-linear-to-r from-emerald-600 to-green-600 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-5xl font-bold">{salesperson.name?.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{salesperson.name}</h1>
                  <div className="flex items-center gap-4 text-green-100">
                    <span className="flex items-center gap-2"><FiTag size={16} /> ID: {salesperson.id?.substring(0, 12)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salesperson Details */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiUser className="inline mr-2" /> Name
                  </label>
                  <p className="text-slate-900 font-semibold text-lg">{salesperson.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiPhone className="inline mr-2" /> Phone
                  </label>
                  <p className="text-slate-900 font-semibold text-lg">{salesperson.phone || "N/A"}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiMail className="inline mr-2" /> Email
                  </label>
                  <p className="text-slate-900 font-semibold text-lg">{salesperson.email || "N/A"}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <FiMapPin className="inline mr-2" /> Location
                  </label>
                  <p className="text-slate-900 font-semibold text-lg">
                    {salesperson.city} {salesperson.taluka && `• ${salesperson.taluka}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Areas Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assigned Areas ({assignedAreas.length})</h2>
              <button
                onClick={() => setShowAddAreaModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                <FiPlus size={18} /> Add Area
              </button>
            </div>

            {assignedAreas.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <FiMapPin size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-600">No areas assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedAreas.map(area => (
                  <div
                    key={area.id}
                    className="flex items-center justify-between p-4 bg-linear-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{area.city}</h3>
                      <p className="text-sm text-slate-600">
                        {area.talukas?.join(", ") || area.talukas}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveArea(area.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-linear-to-r from-emerald-600 to-green-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Assign Area</h2>
              <button
                onClick={() => {
                  setShowAddAreaModal(false);
                  setSelectedCity("");
                  setSelectedTalukas([]);
                }}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* City Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select City</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(GUJARAT_AREAS).map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setSelectedTalukas([]);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedCity === city
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taluka Selection */}
              {selectedCity && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Talukas</label>
                  <div className="space-y-2">
                    {GUJARAT_AREAS[selectedCity]?.map(taluka => (
                      <label key={taluka} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTalukas.includes(taluka)}
                          onChange={() => toggleTaluka(taluka)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-slate-700">{taluka}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowAddAreaModal(false);
                    setSelectedCity("");
                    setSelectedTalukas([]);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddArea}
                  disabled={!selectedCity || selectedTalukas.length === 0}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
