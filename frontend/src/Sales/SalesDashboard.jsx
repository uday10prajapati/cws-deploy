import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import {
  FiUsers,
  FiMapPin,
  FiCamera,
  FiSearch,
  FiX,
  FiCheck,
  FiPhone,
  FiMail,
  FiEdit2,
  FiFileText,
  FiAlertCircle,
  FiDownload,
  FiCheckCircle,
  FiTruck,
  FiClock
} from "react-icons/fi";

const SalesDashboard = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignedArea, setAssignedArea] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomersAdded: 0,
    thisMonthAdded: 0,
    thisWeekAdded: 0,
    todayAdded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [uploading, setUploading] = useState(false);
   useRoleBasedRedirect(["sales"]);
  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    taluko: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    carModel: "",
    carNumber: "",
    carColor: "",
    carImage: null,
    lightBill: null,
    identityProof: null
  });



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

      // Fetch assigned talukas from user_role_assignments table
      const { data: assignedAreaData, error: areaError } = await supabase
        .from("user_role_assignments")
        .select("assigned_talukas")
        .eq("user_id", authUser.id)
        .eq("role", "salesman")
        .single();

      if (areaError && areaError.code !== "PGRST116") {
        console.error("Error fetching assigned area:", areaError);
      }

      if (assignedAreaData && assignedAreaData.assigned_talukas && assignedAreaData.assigned_talukas.length > 0) {
        // Get the first taluka from the array
        const selectedArea = assignedAreaData.assigned_talukas[0];
        setAssignedArea(selectedArea);
        
        // Load sales cars for this sales person
        await loadCustomersForArea(selectedArea, authUser.id);
      } else {
        console.warn("No assigned area found for this sales person");
        setAssignedArea(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersForArea = async (area, salesPersonId) => {
    try {
      const { data: customerData } = await supabase
        .from("sales_cars")
        .select("*")
        .eq("sales_person_id", salesPersonId)
        .order("created_at", { ascending: false });

      if (customerData) {
        setCustomers(customerData);
        calculateStats(customerData);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const calculateStats = (customerList) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthCustomers = customerList.filter(
      (c) => new Date(c.created_at) >= thisMonth
    ).length;
    const weekCustomers = customerList.filter(
      (c) => new Date(c.created_at) >= thisWeek
    ).length;
    const todayCustomers = customerList.filter(
      (c) => new Date(c.created_at) >= today
    ).length;

    setStats({
      totalCustomersAdded: customerList.length,
      thisMonthAdded: monthCustomers,
      thisWeekAdded: weekCustomers,
      todayAdded: todayCustomers,
    });
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      taluko: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      carModel: "",
      carNumber: "",
      carColor: "",
      carImage: null,
      lightBill: null,
      identityProof: null
    });
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      alert("Please fill in name and phone");
      return;
    }

    if (!customerForm.carImage) {
      alert("Please add a car image");
      return;
    }

    if (!customerForm.lightBill || !customerForm.identityProof) {
      alert("Please upload both light bill and identity proof");
      return;
    }

    setUploading(true);
    try {
      // Upload car image
      const carImageName = `sales/${Date.now()}_car_${customerForm.carImage.name}`;
      const { data: carUpload, error: carError } = await supabase.storage
        .from("car-images")
        .upload(carImageName, customerForm.carImage, { upsert: false });

      if (carError) throw carError;

      const { data: carImageUrl } = supabase.storage
        .from("car-images")
        .getPublicUrl(carImageName);

      // Create entry in sales_cars table
      const { data: newCar, error: insertError } = await supabase
        .from("sales_cars")
        .insert({
          id: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sales_person_id: user.id,
          model: customerForm.carModel,
          number_plate: customerForm.carNumber,
          color: customerForm.carColor,
          car_photo_url: carImageUrl.publicUrl,
          customer_name: customerForm.name,
          customer_phone: customerForm.phone,
          customer_email: customerForm.email,
          customer_address: customerForm.address,
          customer_taluko: customerForm.taluko,
          customer_city: customerForm.city,
          customer_state: customerForm.state,
          customer_postal_code: customerForm.postalCode,
          customer_country: customerForm.country,        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Reload cars
      const { data: carsData } = await supabase
        .from("sales_cars")
        .select("*")
        .eq("sales_person_id", user.id)
        .order("created_at", { ascending: false });

      if (carsData) {
        setCustomers(carsData);
        calculateStats(carsData);
      }

      setShowCustomerModal(null);
      resetCustomerForm();
      alert("Customer added successfully with all documents!");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer: " + error.message);
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
      customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_phone?.includes(searchTerm) ||
      customer.customer_taluko?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ▓▓▓ NAVBAR ▓▓▓ */}
      <NavbarNew />

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Sales Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Track customers you've added and manage their car wash registrations
            </p>
          </div>

           {/* 🎯 QUICK ACTIONS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                    {[
                      { to: "/sales-work", icon:FiTruck , label: "My Work", colors: "from-purple-600 to-pink-600", bg: "from-purple-50 to-pink-50", border: "border-purple-200" },
                      { to: "/sales-history", icon: FiClock, label: "History", colors: "from-indigo-600 to-blue-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },

                    ].map(({ to, onClick, icon: Icon, label, colors, bg, border }) => (
                      <Link
                        key={label}
                        to={to}
                        onClick={onClick}
                        className={`group rounded-xl p-5 border ${border} bg-linear-to-br ${bg} shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center cursor-pointer`}
                      >
                        <div className={`text-3xl mb-3 mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-linear-to-r ${colors} text-white group-hover:scale-110 transition-transform`}>
                          <Icon />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{label}</p>
                      </Link>
                    ))}
                  </div>

          {/* Assigned Area Card */}
          {assignedArea && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-600">
              <div className="flex items-center gap-3">
                <FiMapPin className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-slate-600">Your Assigned Area</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {assignedArea}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Today
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.todayAdded}
                  </p>
                </div>
                <FiCheckCircle className="text-4xl text-orange-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Action Button and Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or taluko..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                + Add Customer
              </button>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <FiUsers className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "No customers found matching your search"
                    : "No customers added yet. Add your first customer to get started!"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Taluko</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Car Details</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Documents</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{customer.customer_name || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiPhone className="w-4 h-4" />
                            {customer.customer_phone}
                          </div>
                          {customer.customer_email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <FiMail className="w-3 h-3" />
                              {customer.customer_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                            {customer.customer_taluko || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {customer.car_photo_url ? (
                            <div>
                              <p className="text-sm font-semibold text-gray-700">
                                {customer.model || "N/A"} ({customer.number_plate || "N/A"})
                              </p>
                              {customer.color && <p className="text-xs text-gray-500">{customer.color}</p>}
                              <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                                <FiCheck className="w-4 h-4" />
                                Car Photo Uploaded
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No car info</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {customer.car_photo_url ? (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <FiCheckCircle className="w-4 h-4" />
                                Photo
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">-</div>
                            )}
                            {customer.light_bill_url && customer.identity_proof_url ? (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <FiCheckCircle className="w-4 h-4" />
                                Docs
                              </div>
                            ) : (
                              <div className="text-xs text-amber-600">Pending</div>
                            )}
                          </div>
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

      {/* ▓▓▓ ADD CUSTOMER MODAL ▓▓▓ */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Register New Customer</h3>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  resetCustomerForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Customer Information Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="Enter email (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {/* Assigned Area Display */}
              {assignedArea && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Assigned Area</p>
                  <div className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-lg">
                    📍 {assignedArea}
                  </div>
                </div>
              )}
            </div>

            {/* Car Information Section */}
            <div className="mb-6 pb-6 border-b">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiCamera className="w-5 h-5" />
                Car Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                  <input
                    type="text"
                    value={customerForm.carModel}
                    onChange={(e) => setCustomerForm({ ...customerForm, carModel: e.target.value })}
                    placeholder="e.g., Toyota Fortuner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Number</label>
                  <input
                    type="text"
                    value={customerForm.carNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, carNumber: e.target.value })}
                    placeholder="e.g., MH 02 AB 1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Color</label>
                  <input
                    type="text"
                    value={customerForm.carColor}
                    onChange={(e) => setCustomerForm({ ...customerForm, carColor: e.target.value })}
                    placeholder="e.g., Silver"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Car Photo *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FiCamera className="mx-auto text-4xl text-gray-300 mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCustomerForm({ ...customerForm, carImage: e.target.files?.[0] || null })}
                    className="hidden"
                    id="carImageInput"
                  />
                  <label htmlFor="carImageInput" className="cursor-pointer">
                    <p className="text-sm text-gray-600">
                      {customerForm.carImage ? `✓ ${customerForm.carImage.name}` : "Click to upload car photo"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiFileText className="w-5 h-5" />
                Required Documents
              </h4>
              <p className="text-sm text-gray-600 mb-4">Please upload proof documents to verify customer information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Light Bill / Electricity Bill *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FiFileText className="mx-auto text-2xl text-gray-300 mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCustomerForm({ ...customerForm, lightBill: e.target.files?.[0] || null })}
                      className="hidden"
                      id="lightBillInput"
                    />
                    <label htmlFor="lightBillInput" className="cursor-pointer">
                      <p className="text-xs text-gray-600">
                        {customerForm.lightBill ? `✓ ${customerForm.lightBill.name}` : "Click to upload"}
                      </p>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Identity Proof (Aadhar/PAN/DL) *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <FiFileText className="mx-auto text-2xl text-gray-300 mb-2" />
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCustomerForm({ ...customerForm, identityProof: e.target.files?.[0] || null })}
                      className="hidden"
                      id="idProofInput"
                    />
                    <label htmlFor="idProofInput" className="cursor-pointer">
                      <p className="text-xs text-gray-600">
                        {customerForm.identityProof ? `✓ ${customerForm.identityProof.name}` : "Click to upload"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  resetCustomerForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Register Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
