import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiMenu,
  FiLogOut,
  FiHome,
  FiUsers,
  FiMapPin,
  FiCamera,
  FiSearch,
  FiX,
  FiCheck,
  FiPhone,
  FiMail,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const SalesDashboard = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [myCustomers, setMyCustomers] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalRecorded: 0,
    thisMonthRecorded: 0,
    thisWeekRecorded: 0,
    withCarImage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("find"); // 'find' or 'my-customers'
  const [selectedArea, setSelectedArea] = useState("");
  const [searching, setSearching] = useState(false);
  const [recordingCustomerId, setRecordingCustomerId] = useState(null);

  const areas = [
    "Downtown",
    "North District",
    "South District",
    "East Area",
    "West Area",
    "Central Zone",
    "Suburbs",
  ];

  const salesMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/sales-dashboard" },
    { name: "Documents", icon: "📄", link: "/sales/documents" },
    { name: "Profile", icon: "👤", link: "/sales/profile" },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      // Get customers recorded by this sales person
      const response = await fetch(
        `http://localhost:5000/documents/sales/my-customers`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMyCustomers(data.customers || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomersByArea = async () => {
    if (!selectedArea) {
      alert("Please select an area");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `http://localhost:5000/documents/sales/find-customers?area=${selectedArea}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableCustomers(data.customers || []);
      } else {
        alert("Failed to find customers");
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      alert("Error searching customers");
    } finally {
      setSearching(false);
    }
  };

  const recordCustomer = async (customerId) => {
    setRecordingCustomerId(customerId);
    try {
      const response = await fetch(
        `http://localhost:5000/documents/sales/record-customer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(`✓ ${data.message}`);

        // Remove from available and reload both lists
        setAvailableCustomers(
          availableCustomers.filter((c) => c.id !== customerId)
        );
        loadUserData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error recording customer:", error);
      alert("Failed to record customer");
    } finally {
      setRecordingCustomerId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <Sidebar
        role="sales"
        menu={salesMenu}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Sales Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Find customers by area and record them as your referrals
              </p>
            </div>

            {/* Statistics Cards - Only show when viewing my customers */}
            {activeTab === "my-customers" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">
                        Total Recorded
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.total || 0}
                      </p>
                    </div>
                    <FiUsers className="text-4xl text-indigo-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">
                        This Month
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.thisMonth || 0}
                      </p>
                    </div>
                    <FiMapPin className="text-4xl text-green-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">
                        This Week
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.thisWeek || 0}
                      </p>
                    </div>
                    <FiMapPin className="text-4xl text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">
                        With Car Image
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">
                        {stats.withCarImage || 0}
                      </p>
                    </div>
                    <FiCamera className="text-4xl text-purple-600 opacity-20" />
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-8 border-b">
              <div className="flex">
                <button
                  onClick={() => {
                    setActiveTab("find");
                    setAvailableCustomers([]);
                  }}
                  className={`flex-1 py-4 px-6 font-semibold transition text-center ${
                    activeTab === "find"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  🔍 Find & Record Customers
                </button>
                <button
                  onClick={() => setActiveTab("my-customers")}
                  className={`flex-1 py-4 px-6 font-semibold transition text-center ${
                    activeTab === "my-customers"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  ✓ My Customers ({myCustomers.length})
                </button>
              </div>
            </div>

            {/* TAB 1: Find & Record Customers */}
            {activeTab === "find" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Find Customers by Area
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Area
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {areas.map((area) => (
                      <button
                        key={area}
                        onClick={() => setSelectedArea(area)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          selectedArea === area
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={searchCustomersByArea}
                  disabled={!selectedArea || searching}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search Customers"}
                </button>

                {/* Results */}
                {availableCustomers.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Available Customers in {selectedArea} ({availableCustomers.length})
                    </h3>

                    <div className="space-y-3">
                      {availableCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">
                                {customer.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <FiPhone className="text-lg" /> {customer.phone}
                                </span>
                                {customer.email && (
                                  <span className="flex items-center gap-1">
                                    <FiMail className="text-lg" /> {customer.email}
                                  </span>
                                )}
                              </div>
                              {customer.car_model && (
                                <p className="text-sm text-gray-600 mt-2">
                                  🚗 {customer.car_model} • {customer.car_number}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => recordCustomer(customer.id)}
                              disabled={recordingCustomerId === customer.id}
                              className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition whitespace-nowrap disabled:opacity-50"
                            >
                              {recordingCustomerId === customer.id
                                ? "Recording..."
                                : "Record ✓"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableCustomers.length === 0 && selectedArea && !searching && (
                  <div className="mt-8 text-center py-12">
                    <FiAlertCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">
                      No available customers in {selectedArea}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: My Customers */}
            {activeTab === "my-customers" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {myCustomers.length === 0 ? (
                  <div className="p-12 text-center">
                    <FiUsers className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500">
                      No customers recorded yet. Find and record customers from the "Find & Record" tab.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Contact
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Area
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Car
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Car Image
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                            Recorded
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {myCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            className="border-b hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-800">
                                {customer.name}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-600">
                                {customer.phone}
                              </p>
                              {customer.email && (
                                <p className="text-xs text-gray-500">
                                  {customer.email}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                                {customer.area || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-600">
                                {customer.car_model
                                  ? `${customer.car_model}`
                                  : "No car"}
                              </p>
                              {customer.car_number && (
                                <p className="text-xs text-gray-500">
                                  {customer.car_number}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {customer.car_image_url ? (
                                <div className="flex items-center gap-2">
                                  <FiCheck className="text-green-600 text-lg" />
                                  <span className="text-sm text-green-600">
                                    Uploaded
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  customer.created_at
                                ).toLocaleDateString()}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default SalesDashboard;
