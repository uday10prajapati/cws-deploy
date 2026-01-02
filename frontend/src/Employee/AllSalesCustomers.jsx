import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw, FiEdit2, FiX, FiCheck } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";

// Gujarat Cities with Talukas
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

export default function AllSalesCustomers() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCities, setUserCities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesPersonFilter, setSalesPersonFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  
  // Edit modal states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCityForEdit, setSelectedCityForEdit] = useState("");
  
  useRoleBasedRedirect(["employee"]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
        
        // Fetch user profile to get role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, employee_type, city")
          .eq("id", auth.user.id)
          .single();
        
        console.log("👤 User Profile:", profile);
        
        if (profile) {
          setUserRole(profile.employee_type);
          
          // If sub-general, fetch assigned cities from user_role_assignments
          if (profile.employee_type === "sub-general") {
            const { data: assignments, error: assignmentError } = await supabase
              .from("user_role_assignments")
              .select("assigned_cities")
              .eq("user_id", auth.user.id)
              .eq("role", "sub-general")
              .single();
            
            console.log("🏙️ Assignments Fetched:", { assignments, error: assignmentError });
            
            if (assignments?.assigned_cities) {
              console.log("✓ Setting userCities to:", assignments.assigned_cities);
              setUserCities(assignments.assigned_cities);
            } else {
              console.log("⚠️ No assigned cities found for sub-general");
            }
          } else if (profile.city) {
            // For other roles, use city from profiles
            console.log("✓ Setting userCities from profile.city:", [profile.city]);
            setUserCities([profile.city]);
          }
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (userRole) {
      console.log("📌 useEffect triggered: userRole=", userRole, "userCities=", userCities);
      loadCustomers();
    }
  }, [userRole, userCities]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all sales_cars
      const { data: allData, error } = await supabase.from("sales_cars").select("*");
      
      if (error) throw error;
      
      console.log("📦 Fetched all sales_cars:", allData?.length || 0, "records");
      console.log("👤 Current userRole:", userRole);
      console.log("🏙️ Current userCities array:", userCities);
      console.log("🏙️ Current userCities length:", userCities?.length);
      
      let filteredData = allData || [];
      
      // Normalize city names for comparison (remove "(City)" suffix)
      const normalizeCityName = (city) => {
        return city?.toLowerCase().replace(/\s*\(city\)\s*/gi, '').trim() || '';
      };
      
      // If sub-general employee, filter customers from their assigned cities
      if (userRole === "sub-general") {
        console.log("🔐 Sub-General role detected");
        
        if (!userCities || userCities.length === 0) {
          console.log("⚠️ No assigned cities found for sub-general, showing no customers");
          setCustomers([]);
          setLoading(false);
          return;
        }
        
        const normalizedAssignedCities = userCities.map(c => normalizeCityName(c));
        console.log("🔍 Normalized assigned cities:", normalizedAssignedCities);
        
        filteredData = allData.filter(customer => {
          const normalizedCustomerCity = normalizeCityName(customer.customer_city);
          const matches = normalizedAssignedCities.includes(normalizedCustomerCity);
          
          console.log(`  Customer: "${customer.customer_name}" | city="${customer.customer_city}" (normalized: "${normalizedCustomerCity}") | matches=${matches}`);
          
          return matches;
        });
        console.log("✓ After filtering:", filteredData.length, "records");
      } else {
        console.log("ℹ️ Non sub-general role (", userRole, "), showing all customers");
      }
      
      setCustomers(filteredData);
    } catch (error) {
      console.error("Error loading customers:", error);
      alert("Error loading customers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (customer) => {
    // Only general employee can edit
    if (userRole !== "general") {
      alert("You don't have permission to assign areas");
      return;
    }

    setEditingCustomer(customer);
    setEditFormData({
      customer_city: customer.customer_city || "",
      customer_taluko: customer.customer_taluko || "",
    });
    setSelectedCityForEdit(customer.customer_city || "");
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditFormData({});
    setSelectedCityForEdit("");
  };

  const saveCustomerChanges = async () => {
    if (!editingCustomer) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("sales_cars")
        .update({
          customer_city: editFormData.customer_city || null,
          customer_taluko: editFormData.customer_taluko || null,
        })
        .eq("id", editingCustomer.id);
      
      if (error) throw error;
      
      // Update local list
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...editFormData }
          : c
      ));
      
      closeEditModal();
      alert("✅ Customer area updated successfully!");
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("❌ Error updating customer: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // For sub-general employee, only allow taluko editing
  const openEditModalSubGeneral = (customer) => {
    if (userRole !== "sub-general") {
      return;
    }

    setEditingCustomer(customer);
    setEditFormData({
      customer_taluko: customer.customer_taluko || "",
    });
    setSelectedCityForEdit(customer.customer_city || "");
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_phone?.includes(searchTerm) ||
      customer.number_plate?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSalesPerson = 
      salesPersonFilter === "" || 
      customer.sales_person_id?.toLowerCase().includes(salesPersonFilter.toLowerCase());

    const matchesCity = 
      cityFilter === "" || 
      customer.customer_city?.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesSalesPerson && matchesCity;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">Sales Customers 🏎️</h1>
            <p className="text-slate-600 text-base">Manage customers registered by sales persons</p>
            {userRole === "sub-general" && userCity && (
              <p className="text-sm text-indigo-600 font-semibold mt-2">📍 Viewing customers from: <span className="text-indigo-700">{userCity}</span></p>
            )}
          </div>
          <button
            onClick={loadCustomers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-blue-600">{filteredCustomers.length}</p>
          </div>
          <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">With Area Assignment</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredCustomers.filter(c => c.customer_city && c.customer_taluko).length}
            </p>
          </div>
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <p className="text-slate-600 text-sm font-semibold mb-2">Pending Assignment</p>
            <p className="text-3xl font-bold text-amber-600">
              {filteredCustomers.filter(c => !c.customer_city || !c.customer_taluko).length}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search sales person..."
              value={salesPersonFilter}
              onChange={(e) => setSalesPersonFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {userRole === "general" && (
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
        </div>

        <div className="text-right mb-6">
          <p className="text-sm text-slate-600 font-medium">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-12">
            <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading customers...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Customer Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Car Details</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">City</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Taluko</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Address</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Sales Person ID</th>
                    {userRole === "general" && (
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Action</th>
                    )}
                    {userRole === "sub-general" && (
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === "general" ? "8" : "8"} className="px-6 py-12 text-center text-slate-500">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${customer.customer_name}&background=3b82f6&color=fff`}
                              className="w-8 h-8 rounded-full"
                              alt={customer.customer_name}
                            />
                            {customer.customer_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{customer.customer_phone || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="text-xs">
                            <p className="font-semibold">{customer.model || "N/A"}</p>
                            <p className="text-slate-500">{customer.number_plate || "N/A"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {customer.customer_city ? (
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {customer.customer_city}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">⚠️ Not Set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {customer.customer_taluko ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              {customer.customer_taluko}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">⚠️ Not Set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={customer.customer_address}>
                          {customer.customer_address || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 truncate">{customer.sales_person_id || "N/A"}</td>
                        <td className="px-6 py-4 text-sm">
                          {userRole === "general" && (
                            <button
                              onClick={() => openEditModal(customer)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1"
                            >
                              <FiEdit2 className="w-3 h-3" /> Assign Area
                            </button>
                          )}
                          {userRole === "sub-general" && (
                            <button
                              onClick={() => openEditModalSubGeneral(customer)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1"
                            >
                              <FiEdit2 className="w-3 h-3" /> Assign Taluko
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

        {/* EDIT MODAL - FOR GENERAL EMPLOYEE */}
        {editingCustomer && userRole === "general" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Area</h2>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              
              {/* Customer Info Display */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Customer</p>
                <p className="text-lg font-bold text-slate-900">{editingCustomer.customer_name}</p>
                <p className="text-sm text-slate-500">{editingCustomer.model} • {editingCustomer.number_plate}</p>
              </div>

              {/* City Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  🏙️ City *
                </label>
                <select
                  value={selectedCityForEdit}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setSelectedCityForEdit(newCity);
                    setEditFormData({ ...editFormData, customer_city: newCity, customer_taluko: "" });
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

              {/* Taluko Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  📍 Taluko *
                </label>
                <select
                  value={editFormData.customer_taluko || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_taluko: e.target.value })}
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
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomerChanges}
                  disabled={isSaving || !editFormData.customer_city || !editFormData.customer_taluko}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isSaving || !editFormData.customer_city || !editFormData.customer_taluko
                      ? "bg-blue-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
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
                      Assign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL - FOR SUB-GENERAL EMPLOYEE (TALUKO ONLY) */}
        {editingCustomer && userRole === "sub-general" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Assign Taluko</h2>
                <button
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              
              {/* Customer Info Display */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">Customer</p>
                <p className="text-lg font-bold text-slate-900">{editingCustomer.customer_name}</p>
                <p className="text-sm text-slate-500">{editingCustomer.model} • {editingCustomer.number_plate}</p>
              </div>

              {/* City Display (Read-only) */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  🏙️ City (Your City)
                </label>
                <div className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-semibold">
                  {selectedCityForEdit || userCity}
                </div>
                <p className="text-xs text-slate-500 mt-2">You can only assign talukas within your city</p>
              </div>

              {/* Taluko Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  📍 Taluko *
                </label>
                <select
                  value={editFormData.customer_taluko || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_taluko: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Taluko --</option>
                  {selectedCityForEdit && GUJARAT_CITIES[selectedCityForEdit] ? (
                    GUJARAT_CITIES[selectedCityForEdit].map((taluko) => (
                      <option key={taluko} value={taluko}>
                        {taluko}
                      </option>
                    ))
                  ) : null}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomerChanges}
                  disabled={isSaving || !editFormData.customer_taluko}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isSaving || !editFormData.customer_taluko
                      ? "bg-indigo-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700"
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
                      Assign
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
