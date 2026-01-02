import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import { FiSearch, FiPlus, FiFilter, FiPhone, FiMapPin, FiUser, FiUserCheck, FiCalendar } from "react-icons/fi";

/**
 * ALL CUSTOMERS PAGE - ROLE-BASED & GEOGRAPHIC FILTERING
 * 
 * VISIBILITY RULES:
 * - General: See ALL customers across all cities/talukas
 * - Sub-General: See only customers in assigned cities
 * - HR-General: See only customers in assigned talukas
 * 
 * NOTE: Data filtering is enforced at the BACKEND level for security
 */
export default function AllCustomers() {
  useRoleBasedRedirect("employee");
  
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [filterBySalesPerson, setFilterBySalesPerson] = useState("");
  const [metadata, setMetadata] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllCustomers();
  }, []);

  const loadAllCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authenticated user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate("/login");
        return;
      }

      setUser(authData.user);

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_type")
        .eq("id", authData.user.id)
        .single();

      if (profile) {
        setUserRole(profile.employee_type);
      }

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setError("Authentication token not found");
        return;
      }

      // Fetch customers from secure backend API
      const response = await fetch("http://localhost:5000/customer/all-customers", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch customers");
      }

      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
        setFilteredCustomers(result.data || []);
        setMetadata(result.metadata || {});
        console.log(`✅ Loaded ${result.data.length} customers with role-based filtering`);
      } else {
        setError(result.error || "Failed to load customers");
      }
    } catch (err) {
      console.error("❌ Error loading customers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search and sales person filter
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_phone?.includes(searchTerm) ||
        c.added_by_sales_person?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBySalesPerson) {
      filtered = filtered.filter(c => 
        c.added_by_sales_person?.id === filterBySalesPerson
      );
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, filterBySalesPerson, customers]);

  // Get unique sales persons for filter dropdown
  const salesPersons = Array.from(
    new Map(
      customers.map(c => [
        c.added_by_sales_person?.id,
        c.added_by_sales_person
      ])
    ).values()
  ).filter(sp => sp?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />

      <main className="pt-20 px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
                All Customers
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-slate-600 text-base">
                  Manage and view customers (role-based filtering applied)
                </p>
                {metadata.filtering_applied && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    🔒 Filtered by {userRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 font-semibold">❌ {error}</p>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <p className="text-sm text-slate-600 mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
              <p className="text-xs text-slate-500 mt-2">Visible to your role</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <p className="text-sm text-slate-600 mb-2">Sales Persons</p>
              <p className="text-3xl font-bold text-green-600">{salesPersons.length}</p>
              <p className="text-xs text-slate-500 mt-2">Added customers</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <p className="text-sm text-slate-600 mb-2">Your Role</p>
              <p className="text-2xl font-bold text-purple-600 capitalize">{userRole || "Unknown"}</p>
              <p className="text-xs text-slate-500 mt-2">Data access level</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or sales person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <select
                value={filterBySalesPerson}
                onChange={(e) => setFilterBySalesPerson(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Sales Persons</option>
                {salesPersons.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name} ({sp.email})
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBySalesPerson("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-semibold"
              >
                <FiFilter className="inline mr-2" /> Clear Filters
              </button>
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-200">
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">
                        Customer Name
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">
                        Contact
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">
                        Car Details
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">
                        Added By (Sales Person)
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">
                        Date Added
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-900">
                            {customer.customer_name || "N/A"}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <FiPhone size={14} className="text-blue-600" />
                              <p className="text-sm text-slate-600">
                                {customer.customer_phone || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <p className="font-semibold text-slate-900">
                              {customer.car_model || "N/A"}
                            </p>
                            <p className="text-slate-600">
                              {customer.car_number_plate || "N/A"}
                            </p>
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold mt-1">
                              {customer.car_color || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <FiUserCheck className="text-blue-600" size={16} />
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold text-slate-900">
                                {customer.added_by_sales_person?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {customer.added_by_sales_person?.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <FiCalendar size={14} />
                            <span>
                              {customer.created_at
                                ? new Date(customer.created_at).toLocaleDateString("en-IN")
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing <strong>{filteredCustomers.length}</strong> out of{" "}
                  <strong>{customers.length}</strong> customers
                </p>
              </div>
            </div>
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-200">
              <FiUser className="mx-auto text-slate-400 mb-3" size={48} />
              <p className="text-slate-600 font-semibold mb-2">
                {customers.length === 0 ? "No customers found" : "No matching customers"}
              </p>
              <p className="text-slate-500 text-sm">
                {customers.length === 0
                  ? "No customers are visible for your role and geographic permissions"
                  : "Try adjusting your search filters"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
