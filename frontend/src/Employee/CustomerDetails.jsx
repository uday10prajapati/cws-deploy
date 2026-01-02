import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

import { FiArrowLeft, FiEdit2, FiPhone, FiMail, FiMapPin, FiUser, FiCalendar, FiTag, FiMenu } from "react-icons/fi";

export default function CustomerDetails() {
  useRoleBasedRedirect("employee");
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const response = await fetch(`http://localhost:5000/customer/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCustomer(data.data);
          setEditData(data.data);
        } else {
          alert("Customer not found");
          navigate("/employee/customers");
        }
      } catch (err) {
        console.error("Error loading customer:", err);
        alert("Failed to load customer");
        navigate("/employee/customers");
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id, navigate]);

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/customer/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setIsEditing(false);
        alert("Customer updated successfully!");
      }
    } catch (err) {
      console.error("Error saving customer:", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <div className="text-center py-16">
          <p className="text-slate-600">Customer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />


      <main className="lg:ml-64 pt-20 px-4 md:px-6 py-10">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50"
        >
          <FiMenu size={24} className="text-slate-700" />
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/employee/customers")}
              className="p-2 hover:bg-slate-200 rounded-lg transition-all"
            >
            <FiArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Customer Details
            </h1>
            <p className="text-slate-600 text-sm mt-1">View and manage customer information</p>
          </div>
        </div>

        {/* Customer Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-3xl">
                {customer.name?.charAt(0) || "C"}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{customer.name}</h2>
                <p className="text-slate-500 mt-1">Customer ID: {customer.id}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FiEdit2 /> Edit
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FiUser size={18} className="text-blue-600" />
                    {customer.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FiPhone size={18} className="text-blue-600" />
                    {customer.phone || "N/A"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FiMail size={18} className="text-blue-600" />
                    {customer.email || "N/A"}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.city || ""}
                    onChange={(e) => setEditData({...editData, city: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FiMapPin size={18} className="text-blue-600" />
                    {customer.city || "N/A"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Taluka</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.taluka || ""}
                    onChange={(e) => setEditData({...editData, taluka: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <p className="text-lg font-semibold text-slate-900">{customer.taluka || "N/A"}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Address</label>
                {isEditing ? (
                  <textarea
                    value={editData.address || ""}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-24"
                  />
                ) : (
                  <p className="text-sm text-slate-700">{customer.address || "N/A"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Created Date</p>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FiCalendar size={16} className="text-slate-400" />
                {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Status</p>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                Active
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Assigned To</p>
              <p className="text-sm font-medium text-slate-700">{customer.assigned_to_name || "Unassigned"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(customer);
                }}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Related Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Bookings Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiTag className="text-blue-600" />
              Recent Bookings
            </h3>
            <p className="text-slate-600 text-sm">No bookings found for this customer</p>
          </div>

          {/* Notes Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Area Assignments</h3>
            <p className="text-slate-600 text-sm">{customer.taluka || "No area assigned"}</p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
