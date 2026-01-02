import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import {
  FiFileText,
  FiDownload,
  FiMapPin,
  FiAlertCircle,
  FiFilter,
  FiX,
  FiSearch,
  FiLock,
} from "react-icons/fi";
import { ROLES } from "../utils/rbacUtils";

export default function AllDocuments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedCities, setAssignedCities] = useState([]);
  const [assignedTalukas, setAssignedTalukas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("all");

  useRoleBasedRedirect("employee");

  useEffect(() => {
    loadUserAndDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, selectedDocType]);

  const loadUserAndDocuments = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        navigate("/login");
        return;
      }

      setUser(auth.user);

      // Get user's role and geographic assignments
      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_type, assigned_cities, assigned_talukas")
        .eq("id", auth.user.id)
        .single();

      if (profile) {
        const role = profile.employee_type;
        setUserRole(role);
        setAssignedCities(profile.assigned_cities || []);
        setAssignedTalukas(profile.assigned_talukas || []);

        // Check if user has access to documents
        if (role === ROLES.SALESMAN) {
          setLoading(false);
          return; // Sales person has no access
        }

        // Load documents based on role
        await loadDocuments(role, auth.user.id, profile.assigned_cities || [], profile.assigned_talukas || []);
      }
    } catch (error) {
      console.error("Error loading user and documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (role, userId, cities, talukas) => {
    try {
      let query = supabase
        .from("sales_cars")
        .select("*")
        .not("car_photo_url", "is", null)
        .or(
          `image_url_1.not.is.null,image_url_2.not.is.null`
        );

      // Fetch all data first, then apply role-based filtering with normalization
      const { data: allData, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      let filteredData = allData || [];
      
      // Apply role-based filtering with city/taluko normalization
      if (role === ROLES.HR_GENERAL) {
        // HR-General: Show only documents from assigned taluka(s)
        if (talukas && talukas.length > 0) {
          const talukasLower = talukas.map(t => t.toLowerCase());
          filteredData = filteredData.filter(doc => 
            talukasLower.includes(doc.customer_taluko?.toLowerCase())
          );
        } else {
          // No talukas assigned, show no documents
          setDocuments([]);
          return;
        }
      } else if (role === ROLES.SUB_GENERAL) {
        // Sub-General: Show documents from assigned city(s) with normalization
        if (cities && cities.length > 0) {
          const normalizeCityName = (city) => {
            return city?.toLowerCase().replace(/\s*\(city\)\s*/gi, '').trim() || '';
          };
          
          const normalizedAssignedCities = cities.map(c => normalizeCityName(c));
          filteredData = filteredData.filter(doc => {
            const normalizedDocCity = normalizeCityName(doc.customer_city);
            return normalizedAssignedCities.includes(normalizedDocCity);
          });
        } else {
          // No cities assigned, show no documents
          setDocuments([]);
          return;
        }
      }
      // GENERAL role: No filtering, show all documents

      // Filter documents that have at least one document URL
      const validDocuments = filteredData.filter(
        (doc) => doc.car_photo_url || doc.image_url_1 || doc.image_url_2
      );

      setDocuments(validDocuments);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          (doc.customer_name &&
            doc.customer_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (doc.customer_phone &&
            doc.customer_phone.includes(searchTerm)) ||
          (doc.number_plate &&
            doc.number_plate
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by document type
    if (selectedDocType !== "all") {
      filtered = filtered.filter((doc) => {
        switch (selectedDocType) {
          case "car_photo":
            return doc.car_photo_url;
          case "address_proof":
            return doc.image_url_1;
          case "light_bill":
            return doc.image_url_2;
          default:
            return true;
        }
      });
    }

    setFilteredDocuments(filtered);
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      car_photo: "Car Photo",
      address_proof: "Address Proof",
      light_bill: "Light Bill",
    };
    return types[type] || type;
  };

  const handleDownload = (url, docName) => {
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = docName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getRoleLabel = () => {
    const labels = {
      [ROLES.GENERAL]: "General",
      [ROLES.SUB_GENERAL]: "Sub-General",
      [ROLES.HR_GENERAL]: "HR-General",
      [ROLES.SALESMAN]: "Sales Person",
    };
    return labels[userRole] || userRole;
  };

  // Sales person access denied
  if (userRole === ROLES.SALESMAN) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pt-20">
        <NavbarNew />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FiLock className="mx-auto text-red-500 mb-4" size={64} />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 text-lg">
              Sales Persons do not have access to the All Documents page.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pt-20">
      <NavbarNew />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            All Documents
          </h1>
          <p className="text-slate-600">
            Manage and view customer documents with role-based access control
          </p>
        </div>

        {/* Role & Access Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FiFileText className="text-blue-600" size={20} />
            <div>
              <p className="font-semibold text-slate-900">
                Your Role: {getRoleLabel()}
              </p>
              {userRole === ROLES.HR_GENERAL && assignedTalukas.length > 0 && (
                <p className="text-sm text-slate-600">
                  Assigned Taluka(s): {assignedTalukas.join(", ")}
                </p>
              )}
              {userRole === ROLES.SUB_GENERAL && assignedCities.length > 0 && (
                <p className="text-sm text-slate-600">
                  Assigned City(s): {assignedCities.join(", ")}
                </p>
              )}
              {userRole === ROLES.GENERAL && (
                <p className="text-sm text-slate-600">
                  Access Level: All documents across all regions
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FiSearch className="inline mr-2" />
                Search Customer
              </label>
              <input
                type="text"
                placeholder="Search by name, phone, or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FiFilter className="inline mr-2" />
                Document Type
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Documents</option>
                <option value="car_photo">Car Photo</option>
                <option value="address_proof">Address Proof</option>
                <option value="light_bill">Light Bill</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="w-full bg-slate-100 rounded-lg p-3">
                <p className="text-sm text-slate-600">Total Documents</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredDocuments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {/* Customer Info */}
                <div className="bg-linear-to-r from-blue-50 to-slate-50 p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-lg">
                    {doc.customer_name || "N/A"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    📱 {doc.customer_phone || "N/A"}
                  </p>
                  <p className="text-sm text-slate-600">
                    🚗 {doc.number_plate || "N/A"}
                  </p>
                  {doc.customer_city && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <FiMapPin size={14} />
                      {doc.customer_city} {doc.customer_taluko && `• ${doc.customer_taluko}`}
                    </p>
                  )}
                </div>

                {/* Documents */}
                <div className="p-4 space-y-3">
                  {/* Car Photo */}
                  {doc.car_photo_url && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        🚗 Car Photo
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.car_photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-blue-600 hover:underline text-sm truncate"
                        >
                          View
                        </a>
                        <button
                          onClick={() =>
                            handleDownload(
                              doc.car_photo_url,
                              `${doc.customer_name}_car_photo`
                            )
                          }
                          className="p-1 text-slate-600 hover:text-blue-600 transition"
                          title="Download"
                        >
                          <FiDownload size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address Proof */}
                  {doc.image_url_1 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        🆔 Address Proof
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.image_url_1}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-blue-600 hover:underline text-sm truncate"
                        >
                          View
                        </a>
                        <button
                          onClick={() =>
                            handleDownload(
                              doc.image_url_1,
                              `${doc.customer_name}_address_proof`
                            )
                          }
                          className="p-1 text-slate-600 hover:text-blue-600 transition"
                          title="Download"
                        >
                          <FiDownload size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Light Bill */}
                  {doc.image_url_2 && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        💡 Light Bill
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.image_url_2}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-blue-600 hover:underline text-sm truncate"
                        >
                          View
                        </a>
                        <button
                          onClick={() =>
                            handleDownload(
                              doc.image_url_2,
                              `${doc.customer_name}_light_bill`
                            )
                          }
                          className="p-1 text-slate-600 hover:text-blue-600 transition"
                          title="Download"
                        >
                          <FiDownload size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500">
                  Registered:{" "}
                  {doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString("en-IN")
                    : "N/A"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiAlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-slate-600 text-lg font-medium">
              No documents found
            </p>
            {searchTerm && (
              <p className="text-slate-500 text-sm mt-2">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        )}

        {/* Access Control Info
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-3">Access Control Rules</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-semibold">Sales Person:</span> No access to
              document viewing
            </li>
            <li>
              <span className="font-semibold">HR-General:</span> View documents
              from assigned taluka(s) only
            </li>
            <li>
              <span className="font-semibold">Sub-General:</span> View documents
              from assigned city(s) and their talukas
            </li>
            <li>
              <span className="font-semibold">General:</span> View all documents
              globally
            </li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}
