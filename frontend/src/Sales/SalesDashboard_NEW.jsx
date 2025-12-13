import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import {
  FiMenu,
  FiChevronLeft,
  FiLogOut,
  FiHome,
  FiUsers,
  FiMapPin,
  FiCamera,
  FiPlus,
  FiSearch,
  FiX,
  FiCheck,
  FiPhone,
  FiMail,
  FiEdit2
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const SalesDashboard = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomersAdded: 0,
    thisMonthAdded: 0,
    thisWeekAdded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [showEditCustomer, setShowEditCustomer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [carImage, setCarImage] = useState(null);

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
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      // Load customers added by this sales person (from profiles table)
      const { data: customerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("added_by_sales_id", authUser.id)
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (customerData) {
        setCustomers(customerData);
        calculateStats(customerData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerList) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const monthCustomers = customerList.filter(
      (c) => new Date(c.created_at) >= thisMonth
    ).length;
    const weekCustomers = customerList.filter(
      (c) => new Date(c.created_at) >= thisWeek
    ).length;

    setStats({
      totalCustomersAdded: customerList.length,
      thisMonthAdded: monthCustomers,
      thisWeekAdded: weekCustomers,
    });
  };

  const handleAddCarImage = async () => {
    if (!carImage || !showEditCustomer) {
      alert("Please select an image");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${carImage.name}`;

      // Upload car image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sales_customers")
        .upload(fileName, carImage, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("sales_customers")
        .getPublicUrl(fileName);

      // Update customer profile with car image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ car_image_url: publicUrl.publicUrl })
        .eq("id", showEditCustomer.id);

      if (updateError) throw updateError;

      // Update local state
      setCustomers(
        customers.map((c) =>
          c.id === showEditCustomer.id
            ? { ...c, car_image_url: publicUrl.publicUrl }
            : c
        )
      );

      setShowEditCustomer(null);
      setCarImage(null);
      alert("Car image added successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.area?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = selectedArea === "all" || customer.area === selectedArea;

    return matchesSearch && matchesArea;
  });

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
      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <Sidebar
        role="sales"
        menu={salesMenu}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div className="flex-1 flex flex-col">
        {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        {/* ▓▓▓ CONTENT ▓▓▓ */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Sales Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Track customers you've added and manage their car information
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Customers Added
                    </p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stats.totalCustomersAdded}
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
                      {stats.thisMonthAdded}
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
                      {stats.thisWeekAdded}
                    </p>
                  </div>
                  <FiCamera className="text-4xl text-blue-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Areas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customers Grid */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center">
                  <FiUsers className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || selectedArea !== "all"
                      ? "No customers found matching your search"
                      : "No customers added yet. Customers you add will appear here."}
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
                          Added
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800">
                              {customer.name || "N/A"}
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
                                ? `${customer.car_model} (${customer.car_number})`
                                : "No car info"}
                            </p>
                            {customer.car_color && (
                              <p className="text-xs text-gray-500">
                                {customer.car_color}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {customer.car_image_url ? (
                              <div className="flex items-center gap-2">
                                <FiCheck className="text-green-600" />
                                <span className="text-sm text-green-600">
                                  Uploaded
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowEditCustomer(customer)}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                              >
                                <FiCamera className="text-lg" />
                                Add Image
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ▓▓▓ BACKDROP ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* ▓▓▓ EDIT CAR IMAGE MODAL ▓▓▓ */}
      {showEditCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Add Car Image
              </h3>
              <button
                onClick={() => {
                  setShowEditCustomer(null);
                  setCarImage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              <strong>{showEditCustomer.name}</strong> - {showEditCustomer.area}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCarImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {carImage && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {carImage.name} selected
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditCustomer(null);
                  setCarImage(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCarImage}
                disabled={uploading || !carImage}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
